package com.travel.service;

import com.travel.dto.request.BookingTourRequest;
import com.travel.dto.response.BookingTourResponse;
import com.travel.entity.BookingTour;
import com.travel.entity.Tour;
import com.travel.entity.User;
import com.travel.enums.BookingStatus;
import com.travel.exception.ResourceNotFoundException;
import com.travel.repository.BookingTourRepository;
import com.travel.repository.TourRepository;
import com.travel.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service xử lý logic nghiệp vụ cho BookingTour
 */
@Service
@Transactional
public class BookingTourService {

    @Autowired
    private BookingTourRepository bookingTourRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private EmailService emailService;

    /**
     * Đặt tour mới
     */
    public BookingTourResponse createBooking(String username, BookingTourRequest request) {
        // Lấy thông tin user
        User user = userRepository.findByUsernameAndDeletedAtIsNull(username)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        // Lấy thông tin tour
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(request.getTourId())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour"));

        // Kiểm tra tour có còn chỗ không
        if (!tour.hasAvailableSlots() || tour.getAvailableSlots() < request.getParticipantsCount()) {
            throw new IllegalArgumentException("Tour không còn đủ chỗ trống");
        }

        // Tính tổng tiền
        BigDecimal totalAmount = tour.getPrice().multiply(BigDecimal.valueOf(request.getParticipantsCount()));

        // Tạo booking
        BookingTour booking = new BookingTour();
        booking.setUser(user);
        booking.setTour(tour);
        booking.setParticipantsCount(request.getParticipantsCount());
        booking.setTotalAmount(totalAmount);
        booking.setContactName(request.getContactName());
        booking.setContactPhone(request.getContactPhone());
        booking.setContactEmail(request.getContactEmail());
        booking.setSpecialRequests(request.getSpecialRequests());
        booking.setInvoiceNumber(generateInvoiceNumber());

        // Cập nhật số lượng người tham gia tour
        tour.increaseParticipants(request.getParticipantsCount());
        tour.increaseTotalBookings();

        // Lưu booking và tour
        BookingTour savedBooking = bookingTourRepository.save(booking);
        tourRepository.save(tour);        // Gửi email xác nhận
        emailService.sendBookingConfirmationEmail(savedBooking);

        BookingTourResponse response = modelMapper.map(savedBooking, BookingTourResponse.class);
        // Map thông tin tour
        if (savedBooking.getTour() != null) {
            response.setTourId(savedBooking.getTour().getId());
            response.setTourName(savedBooking.getTour().getName());
            response.setTourDestination(savedBooking.getTour().getDestination());
        }
        return response;
    }

    /**
     * Lấy danh sách đơn đặt với filter (Admin)
     */
    public Page<BookingTourResponse> getAllBookings(BookingStatus status, String keyword, Pageable pageable) {
        Page<BookingTour> bookings;

        if (status != null && keyword != null && !keyword.trim().isEmpty()) {
            bookings = bookingTourRepository.findByStatusAndContactNameContainingIgnoreCaseAndDeletedAtIsNull(
                status, keyword, pageable);
        } else if (status != null) {
            bookings = bookingTourRepository.findByStatusAndDeletedAtIsNull(status, pageable);
        } else if (keyword != null && !keyword.trim().isEmpty()) {
            bookings = bookingTourRepository.findByContactNameContainingIgnoreCaseAndDeletedAtIsNull(
                keyword, pageable);        } else {
            bookings = bookingTourRepository.findByDeletedAtIsNull(pageable);
        }

        return bookings.map(booking -> {
            BookingTourResponse response = modelMapper.map(booking, BookingTourResponse.class);
            // Map thông tin tour
            if (booking.getTour() != null) {
                response.setTourId(booking.getTour().getId());
                response.setTourName(booking.getTour().getName());
                response.setTourDestination(booking.getTour().getDestination());
            }
            return response;
        });
    }/**
     * Lấy lịch sử đặt tour của user
     */
    public Page<BookingTourResponse> getUserBookings(String username, Pageable pageable) {
        User user = userRepository.findByUsernameAndDeletedAtIsNull(username)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));        
            Page<BookingTour> bookings = bookingTourRepository.findByUserAndDeletedAtIsNull(user, pageable);
        return bookings.map(booking -> {
            BookingTourResponse response = modelMapper.map(booking, BookingTourResponse.class);
            // Map thông tin tour
            if (booking.getTour() != null) {
                response.setTourId(booking.getTour().getId());
                response.setTourName(booking.getTour().getName());
                response.setTourDestination(booking.getTour().getDestination());
            }
            return response;
        });
    }
    /**
     * Lấy chi tiết đơn đặt
     */
    public BookingTourResponse getBookingById(Long id) {        BookingTour booking = bookingTourRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt tour"));
        
        BookingTourResponse response = modelMapper.map(booking, BookingTourResponse.class);
        // Map thông tin tour
        if (booking.getTour() != null) {
            response.setTourId(booking.getTour().getId());
            response.setTourName(booking.getTour().getName());
            response.setTourDestination(booking.getTour().getDestination());
        }
        return response;
    }    /**
     * Cập nhật trạng thái đơn đặt (Admin)
     */
    public BookingTourResponse updateBookingStatus(Long id, BookingStatus status, String notes) {
        try {
            BookingTour booking = bookingTourRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt tour"));

            booking.setStatus(status);
            booking.setNotes(notes);

            // Xử lý theo trạng thái mới
            switch (status) {
                case CONFIRMED:
                    booking.confirm();
                    try {
                        emailService.sendBookingConfirmedEmail(booking);
                    } catch (Exception e) {
                        System.err.println("Failed to send booking confirmed email: " + e.getMessage());
                    }
                    break;
                case CANCELLED:
                    booking.cancel("Hủy bởi admin");
                    // Trả lại số chỗ cho tour
                    try {
                        Tour tour = booking.getTour();
                        if (tour != null) {
                            tour.decreaseParticipants(booking.getParticipantsCount());
                            tourRepository.save(tour);
                        }
                    } catch (Exception e) {
                        System.err.println("Failed to update tour participants: " + e.getMessage());
                    }
                    try {
                        emailService.sendBookingCancelledEmail(booking);
                    } catch (Exception e) {
                        System.err.println("Failed to send booking cancelled email: " + e.getMessage());
                    }
                    break;
                case COMPLETED:
                    booking.complete();
                    break;
                default:
                    break;
            }

            BookingTour savedBooking = bookingTourRepository.save(booking);
            BookingTourResponse response = modelMapper.map(savedBooking, BookingTourResponse.class);
            
            // Map thông tin tour
            if (savedBooking.getTour() != null) {
                response.setTourId(savedBooking.getTour().getId());
                response.setTourName(savedBooking.getTour().getName());
                response.setTourDestination(savedBooking.getTour().getDestination());
            }
            return response;
            
        } catch (Exception e) {
            System.err.println("Error updating booking status: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Không thể cập nhật trạng thái đơn đặt: " + e.getMessage());
        }
    }

    /**
     * Hủy đơn đặt (User hoặc Admin)
     */
    public BookingTourResponse cancelBooking(Long id, String username, String reason) {
        BookingTour booking = bookingTourRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt tour"));

        // Kiểm tra quyền hủy (chỉ người đặt hoặc admin mới được hủy)
        User user = userRepository.findByUsernameAndDeletedAtIsNull(username)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (!booking.getUser().getId().equals(user.getId()) && !user.isAdmin()) {
            throw new IllegalArgumentException("Bạn không có quyền hủy đơn đặt này");
        }

        // Kiểm tra có thể hủy không
        if (!booking.canCancel()) {
            throw new IllegalArgumentException("Không thể hủy đơn đặt ở trạng thái hiện tại");
        }

        // Hủy booking
        booking.cancel(reason);

        // Trả lại số chỗ cho tour
        Tour tour = booking.getTour();
        tour.decreaseParticipants(booking.getParticipantsCount());
        tourRepository.save(tour);

        BookingTour savedBooking = bookingTourRepository.save(booking);        // Gửi email thông báo hủy        
        emailService.sendBookingCancelledEmail(savedBooking);

        BookingTourResponse response = modelMapper.map(savedBooking, BookingTourResponse.class);
        // Map thông tin tour
        if (savedBooking.getTour() != null) {
            response.setTourId(savedBooking.getTour().getId());
            response.setTourName(savedBooking.getTour().getName());
            response.setTourDestination(savedBooking.getTour().getDestination());
        }
        return response;
    }

    /**
     * Thống kê doanh thu theo tháng
     */
    public List<Object[]> getRevenueStatsByMonth(int year) {
        return bookingTourRepository.getRevenueByMonth(year);
    }

    /**
     * Thống kê doanh thu theo quý
     */
    public List<Object[]> getRevenueStatsByQuarter(int year) {
        return bookingTourRepository.getRevenueByQuarter(year);
    }

    /**
     * Thống kê tổng doanh thu theo năm
     */
    public BigDecimal getTotalRevenueByYear(int year) {
        return bookingTourRepository.getTotalRevenueByYear(year);
    }

    /**
     * Lấy tổng số đơn đặt
     */
    public long getTotalBookings() {
        return bookingTourRepository.countByDeletedAtIsNull();
    }

    /**
     * Lấy số đơn đặt mới trong tháng
     */
    public long getNewBookingsThisMonth() {
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        return bookingTourRepository.countByCreatedAtAfterAndDeletedAtIsNull(startOfMonth);
    }

    /**
     * Lấy doanh thu tháng hiện tại
     */
    public BigDecimal getCurrentMonthRevenue() {
        int currentYear = LocalDateTime.now().getYear();
        int currentMonth = LocalDateTime.now().getMonthValue();
        return bookingTourRepository.getRevenueByMonthAndYear(currentMonth, currentYear);
    }

    /**
     * Lấy tỷ lệ tăng trưởng booking
     */
    public double getBookingGrowthRate() {
        long thisMonth = bookingTourRepository.countNewBookingsThisMonth();
        long lastMonth = bookingTourRepository.countNewBookingsLastMonth();
        
        if (lastMonth == 0) return 0.0;
        return ((double) (thisMonth - lastMonth) / lastMonth) * 100;
    }

    /**
     * Lấy thay đổi tỷ lệ hoàn thành
     */
    public double getCompletionRateChange() {
        // Placeholder implementation
        return 1.2; // +1.2%
    }

    /**
     * Lấy thay đổi tỷ lệ hủy
     */
    public double getCancellationRateChange() {
        // Placeholder implementation
        return -0.8; // -0.8%
    }

    // ========== UTILITY METHODS ==========

    /**
     * Tạo mã hóa đơn tự động
     */
    private String generateInvoiceNumber() {
        String prefix = "INV";
        String timestamp = String.valueOf(System.currentTimeMillis());
        String random = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return prefix + "-" + timestamp + "-" + random;
    }

    // ========== STATISTICS METHODS ==========

    /**
     * Tính tỷ lệ hoàn thành booking
     */
    public double getCompletionRate() {
        long totalBookings = getTotalBookings();
        if (totalBookings == 0) return 0.0;
        
        long completedBookings = bookingTourRepository.countByStatus(BookingStatus.COMPLETED);
        return ((double)completedBookings / totalBookings) * 100.0;
    }

    /**
     * Tính tỷ lệ hủy tour
     */
    public double getCancellationRate() {
        long totalBookings = getTotalBookings();
        if (totalBookings == 0) return 0.0;
        
        long cancelledBookings = bookingTourRepository.countByStatus(BookingStatus.CANCELLED);
        return ((double)cancelledBookings / totalBookings) * 100.0;
    }

    /**
     * Thống kê xu hướng booking theo ngày/tuần/tháng
     */
    public List<Object[]> getBookingTrends(int days, String type) {
        LocalDateTime fromDate = LocalDateTime.now().minusDays(days);
        
        switch (type.toLowerCase()) {
            case "daily":                return bookingTourRepository.getBookingTrendsDaily(fromDate);
            case "weekly":
                return bookingTourRepository.getBookingTrendsWeekly(fromDate);
            case "monthly":
                return bookingTourRepository.getBookingTrendsMonthly(fromDate);
            default:
                return bookingTourRepository.getBookingTrendsDaily(fromDate);
        }
    }

    /**
     * Lấy danh sách top tour được book nhiều nhất
     */
    public List<Object[]> getTopBookedTours(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return bookingTourRepository.findTopBookedTours(pageable);
    }

    /**
     * Thống kê booking theo trạng thái
     */
    public List<Object[]> getBookingStatsByStatus() {
        return bookingTourRepository.countBookingsByStatus();
    }
}

package com.travel.repository;

import com.travel.entity.BookingTour;
import com.travel.entity.Tour;
import com.travel.entity.User;
import com.travel.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository cho entity BookingTour
 */
@Repository
public interface BookingTourRepository extends JpaRepository<BookingTour, Long> {

    /**
     * Tìm booking theo user
     */
    @Query("SELECT b FROM BookingTour b WHERE b.deletedAt IS NULL AND b.user = :user ORDER BY b.bookingDate DESC")
    List<BookingTour> findByUser(@Param("user") User user);

    /**
     * Tìm booking theo tour
     */
    @Query("SELECT b FROM BookingTour b WHERE b.deletedAt IS NULL AND b.tour = :tour ORDER BY b.bookingDate DESC")
    List<BookingTour> findByTour(@Param("tour") Tour tour);

    /**
     * Tìm booking theo trạng thái
     */
    @Query("SELECT b FROM BookingTour b WHERE b.deletedAt IS NULL AND b.status = :status ORDER BY b.bookingDate DESC")
    List<BookingTour> findByStatus(@Param("status") BookingStatus status);

    /**
     * Tìm booking có phân trang và filter theo trạng thái
     */
    @Query("SELECT b FROM BookingTour b WHERE b.deletedAt IS NULL AND " +
           "(:status IS NULL OR b.status = :status) " +
           "ORDER BY b.bookingDate DESC")
    Page<BookingTour> findByStatusWithPaging(@Param("status") BookingStatus status, Pageable pageable);

    /**
     * Tìm booking theo user với phân trang
     */
    @Query("SELECT b FROM BookingTour b WHERE b.deletedAt IS NULL AND b.user = :user ORDER BY b.bookingDate DESC")
    Page<BookingTour> findByUserWithPaging(@Param("user") User user, Pageable pageable);

    /**
     * Tìm booking theo ID và chưa bị xóa
     */
    @Query("SELECT b FROM BookingTour b WHERE b.id = :id AND b.deletedAt IS NULL")
    Optional<BookingTour> findByIdAndNotDeleted(@Param("id") Long id);

    /**
     * Tìm booking theo ID và chưa bị xóa
     */
    Optional<BookingTour> findByIdAndDeletedAtIsNull(Long id);

    /**
     * Tìm booking theo user và chưa bị xóa
     */
    Page<BookingTour> findByUserAndDeletedAtIsNull(User user, Pageable pageable);

    /**
     * Tìm booking theo trạng thái và chưa bị xóa
     */
    Page<BookingTour> findByStatusAndDeletedAtIsNull(BookingStatus status, Pageable pageable);

    /**
     * Tìm booking theo tên liên hệ và chưa bị xóa
     */
    Page<BookingTour> findByContactNameContainingIgnoreCaseAndDeletedAtIsNull(String contactName, Pageable pageable);

    /**
     * Tìm booking theo trạng thái và tên liên hệ
     */
    Page<BookingTour> findByStatusAndContactNameContainingIgnoreCaseAndDeletedAtIsNull(
        BookingStatus status, String contactName, Pageable pageable);

    /**
     * Lấy tất cả booking chưa bị xóa
     */
    Page<BookingTour> findByDeletedAtIsNull(Pageable pageable);

    /**
     * Đếm booking chưa bị xóa
     */
    long countByDeletedAtIsNull();

    /**
     * Đếm booking mới sau thời gian và chưa bị xóa
     */
    long countByCreatedAtAfterAndDeletedAtIsNull(LocalDateTime dateTime);

    /**
     * Đếm số booking theo trạng thái
     */
    @Query("SELECT COUNT(b) FROM BookingTour b WHERE b.deletedAt IS NULL AND b.status = :status")
    long countByStatus(@Param("status") BookingStatus status);    /**
     * Thống kê doanh thu theo tháng
     */
    @Query("SELECT MONTH(b.bookingDate) as month, SUM(b.totalAmount) as revenue, COUNT(b) as bookings " +
           "FROM BookingTour b WHERE b.deletedAt IS NULL AND " +
           "YEAR(b.bookingDate) = :year AND " +
           "b.status = 'COMPLETED' " +
           "GROUP BY MONTH(b.bookingDate) " +
           "ORDER BY MONTH(b.bookingDate)")
    List<Object[]> getRevenueByMonth(@Param("year") int year);    /**
     * Thống kê doanh thu theo quý
     */
    @Query("SELECT QUARTER(b.bookingDate) as quarter, SUM(b.totalAmount) as revenue, COUNT(b) as bookings " +
           "FROM BookingTour b WHERE b.deletedAt IS NULL AND " +
           "YEAR(b.bookingDate) = :year AND " +
           "b.status = 'COMPLETED' " +
           "GROUP BY QUARTER(b.bookingDate) " +
           "ORDER BY QUARTER(b.bookingDate)")
    List<Object[]> getRevenueByQuarter(@Param("year") int year);

    /**
     * Tổng doanh thu theo năm
     */
    @Query("SELECT SUM(b.totalAmount) FROM BookingTour b WHERE " +
           "b.deletedAt IS NULL AND YEAR(b.bookingDate) = :year AND " +
           "b.status = 'COMPLETED'")
    BigDecimal getTotalRevenueByYear(@Param("year") int year);

    /**
     * Doanh thu theo tháng và năm cụ thể
     */
    @Query("SELECT SUM(b.totalAmount) FROM BookingTour b WHERE " +
           "b.deletedAt IS NULL AND MONTH(b.bookingDate) = :month AND " +
           "YEAR(b.bookingDate) = :year AND b.status = 'COMPLETED'")
    BigDecimal getRevenueByMonthAndYear(@Param("month") int month, @Param("year") int year);

    /**
     * Top tours được đặt nhiều nhất
     */
    @Query("SELECT b.tour.name, COUNT(b) as bookingCount, SUM(b.totalAmount) as totalRevenue " +
           "FROM BookingTour b WHERE b.deletedAt IS NULL " +
           "GROUP BY b.tour.id, b.tour.name " +
           "ORDER BY bookingCount DESC")
    List<Object[]> findTopBookedTours(Pageable pageable);

    /**
     * Thống kê booking theo trạng thái
     */
    @Query("SELECT b.status, COUNT(b) FROM BookingTour b WHERE b.deletedAt IS NULL GROUP BY b.status")
    List<Object[]> countBookingsByStatus();

    /**
     * Thống kê doanh thu theo năm
     */
    @Query("SELECT FUNCTION('YEAR', b.bookingDate) as year, " +
           "SUM(b.totalAmount) as revenue, " +
           "COUNT(b) as count " +
           "FROM BookingTour b " +
           "WHERE b.deletedAt IS NULL AND b.status IN ('CONFIRMED', 'COMPLETED') " +
           "AND b.bookingDate BETWEEN :startDate AND :endDate " +
           "GROUP BY FUNCTION('YEAR', b.bookingDate) " +
           "ORDER BY year DESC")
    List<Object[]> getRevenueByYear(@Param("startDate") LocalDateTime startDate, 
                                    @Param("endDate") LocalDateTime endDate);

    /**
     * Tính tổng doanh thu
     */
    @Query("SELECT SUM(b.totalAmount) FROM BookingTour b WHERE b.deletedAt IS NULL AND b.status IN ('CONFIRMED', 'COMPLETED')")
    BigDecimal getTotalRevenue();

    /**
     * Tìm booking của user cho tour cụ thể
     */
    @Query("SELECT b FROM BookingTour b WHERE b.deletedAt IS NULL AND b.user = :user AND b.tour = :tour")
    List<BookingTour> findByUserAndTour(@Param("user") User user, @Param("tour") Tour tour);    /**
     * Kiểm tra user đã đặt tour này chưa
     */
    @Query("SELECT COUNT(b) > 0 FROM BookingTour b WHERE b.deletedAt IS NULL AND b.user = :user AND b.tour = :tour AND b.status IN ('CONFIRMED', 'COMPLETED')")
    boolean hasUserBookedTour(@Param("user") User user, @Param("tour") Tour tour);

    /**
     * Thống kê xu hướng booking theo ngày
     */
    @Query("SELECT DATE(b.bookingDate) as date, COUNT(b) as count " +
           "FROM BookingTour b " +
           "WHERE b.deletedAt IS NULL AND b.bookingDate >= :fromDate " +
           "GROUP BY DATE(b.bookingDate) " +
           "ORDER BY date DESC")
    List<Object[]> getBookingTrendsDaily(@Param("fromDate") LocalDateTime fromDate);

    /**
     * Thống kê xu hướng booking theo tuần
     */
    @Query("SELECT FUNCTION('YEARWEEK', b.bookingDate) as week, " +
           "COUNT(b) as count, " +
           "MIN(b.bookingDate) as weekStart " +
           "FROM BookingTour b " +
           "WHERE b.deletedAt IS NULL AND b.bookingDate >= :fromDate " +
           "GROUP BY FUNCTION('YEARWEEK', b.bookingDate) " +
           "ORDER BY week DESC")
    List<Object[]> getBookingTrendsWeekly(@Param("fromDate") LocalDateTime fromDate);

    /**
     * Thống kê xu hướng booking theo tháng
     */
    @Query("SELECT FUNCTION('YEAR', b.bookingDate) as year, " +
           "FUNCTION('MONTH', b.bookingDate) as month, " +
           "COUNT(b) as count " +
           "FROM BookingTour b " +
           "WHERE b.deletedAt IS NULL AND b.bookingDate >= :fromDate " +
           "GROUP BY FUNCTION('YEAR', b.bookingDate), FUNCTION('MONTH', b.bookingDate) " +
           "ORDER BY year DESC, month DESC")
    List<Object[]> getBookingTrendsMonthly(@Param("fromDate") LocalDateTime fromDate);

    /**
     * Đếm bookings mới tháng này
     */
    @Query(value = "SELECT COUNT(*) FROM booking_tours b " +
           "WHERE b.deleted_at IS NULL " +
           "AND YEAR(b.created_at) = YEAR(CURRENT_DATE) " +
           "AND MONTH(b.created_at) = MONTH(CURRENT_DATE)", nativeQuery = true)
    long countNewBookingsThisMonth();

    /**
     * Đếm bookings mới tháng trước
     */
    @Query(value = "SELECT COUNT(*) FROM booking_tours b " +
           "WHERE b.deleted_at IS NULL " +
           "AND YEAR(b.created_at) = YEAR(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)) " +
           "AND MONTH(b.created_at) = MONTH(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH))", nativeQuery = true)
    long countNewBookingsLastMonth();

    /**
     * Đếm bookings theo trạng thái và chưa bị xóa
     */
    long countByStatusAndDeletedAtIsNull(String status);
}

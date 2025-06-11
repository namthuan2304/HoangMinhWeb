package com.travel.service;

import com.travel.dto.request.TourRequest;
import com.travel.dto.response.TourResponse;
import com.travel.entity.Tour;
import com.travel.enums.TourStatus;
import com.travel.enums.TourType;
import com.travel.exception.ResourceNotFoundException;
import com.travel.repository.TourRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service xử lý logic nghiệp vụ cho Tour
 */
@Service
@Transactional
public class TourService {

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private FileUploadService fileUploadService;

    /**
     * Lấy danh sách tất cả tour với phân trang
     */
    public Page<TourResponse> getAllTours(Pageable pageable) {
        Page<Tour> tours = tourRepository.findByDeletedAtIsNull(pageable);
        return tours.map(tour -> modelMapper.map(tour, TourResponse.class));
    }

    /**
     * Tìm kiếm tour
     */
    public Page<TourResponse> searchTours(String keyword, TourType tourType, TourStatus status,
                                         BigDecimal minPrice, BigDecimal maxPrice,
                                         LocalDate startDate, LocalDate endDate,
                                         Pageable pageable) {
        Page<Tour> tours = tourRepository.advancedSearch(
            keyword, tourType, status, minPrice, maxPrice, startDate, endDate, pageable);
        return tours.map(tour -> modelMapper.map(tour, TourResponse.class));
    }

    /**
     * Lấy thông tin tour theo ID
     */
    public TourResponse getTourById(Long id) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour với ID: " + id));
        return modelMapper.map(tour, TourResponse.class);
    }

    /**
     * Tạo tour mới
     */
    public TourResponse createTour(TourRequest request) {
        // Validate ngày
        if (request.getReturnDate() != null && 
            request.getReturnDate().isBefore(request.getDepartureDate())) {
            throw new IllegalArgumentException("Ngày kết thúc không thể trước ngày khởi hành");
        }

        Tour tour = modelMapper.map(request, Tour.class);
        tour.setCurrentParticipants(0);
        tour.setRatingAverage(0.0);
        tour.setTotalBookings(0);

        Tour savedTour = tourRepository.save(tour);
        return modelMapper.map(savedTour, TourResponse.class);
    }

    /**
     * Cập nhật tour
     */
    public TourResponse updateTour(Long id, TourRequest request) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour với ID: " + id));

        // Validate ngày
        if (request.getReturnDate() != null && 
            request.getReturnDate().isBefore(request.getDepartureDate())) {
            throw new IllegalArgumentException("Ngày kết thúc không thể trước ngày khởi hành");
        }

        // Cập nhật thông tin
        tour.setName(request.getName());
        tour.setDescription(request.getDescription());
        tour.setPrice(request.getPrice());
        tour.setDepartureDate(request.getDepartureDate());
        tour.setReturnDate(request.getReturnDate());
        tour.setDestination(request.getDestination());
        tour.setDepartureLocation(request.getDepartureLocation());
        tour.setMaxParticipants(request.getMaxParticipants());
        tour.setStatus(request.getStatus());
        tour.setTourType(request.getTourType());
        tour.setDurationDays(request.getDurationDays());
        tour.setItinerary(request.getItinerary());
        tour.setIncludes(request.getIncludes());
        tour.setExcludes(request.getExcludes());
        tour.setTermsConditions(request.getTermsConditions());
        tour.setIsFeatured(request.getIsFeatured());

        Tour savedTour = tourRepository.save(tour);
        return modelMapper.map(savedTour, TourResponse.class);
    }

    /**
     * Xóa tour (soft delete)
     */
    public void deleteTour(Long id) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour với ID: " + id));
        
        tour.markAsDeleted();
        tourRepository.save(tour);
    }

    /**
     * Upload ảnh chính cho tour
     */
    public TourResponse uploadMainImage(Long id, MultipartFile file) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour với ID: " + id));

        String imageUrl = fileUploadService.uploadFile(file, "tours");
        
        // Xóa ảnh cũ nếu có
        if (tour.getMainImageUrl() != null) {
            fileUploadService.deleteFile(tour.getMainImageUrl());
        }
        
        tour.setMainImageUrl(imageUrl);
        Tour savedTour = tourRepository.save(tour);
        return modelMapper.map(savedTour, TourResponse.class);
    }

    /**
     * Đặt ảnh chính cho tour từ URL có sẵn
     */
    public TourResponse setMainImage(Long id, String imageUrl) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour với ID: " + id));

        // Kiểm tra xem imageUrl có trong danh sách imageUrls của tour không
        if (!tour.getImageUrls().contains(imageUrl)) {
            throw new IllegalArgumentException("URL ảnh không thuộc về tour này");
        }
        
        tour.setMainImageUrl(imageUrl);
        Tour savedTour = tourRepository.save(tour);
        return modelMapper.map(savedTour, TourResponse.class);
    }

    /**
     * Upload nhiều ảnh cho tour
     */
    public TourResponse uploadImages(Long id, MultipartFile[] files) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour với ID: " + id));

        List<String> imageUrls = fileUploadService.uploadMultipleFiles(files, "tours");
        tour.getImageUrls().addAll(imageUrls);
        
        Tour savedTour = tourRepository.save(tour);
        return modelMapper.map(savedTour, TourResponse.class);
    }

    /**
     * Xóa ảnh của tour
     */
    public TourResponse deleteImage(Long id, String imageUrl) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour với ID: " + id));

        if (tour.getMainImageUrl() != null && tour.getMainImageUrl().equals(imageUrl)) {
            tour.setMainImageUrl(null);
        } else {
            tour.getImageUrls().remove(imageUrl);
        }
        
        fileUploadService.deleteFile(imageUrl);
        
        Tour savedTour = tourRepository.save(tour);
        return modelMapper.map(savedTour, TourResponse.class);
    }

    /**
     * Lấy tour hot (được đặt nhiều nhất)
     */
    public Page<TourResponse> getHotTours(Pageable pageable) {
        Page<Tour> tours = tourRepository.findHotTours(pageable);
        return tours.map(tour -> modelMapper.map(tour, TourResponse.class));
    }

    /**
     * Lấy tour nổi bật
     */
    public Page<TourResponse> getFeaturedTours(Pageable pageable) {
        Page<Tour> tours = tourRepository.findByIsFeaturedTrueAndDeletedAtIsNull(pageable);
        return tours.map(tour -> modelMapper.map(tour, TourResponse.class));
    }

    /**
     * Lấy tour có sẵn
     */
    public Page<TourResponse> getAvailableTours(Pageable pageable) {
        Page<Tour> tours = tourRepository.findAvailableTours(pageable);
        return tours.map(tour -> modelMapper.map(tour, TourResponse.class));
    }

    /**
     * Lấy tour theo loại
     */
    public Page<TourResponse> getToursByType(TourType tourType, Pageable pageable) {
        Page<Tour> tours = tourRepository.findByTourTypeAndDeletedAtIsNull(tourType, pageable);
        return tours.map(tour -> modelMapper.map(tour, TourResponse.class));
    }

    /**
     * Tìm tour liên quan
     */
    public List<TourResponse> getRelatedTours(Long tourId, int limit) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(tourId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour với ID: " + tourId));

        Pageable pageable = PageRequest.of(0, limit);
        List<Tour> relatedTours = tourRepository.findRelatedToursByDestination(
            tour.getDestination(), tourId, pageable);
        
        return relatedTours.stream()
            .map(t -> modelMapper.map(t, TourResponse.class))
            .toList();
    }

    /**
     * Cập nhật trạng thái tour
     */
    public TourResponse updateTourStatus(Long id, TourStatus status) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour với ID: " + id));
        
        tour.setStatus(status);
        Tour savedTour = tourRepository.save(tour);
        return modelMapper.map(savedTour, TourResponse.class);
    }

    /**
     * Đánh dấu tour là nổi bật
     */
    public TourResponse toggleFeatured(Long id) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour với ID: " + id));
        
        tour.setIsFeatured(!tour.getIsFeatured());
        Tour savedTour = tourRepository.save(tour);
        return modelMapper.map(savedTour, TourResponse.class);
    }

    /**
     * Lấy thống kê tour
     */
    public TourStatistics getTourStatistics() {
        long totalTours = tourRepository.countByDeletedAtIsNull();
        long activeTours = tourRepository.countByStatusAndDeletedAtIsNull(TourStatus.ACTIVE);
        long domesticTours = tourRepository.countByDeletedAtIsNull(); // Cần thêm method cho TourType
        
        return new TourStatistics(totalTours, activeTours, domesticTours);
    }

    /**
     * DTO cho thống kê tour
     */
    public static class TourStatistics {
        private final long total;
        private final long active;
        private final long domestic;

        public TourStatistics(long total, long active, long domestic) {
            this.total = total;
            this.active = active;
            this.domestic = domestic;
        }

        public long getTotal() { return total; }
        public long getActive() { return active; }
        public long getDomestic() { return domestic; }
    }

    /**
     * Lấy doanh thu theo tháng
     */
    public List<Object[]> getRevenueByMonth(int year) {
        return tourRepository.getRevenueByMonth(year);
    }

    /**
     * Tăng số người tham gia tour
     */
    public void increaseParticipants(Long tourId, int count) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(tourId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour với ID: " + tourId));
        
        tour.increaseParticipants(count);
        tour.increaseTotalBookings();
        tourRepository.save(tour);
    }

    /**
     * Giảm số người tham gia tour
     */
    public void decreaseParticipants(Long tourId, int count) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(tourId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour với ID: " + tourId));
        
        tour.decreaseParticipants(count);
        tourRepository.save(tour);
    }

    /**
     * Cập nhật rating trung bình
     */
    public void updateAverageRating(Long tourId, double averageRating) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(tourId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour với ID: " + tourId));
        
        tour.setRatingAverage(averageRating);
        tourRepository.save(tour);
    }

    /**
     * Lấy tổng số tours
     */
    public long getTotalTours() {
        return tourRepository.countByDeletedAtIsNull();
    }

    /**
     * Lấy danh sách tours đang hoạt động
     */
    public List<Tour> getActiveTours() {
        return tourRepository.findByStatusAndDeletedAtIsNull(TourStatus.ACTIVE);
    }

    /**
     * Thống kê tours theo loại
     */
    public List<Object[]> getTourStatsByType() {
        return tourRepository.countToursByType();
    }

    /**
     * Thống kê tours theo trạng thái
     */
    public List<Object[]> getTourStatsByStatus() {
        return tourRepository.countToursByStatus();
    }

    /**
     * Lấy thống kê comments theo rating cho tour
     */
    public Map<String, Object> getTourCommentStats(Long tourId) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(tourId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour với ID: " + tourId));
        
        // This would need to be implemented in CommentRepository
        // For now, return basic stats
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalComments", tour.getTotalBookings()); // Placeholder
        stats.put("averageRating", tour.getRatingAverage());
        return stats;
    }
}

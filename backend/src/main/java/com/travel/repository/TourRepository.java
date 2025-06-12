package com.travel.repository;

import com.travel.entity.Tour;
import com.travel.enums.TourStatus;
import com.travel.enums.TourType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository cho Tour entity
 */
@Repository
public interface TourRepository extends JpaRepository<Tour, Long> {

    // Tìm tour theo ID và chưa bị xóa
    Optional<Tour> findByIdAndDeletedAtIsNull(Long id);

    // Lấy tất cả tour chưa bị xóa
    Page<Tour> findByDeletedAtIsNull(Pageable pageable);

    // Tìm kiếm tour theo tên
    Page<Tour> findByNameContainingIgnoreCaseAndDeletedAtIsNull(String name, Pageable pageable);

    // Tìm kiếm tour theo điểm đến
    Page<Tour> findByDestinationContainingIgnoreCaseAndDeletedAtIsNull(String destination, Pageable pageable);

    // Tìm kiếm tour theo tên hoặc điểm đến
    @Query("SELECT t FROM Tour t WHERE (LOWER(t.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(t.destination) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND t.deletedAt IS NULL")
    Page<Tour> findByKeywordAndDeletedAtIsNull(@Param("keyword") String keyword, Pageable pageable);

    // Filter tour theo loại
    Page<Tour> findByTourTypeAndDeletedAtIsNull(TourType tourType, Pageable pageable);

    // Filter tour theo trạng thái
    Page<Tour> findByStatusAndDeletedAtIsNull(TourStatus status, Pageable pageable);

    // Tìm kiếm và filter
    @Query("SELECT t FROM Tour t WHERE " +
           "(LOWER(t.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(t.destination) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:tourType IS NULL OR t.tourType = :tourType) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND t.deletedAt IS NULL")
    Page<Tour> findByKeywordAndFilters(@Param("keyword") String keyword,
                                      @Param("tourType") TourType tourType,
                                      @Param("status") TourStatus status,
                                      Pageable pageable);

    // Tìm tour theo khoảng giá
    @Query("SELECT t FROM Tour t WHERE t.price BETWEEN :minPrice AND :maxPrice " +
           "AND t.deletedAt IS NULL")    Page<Tour> findByPriceRange(@Param("minPrice") BigDecimal minPrice,
                               @Param("maxPrice") BigDecimal maxPrice,
                               Pageable pageable);

    // Tìm tour theo ngày khởi hành
    Page<Tour> findByDepartureDateBetweenAndDeletedAtIsNull(LocalDate startDate, LocalDate endDate, Pageable pageable);

    // Lấy tour hot (được đặt nhiều nhất)
    @Query("SELECT t FROM Tour t WHERE t.deletedAt IS NULL ORDER BY t.totalBookings DESC")
    Page<Tour> findHotTours(Pageable pageable);

    // Lấy tour nổi bật
    Page<Tour> findByIsFeaturedTrueAndDeletedAtIsNull(Pageable pageable);

    // Tìm tour có sẵn (chưa đầy chỗ và đang hoạt động)
    @Query("SELECT t FROM Tour t WHERE t.status = 'ACTIVE' " +
           "AND t.currentParticipants < t.maxParticipants " +
           "AND t.departureDate >= CURRENT_DATE " +
           "AND t.deletedAt IS NULL")
    Page<Tour> findAvailableTours(Pageable pageable);

    // Đếm số tour theo trạng thái
    long countByStatusAndDeletedAtIsNull(TourStatus status);

    // Đếm tổng số tour
    long countByDeletedAtIsNull();

    // Thống kê doanh thu theo tháng
    @Query("SELECT MONTH(bt.bookingDate) as month, SUM(bt.totalAmount) as revenue " +
           "FROM BookingTour bt WHERE YEAR(bt.bookingDate) = :year " +
           "AND bt.status = 'CONFIRMED' " +
           "GROUP BY MONTH(bt.bookingDate) " +
           "ORDER BY month")
    List<Object[]> getRevenueByMonth(@Param("year") int year);

    // Lấy top tour được đặt nhiều nhất
    @Query("SELECT t FROM Tour t WHERE t.deletedAt IS NULL " +
           "ORDER BY t.totalBookings DESC")
    List<Tour> findTopBookedTours(Pageable pageable);

    // Tìm tour liên quan theo điểm đến
    @Query("SELECT t FROM Tour t WHERE t.destination = :destination " +
           "AND t.id != :excludeId AND t.status = 'ACTIVE' " +
           "AND t.deletedAt IS NULL")
    List<Tour> findRelatedToursByDestination(@Param("destination") String destination,
                                           @Param("excludeId") Long excludeId,
                                           Pageable pageable);

    // Advanced search
    @Query("SELECT t FROM Tour t WHERE " +
           "(:keyword IS NULL OR LOWER(t.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(t.destination) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:tourType IS NULL OR t.tourType = :tourType) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:minPrice IS NULL OR t.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR t.price <= :maxPrice) " +
           "AND (:startDate IS NULL OR t.departureDate >= :startDate) " +
           "AND (:endDate IS NULL OR t.departureDate <= :endDate) " +
           "AND t.deletedAt IS NULL")
    Page<Tour> advancedSearch(@Param("keyword") String keyword,
                             @Param("tourType") TourType tourType,
                             @Param("status") TourStatus status,
                             @Param("minPrice") BigDecimal minPrice,
                             @Param("maxPrice") BigDecimal maxPrice,
                             @Param("startDate") LocalDate startDate,
                             @Param("endDate") LocalDate endDate,
                             Pageable pageable);

    /**
     * Tìm tour theo ID và chưa bị xóa
     */
    @Query("SELECT t FROM Tour t WHERE t.id = :id AND t.deletedAt IS NULL")
    Optional<Tour> findByIdAndNotDeleted(@Param("id") Long id);

    /**
     * Tìm tours đang hoạt động
     */
    List<Tour> findByStatusAndDeletedAtIsNull(TourStatus status);

    /**
     * Thống kê số lượng tours theo loại
     */
    @Query("SELECT t.tourType, COUNT(t) FROM Tour t WHERE t.deletedAt IS NULL GROUP BY t.tourType")
    List<Object[]> countToursByType();

    /**
     * Thống kê số lượng tours theo trạng thái
     */
    @Query("SELECT t.status, COUNT(t) FROM Tour t WHERE t.deletedAt IS NULL GROUP BY t.status")
    List<Object[]> countToursByStatus();

    /**
     * Tìm tours theo danh sách IDs và chưa bị xóa
     */
    List<Tour> findByIdInAndDeletedAtIsNull(List<Long> ids);

    // ========== STATISTICS METHODS ==========

    /**
     * Đếm tours được tạo sau thời điểm và chưa bị xóa
     */
    long countByCreatedAtAfterAndDeletedAtIsNull(LocalDateTime createdAt);

    /**
     * Lấy đánh giá trung bình của tất cả tours
     */
    @Query("SELECT AVG(t.ratingAverage) FROM Tour t WHERE t.deletedAt IS NULL AND t.ratingAverage > 0")
    Double getAverageRating();

    /**
     * Đếm số tours có booking
     */
    @Query("SELECT COUNT(DISTINCT t) FROM Tour t " +
           "INNER JOIN BookingTour b ON t = b.tour " +
           "WHERE t.deletedAt IS NULL AND b.deletedAt IS NULL")
    long countToursWithBookings();

    /**
     * Lấy điểm đến phổ biến
     */
    @Query("SELECT t.destination, COUNT(t) as tourCount, SUM(t.totalBookings) as totalBookings " +
           "FROM Tour t " +
           "WHERE t.deletedAt IS NULL " +
           "GROUP BY t.destination " +
           "ORDER BY totalBookings DESC, tourCount DESC")
    List<Object[]> getPopularDestinations(Pageable pageable);

    /**
     * Thống kê phân bố tours theo danh mục
     */
    @Query("SELECT " +
           "CASE " +
           "  WHEN t.tourType = 'DOMESTIC' THEN 'Trong nước' " +
           "  WHEN t.tourType = 'INTERNATIONAL' THEN 'Quốc tế' " +
           "  ELSE 'Khác' " +
           "END as category, " +
           "COUNT(t) as count " +
           "FROM Tour t " +
           "WHERE t.deletedAt IS NULL " +
           "GROUP BY t.tourType " +
           "ORDER BY count DESC")
    List<Object[]> getTourCategoryDistribution();

    /**
     * Top tours hiệu quả nhất (theo booking và rating)
     */
    @Query("SELECT t.id, t.name, t.destination, t.totalBookings, t.ratingAverage, " +
           "COALESCE(SUM(b.totalAmount), 0) as totalRevenue " +
           "FROM Tour t LEFT JOIN BookingTour b ON t = b.tour AND b.deletedAt IS NULL " +
           "WHERE t.deletedAt IS NULL " +
           "GROUP BY t.id, t.name, t.destination, t.totalBookings, t.ratingAverage " +
           "ORDER BY t.totalBookings DESC, t.ratingAverage DESC, totalRevenue DESC")
    List<Object[]> getTopPerformanceTours(Pageable pageable);

    /**
     * Tours mới nhất
     */
    @Query("SELECT t.id, t.name, t.destination, t.price, t.createdAt, t.status " +
           "FROM Tour t " +
           "WHERE t.deletedAt IS NULL " +
           "ORDER BY t.createdAt DESC")
    List<Object[]> getRecentTours(Pageable pageable);

    /**
     * Thống kê doanh thu theo tours
     */
    @Query("SELECT t.id, t.name, COUNT(b) as bookingCount, SUM(b.totalAmount) as revenue " +
           "FROM Tour t LEFT JOIN BookingTour b ON t = b.tour " +
           "AND b.deletedAt IS NULL AND b.createdAt >= :fromDate " +
           "WHERE t.deletedAt IS NULL " +
           "GROUP BY t.id, t.name " +
           "HAVING COUNT(b) > 0 " +
           "ORDER BY revenue DESC")
    List<Object[]> getTourRevenueBreakdown(@Param("fromDate") LocalDateTime fromDate);

    /**
     * Thống kê phân bố đánh giá tours
     */
    @Query("SELECT " +
           "CASE " +
           "  WHEN t.ratingAverage >= 4.5 THEN '4.5-5 sao' " +
           "  WHEN t.ratingAverage >= 4.0 THEN '4-4.5 sao' " +
           "  WHEN t.ratingAverage >= 3.5 THEN '3.5-4 sao' " +
           "  WHEN t.ratingAverage >= 3.0 THEN '3-3.5 sao' " +
           "  WHEN t.ratingAverage > 0 THEN 'Dưới 3 sao' " +
           "  ELSE 'Chưa có đánh giá' " +
           "END as ratingRange, " +
           "COUNT(t) as count " +
           "FROM Tour t " +
           "WHERE t.deletedAt IS NULL " +
           "GROUP BY " +
           "CASE " +
           "  WHEN t.ratingAverage >= 4.5 THEN '4.5-5 sao' " +
           "  WHEN t.ratingAverage >= 4.0 THEN '4-4.5 sao' " +
           "  WHEN t.ratingAverage >= 3.5 THEN '3.5-4 sao' " +
           "  WHEN t.ratingAverage >= 3.0 THEN '3-3.5 sao' " +
           "  WHEN t.ratingAverage > 0 THEN 'Dưới 3 sao' " +
           "  ELSE 'Chưa có đánh giá' " +           "END " +
           "ORDER BY count DESC")
    List<Object[]> getTourRatingDistribution();

    /**
     * Đếm tours mới tháng này
     */
    @Query(value = "SELECT COUNT(*) FROM tours t " +
           "WHERE t.deleted_at IS NULL " +
           "AND YEAR(t.created_at) = YEAR(CURRENT_DATE) " +
           "AND MONTH(t.created_at) = MONTH(CURRENT_DATE)", nativeQuery = true)
    long countNewToursThisMonth();

    /**
     * Đếm tours mới tháng trước
     */
    @Query(value = "SELECT COUNT(*) FROM tours t " +
           "WHERE t.deleted_at IS NULL " +
           "AND YEAR(t.created_at) = YEAR(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)) " +
           "AND MONTH(t.created_at) = MONTH(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH))", nativeQuery = true)
    long countNewToursLastMonth();

    /**
     * Đếm tours theo khoảng thời gian tạo
     */
    long countByCreatedAtGreaterThanEqualAndDeletedAtIsNull(LocalDateTime fromDate);
}

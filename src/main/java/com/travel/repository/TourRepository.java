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
}
    @Query("SELECT t FROM Tour t WHERE t.deletedAt IS NULL AND t.status = 'ACTIVE' AND t.currentParticipants < t.maxParticipants")
    List<Tour> findAvailableTours();

    /**
     * Tìm tour theo ID và chưa bị xóa
     */
    @Query("SELECT t FROM Tour t WHERE t.id = :id AND t.deletedAt IS NULL")
    Optional<Tour> findByIdAndNotDeleted(@Param("id") Long id);
}

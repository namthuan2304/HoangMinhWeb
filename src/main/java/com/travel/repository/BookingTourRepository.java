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
     * Đếm số booking theo trạng thái
     */
    @Query("SELECT COUNT(b) FROM BookingTour b WHERE b.deletedAt IS NULL AND b.status = :status")
    long countByStatus(@Param("status") BookingStatus status);

    /**
     * Thống kê doanh thu theo tháng
     */
    @Query("SELECT FUNCTION('MONTH', b.bookingDate) as month, " +
           "FUNCTION('YEAR', b.bookingDate) as year, " +
           "SUM(b.totalAmount) as revenue, " +
           "COUNT(b) as count " +
           "FROM BookingTour b " +
           "WHERE b.deletedAt IS NULL AND b.status IN ('CONFIRMED', 'COMPLETED') " +
           "AND b.bookingDate BETWEEN :startDate AND :endDate " +
           "GROUP BY FUNCTION('YEAR', b.bookingDate), FUNCTION('MONTH', b.bookingDate) " +
           "ORDER BY year DESC, month DESC")
    List<Object[]> getRevenueByMonth(@Param("startDate") LocalDateTime startDate, 
                                     @Param("endDate") LocalDateTime endDate);

    /**
     * Thống kê doanh thu theo quý
     */
    @Query("SELECT FUNCTION('QUARTER', b.bookingDate) as quarter, " +
           "FUNCTION('YEAR', b.bookingDate) as year, " +
           "SUM(b.totalAmount) as revenue, " +
           "COUNT(b) as count " +
           "FROM BookingTour b " +
           "WHERE b.deletedAt IS NULL AND b.status IN ('CONFIRMED', 'COMPLETED') " +
           "AND b.bookingDate BETWEEN :startDate AND :endDate " +
           "GROUP BY FUNCTION('YEAR', b.bookingDate), FUNCTION('QUARTER', b.bookingDate) " +
           "ORDER BY year DESC, quarter DESC")
    List<Object[]> getRevenueByQuarter(@Param("startDate") LocalDateTime startDate, 
                                       @Param("endDate") LocalDateTime endDate);

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
    List<BookingTour> findByUserAndTour(@Param("user") User user, @Param("tour") Tour tour);

    /**
     * Kiểm tra user đã đặt tour này chưa
     */
    @Query("SELECT COUNT(b) > 0 FROM BookingTour b WHERE b.deletedAt IS NULL AND b.user = :user AND b.tour = :tour AND b.status IN ('CONFIRMED', 'COMPLETED')")
    boolean hasUserBookedTour(@Param("user") User user, @Param("tour") Tour tour);
}

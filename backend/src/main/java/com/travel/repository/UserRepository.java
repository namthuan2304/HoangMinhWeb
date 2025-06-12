package com.travel.repository;

import com.travel.entity.User;
import com.travel.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository cho entity User
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Tìm user theo username
     */
    Optional<User> findByUsername(String username);

    /**
     * Tìm user theo email
     */
    Optional<User> findByEmail(String email);

    /**
     * Tìm user theo username hoặc email
     */
    Optional<User> findByUsernameOrEmail(String username, String email);

    /**
     * Tìm user theo email verification token
     */
    Optional<User> findByEmailVerificationToken(String token);

    /**
     * Tìm user theo password reset token
     */
    Optional<User> findByPasswordResetToken(String token);

    /**
     * Kiểm tra username đã tồn tại hay chưa
     */
    boolean existsByUsername(String username);

    /**
     * Kiểm tra email đã tồn tại hay chưa
     */
    boolean existsByEmail(String email);

    /**
     * Tìm user theo vai trò
     */
    List<User> findByRole(UserRole role);

    /**
     * Tìm user theo trạng thái kích hoạt
     */
    List<User> findByIsActive(Boolean isActive);

    /**
     * Tìm user chưa bị xóa
     */
    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL")
    List<User> findAllNotDeleted();

    /**
     * Tìm user có phân trang và tìm kiếm
     */
    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND " +
           "(LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findBySearchTerm(@Param("search") String search, Pageable pageable);

    /**
     * Thống kê số lượng user theo tháng
     */
    @Query("SELECT FUNCTION('MONTH', u.createdAt) as month, " +
           "FUNCTION('YEAR', u.createdAt) as year, " +
           "COUNT(u) as count " +
           "FROM User u " +
           "WHERE u.deletedAt IS NULL AND u.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY FUNCTION('YEAR', u.createdAt), FUNCTION('MONTH', u.createdAt) " +
           "ORDER BY year DESC, month DESC")
    List<Object[]> countUsersByMonth(@Param("startDate") LocalDateTime startDate, 
                                     @Param("endDate") LocalDateTime endDate);

    /**
     * Đếm tổng số user theo vai trò
     */
    long countByRole(UserRole role);

    /**
     * Đếm tổng số user đang hoạt động
     */
    long countByIsActiveTrue();

    /**
     * Tìm user theo khoảng thời gian đăng ký
     */
    List<User> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Tìm user theo username và chưa bị xóa
     */
    Optional<User> findByUsernameAndDeletedAtIsNull(String username);    /**
     * Tìm user theo ID và chưa bị xóa
     */
    Optional<User> findByIdAndDeletedAtIsNull(Long id);

    /**
     * Tìm user có phân trang và chưa bị xóa
     */
    Page<User> findByDeletedAtIsNull(Pageable pageable);

    /**
     * Tìm user theo role và chưa bị xóa
     */
    Page<User> findByRoleAndDeletedAtIsNull(UserRole role, Pageable pageable);

    /**
     * Tìm user theo username hoặc email chứa từ khóa và chưa bị xóa
     */
    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND " +
           "(LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))") 
    Page<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseAndDeletedAtIsNull(
            @Param("search") String username, @Param("search") String email, Pageable pageable);

    /**
     * Tìm user theo username hoặc email chứa từ khóa, role và chưa bị xóa
     */
    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.role = :role AND " +
           "(LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))") 
    Page<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseAndRoleAndDeletedAtIsNull(
            @Param("search") String username, @Param("search") String email, 
            @Param("role") UserRole role, Pageable pageable);

    /**
     * Đếm user chưa bị xóa
     */
    long countByDeletedAtIsNull();    /**
     * Đếm số users mới tháng này
     */
    @Query(value = "SELECT COUNT(*) FROM users u " +
           "WHERE u.deleted_at IS NULL " +
           "AND YEAR(u.created_at) = YEAR(CURRENT_DATE) " +
           "AND MONTH(u.created_at) = MONTH(CURRENT_DATE)", nativeQuery = true)
    long countNewUsersThisMonth();

    /**
     * Đếm số users mới tháng trước
     */
    @Query(value = "SELECT COUNT(*) FROM users u " +
           "WHERE u.deleted_at IS NULL " +
           "AND YEAR(u.created_at) = YEAR(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)) " +
           "AND MONTH(u.created_at) = MONTH(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH))", nativeQuery = true)  
    long countNewUsersLastMonth();

    /**
     * Đếm số users đang hoạt động
     */
    @Query(value = "SELECT COUNT(*) FROM users u " +
           "WHERE u.deleted_at IS NULL AND u.is_active = true", nativeQuery = true)
    long countActiveUsers();

    /**
     * Đếm users có booking gần đây (trong 3 tháng)
     */
    @Query(value = "SELECT COUNT(DISTINCT u.id) FROM users u " +
           "JOIN booking_tours b ON u.id = b.user_id " +
           "WHERE u.deleted_at IS NULL " +
           "AND b.deleted_at IS NULL " +
           "AND b.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH)", nativeQuery = true)
    long countUsersWithRecentBookings();

    /**
     * Thống kê hoạt động users hàng ngày
     */
    @Query(value = "SELECT DATE(b.created_at) as date, COUNT(DISTINCT b.user_id) as activeUsers " +
           "FROM booking_tours b JOIN users u ON b.user_id = u.id " +
           "WHERE b.deleted_at IS NULL AND u.deleted_at IS NULL " +
           "AND b.created_at >= ?1 " +
           "GROUP BY DATE(b.created_at) " +
           "ORDER BY date DESC", nativeQuery = true)
    List<Object[]> getUserDailyActivity(@Param("fromDate") LocalDateTime fromDate);

    // ========== STATISTICS METHODS ==========

    /**
     * Đếm users theo trạng thái active và chưa bị xóa
     */
    long countByIsActiveTrueAndDeletedAtIsNull();

    /**
     * Đếm users theo trạng thái inactive và chưa bị xóa
     */
    long countByIsActiveFalseAndDeletedAtIsNull();

    /**
     * Đếm users trong khoảng thời gian và chưa bị xóa
     */
    long countByCreatedAtBetweenAndDeletedAtIsNull(LocalDateTime start, LocalDateTime end);

    /**
     * Thống kê phân bố độ tuổi người dùng
     */
    @Query("SELECT " +
           "CASE " +
           "  WHEN YEAR(CURRENT_DATE) - YEAR(u.birthDate) BETWEEN 18 AND 25 THEN '18-25 tuổi' " +
           "  WHEN YEAR(CURRENT_DATE) - YEAR(u.birthDate) BETWEEN 26 AND 35 THEN '26-35 tuổi' " +
           "  WHEN YEAR(CURRENT_DATE) - YEAR(u.birthDate) BETWEEN 36 AND 45 THEN '36-45 tuổi' " +
           "  WHEN YEAR(CURRENT_DATE) - YEAR(u.birthDate) BETWEEN 46 AND 55 THEN '46-55 tuổi' " +
           "  WHEN YEAR(CURRENT_DATE) - YEAR(u.birthDate) > 55 THEN '55+ tuổi' " +
           "  ELSE 'Không xác định' " +
           "END as ageGroup, " +
           "COUNT(u) as count " +
           "FROM User u " +
           "WHERE u.deletedAt IS NULL AND u.birthDate IS NOT NULL " +
           "GROUP BY " +
           "CASE " +
           "  WHEN YEAR(CURRENT_DATE) - YEAR(u.birthDate) BETWEEN 18 AND 25 THEN '18-25 tuổi' " +
           "  WHEN YEAR(CURRENT_DATE) - YEAR(u.birthDate) BETWEEN 26 AND 35 THEN '26-35 tuổi' " +
           "  WHEN YEAR(CURRENT_DATE) - YEAR(u.birthDate) BETWEEN 36 AND 45 THEN '36-45 tuổi' " +
           "  WHEN YEAR(CURRENT_DATE) - YEAR(u.birthDate) BETWEEN 46 AND 55 THEN '46-55 tuổi' " +
           "  WHEN YEAR(CURRENT_DATE) - YEAR(u.birthDate) > 55 THEN '55+ tuổi' " +
           "  ELSE 'Không xác định' " +
           "END " +
           "ORDER BY count DESC")
    List<Object[]> getUserAgeDistribution();

    /**
     * Thống kê phân bố theo vị trí
     */
    @Query("SELECT u.address as location, COUNT(u) as count " +
           "FROM User u " +
           "WHERE u.deletedAt IS NULL AND u.address IS NOT NULL " +
           "GROUP BY u.address " +
           "ORDER BY count DESC")
    List<Object[]> getUserLocationDistribution();

    /**
     * Thống kê phân bố theo giới tính
     */
    @Query("SELECT " +
           "CASE " +
           "  WHEN u.gender = 'MALE' THEN 'Nam' " +
           "  WHEN u.gender = 'FEMALE' THEN 'Nữ' " +
           "  ELSE 'Khác' " +
           "END as gender, " +
           "COUNT(u) as count " +
           "FROM User u " +
           "WHERE u.deletedAt IS NULL " +
           "GROUP BY u.gender " +
           "ORDER BY count DESC")
    List<Object[]> getUserGenderDistribution();

    /**
     * Thống kê xu hướng đăng ký theo ngày
     */
    @Query("SELECT DATE(u.createdAt) as date, COUNT(u) as count " +
           "FROM User u " +
           "WHERE u.deletedAt IS NULL AND u.createdAt >= :fromDate " +
           "GROUP BY DATE(u.createdAt) " +
           "ORDER BY date DESC")
    List<Object[]> getUserRegistrationTrends(@Param("fromDate") LocalDateTime fromDate);

    /**
     * Top users có nhiều booking nhất
     */
    @Query("SELECT u.id, u.username, u.fullName, u.email, COUNT(b) as bookingCount, " +
           "SUM(b.totalAmount) as totalSpent " +
           "FROM User u LEFT JOIN BookingTour b ON u = b.user AND b.deletedAt IS NULL " +
           "WHERE u.deletedAt IS NULL " +
           "GROUP BY u.id, u.username, u.fullName, u.email " +
           "ORDER BY bookingCount DESC, totalSpent DESC")
    List<Object[]> getTopUsersByBookings(Pageable pageable);

    /**
     * Users mới nhất
     */
    @Query("SELECT u.id, u.username, u.fullName, u.email, u.createdAt, u.isActive " +
           "FROM User u " +
           "WHERE u.deletedAt IS NULL " +
           "ORDER BY u.createdAt DESC")
    List<Object[]> getRecentUsers(Pageable pageable);
}

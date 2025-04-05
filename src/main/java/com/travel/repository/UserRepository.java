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
    Optional<User> findByUsernameAndDeletedAtIsNull(String username);

    /**
     * Tìm user theo ID và chưa bị xóa
     */
    Optional<User> findByIdAndDeletedAtIsNull(Long id);
}

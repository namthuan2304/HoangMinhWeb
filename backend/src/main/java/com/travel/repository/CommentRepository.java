package com.travel.repository;

import com.travel.entity.Comment;
import com.travel.entity.Tour;
import com.travel.entity.User;
import com.travel.enums.CommentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho entity Comment
 */
@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {    /**
     * Tìm comment theo tour có phân trang
     */
    @Query("SELECT c FROM Comment c WHERE c.deletedAt IS NULL AND c.tour = :tour AND c.status = 'APPROVED' ORDER BY c.createdAt DESC")
    Page<Comment> findByTourAndApproved(@Param("tour") Tour tour, Pageable pageable);

    /**
     * Tìm comment theo user
     */
    @Query("SELECT c FROM Comment c WHERE c.deletedAt IS NULL AND c.user = :user ORDER BY c.createdAt DESC")
    List<Comment> findByUser(@Param("user") User user);

    /**
     * Tìm comment chưa được duyệt
     */
    @Query("SELECT c FROM Comment c WHERE c.deletedAt IS NULL AND c.status = 'PENDING' ORDER BY c.createdAt DESC")
    List<Comment> findPendingComments();

    /**
     * Tính rating trung bình của tour
     */
    @Query("SELECT AVG(c.rating) FROM Comment c WHERE c.deletedAt IS NULL AND c.tour = :tour AND c.status = 'APPROVED'")
    Double getAverageRatingByTour(@Param("tour") Tour tour);

    /**
     * Đếm số comment theo tour
     */
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.deletedAt IS NULL AND c.tour = :tour AND c.status = 'APPROVED'")
    long countByTourAndApproved(@Param("tour") Tour tour);

    /**
     * Đếm số comment theo rating
     */
    @Query("SELECT c.rating, COUNT(c) FROM Comment c WHERE c.deletedAt IS NULL AND c.tour = :tour AND c.status = 'APPROVED' GROUP BY c.rating")
    List<Object[]> countByRatingAndTour(@Param("tour") Tour tour);

    /**
     * Tìm comment theo tour (bao gồm chưa duyệt)
     */
    @Query("SELECT c FROM Comment c WHERE c.deletedAt IS NULL AND c.tour = :tour ORDER BY c.createdAt DESC")
    List<Comment> findByTour(@Param("tour") Tour tour);

    /**
     * Kiểm tra user đã comment cho tour này chưa
     */
    @Query("SELECT COUNT(c) > 0 FROM Comment c WHERE c.deletedAt IS NULL AND c.user = :user AND c.tour = :tour")
    boolean hasUserCommentedOnTour(@Param("user") User user, @Param("tour") Tour tour);

    /**
     * Tìm comment theo ID và chưa bị xóa
     */
    Optional<Comment> findByIdAndDeletedAtIsNull(Long id);    /**
     * Lấy tất cả comment chưa bị xóa
     */
    Page<Comment> findByDeletedAtIsNull(Pageable pageable);

    /**
     * Kiểm tra user đã comment tour chưa
     */
    boolean existsByUserAndTourAndDeletedAtIsNull(User user, Tour tour);    /**
     * Tìm comment theo user và chưa bị xóa với phân trang
     */
    Page<Comment> findByUserAndDeletedAtIsNull(User user, Pageable pageable);

    /**
     * Tìm comment theo status
     */
    @Query("SELECT c FROM Comment c WHERE c.deletedAt IS NULL AND c.status = :status ORDER BY c.createdAt DESC")
    Page<Comment> findByStatusAndDeletedAtIsNull(@Param("status") CommentStatus status, Pageable pageable);    /**
     * Đếm comment theo status
     */
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.deletedAt IS NULL AND c.status = :status")
    long countByStatusAndDeletedAtIsNull(@Param("status") CommentStatus status);

    /**
     * Đếm số bình luận theo tour và rating (chỉ approved)
     */
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.deletedAt IS NULL AND c.tour = :tour AND c.rating = :rating AND c.status = 'APPROVED'")
    long countByTourAndRatingAndApproved(@Param("tour") Tour tour, @Param("rating") Integer rating);
}

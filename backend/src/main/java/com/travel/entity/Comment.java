package com.travel.entity;

import com.travel.enums.CommentStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Entity bình luận và đánh giá tour
 */
@Entity
@Table(name = "comments")
public class Comment extends BaseEntity {

    @NotNull(message = "Người dùng không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull(message = "Tour không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tour_id", nullable = false)
    private Tour tour;

    @NotBlank(message = "Nội dung bình luận không được để trống")
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;    @NotNull(message = "Đánh giá không được để trống")
    @Min(value = 1, message = "Đánh giá phải từ 1 đến 5 sao")
    @Max(value = 5, message = "Đánh giá phải từ 1 đến 5 sao")
    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private CommentStatus status = CommentStatus.PENDING;

    @Column(name = "reject_reason")
    private String rejectReason;

    // Constructors
    public Comment() {}

    public Comment(User user, Tour tour, String content, Integer rating) {
        this.user = user;
        this.tour = tour;
        this.content = content;
        this.rating = rating;
    }

    // Getters and Setters
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Tour getTour() {
        return tour;
    }

    public void setTour(Tour tour) {
        this.tour = tour;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public CommentStatus getStatus() {
        return status;
    }

    public void setStatus(CommentStatus status) {
        this.status = status;
    }

    public String getRejectReason() {
        return rejectReason;
    }

    public void setRejectReason(String rejectReason) {
        this.rejectReason = rejectReason;
    }

    // Backward compatibility methods
    public Boolean getIsApproved() {
        return status == CommentStatus.APPROVED;
    }

    public void setIsApproved(Boolean isApproved) {
        if (isApproved != null) {
            this.status = isApproved ? CommentStatus.APPROVED : CommentStatus.PENDING;
        }
    }

    /**
     * Phê duyệt bình luận
     */
    public void approve() {
        this.status = CommentStatus.APPROVED;
        this.rejectReason = null;
    }

    /**
     * Từ chối bình luận
     */
    public void reject() {
        this.status = CommentStatus.REJECTED;
    }

    /**
     * Từ chối bình luận với lý do
     */
    public void reject(String reason) {
        this.status = CommentStatus.REJECTED;
        this.rejectReason = reason;
    }
}

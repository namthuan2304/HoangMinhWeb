package com.travel.entity;

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
    private String content;

    @NotNull(message = "Đánh giá không được để trống")
    @Min(value = 1, message = "Đánh giá phải từ 1 đến 5 sao")
    @Max(value = 5, message = "Đánh giá phải từ 1 đến 5 sao")
    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "is_approved")
    private Boolean isApproved = true;

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
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public Boolean getIsApproved() {
        return isApproved;
    }

    public void setIsApproved(Boolean isApproved) {
        this.isApproved = isApproved;
    }

    /**
     * Phê duyệt bình luận
     */
    public void approve() {
        this.isApproved = true;
    }

    /**
     * Từ chối bình luận
     */
    public void reject() {
        this.isApproved = false;
    }
}

package com.travel.dto.request;

import jakarta.validation.constraints.*;

/**
 * DTO request tạo/cập nhật bình luận
 */
public class CommentRequest {

    @NotNull(message = "ID tour không được để trống")
    private Long tourId;

    @NotBlank(message = "Nội dung bình luận không được để trống")
    @Size(max = 1000, message = "Nội dung bình luận không được vượt quá 1000 ký tự")
    private String content;

    @NotNull(message = "Đánh giá không được để trống")
    @Min(value = 1, message = "Đánh giá phải từ 1 đến 5 sao")
    @Max(value = 5, message = "Đánh giá phải từ 1 đến 5 sao")
    private Integer rating;

    // Constructors
    public CommentRequest() {}

    public CommentRequest(Long tourId, String content, Integer rating) {
        this.tourId = tourId;
        this.content = content;
        this.rating = rating;
    }

    // Getters and Setters
    public Long getTourId() {
        return tourId;
    }

    public void setTourId(Long tourId) {
        this.tourId = tourId;
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
}

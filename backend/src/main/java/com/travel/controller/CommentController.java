package com.travel.controller;

import com.travel.dto.request.CommentRequest;
import com.travel.dto.response.CommentResponse;
import com.travel.dto.response.MessageResponse;
import com.travel.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller xử lý các API liên quan đến Comment
 */
@RestController
@RequestMapping("/api/comments")
@Tag(name = "Comment Management", description = "APIs quản lý bình luận và đánh giá")
@SecurityRequirement(name = "bearerAuth")
public class CommentController {

    @Autowired
    private CommentService commentService;

    /**
     * Thêm bình luận mới
     */
    @PostMapping
    @Operation(summary = "Thêm bình luận và đánh giá tour")
    public ResponseEntity<CommentResponse> createComment(
            Authentication authentication,
            @Valid @RequestBody CommentRequest request) {
        CommentResponse comment = commentService.createComment(authentication.getName(), request);
        return ResponseEntity.ok(comment);
    }

    /**
     * Lấy bình luận theo tour
     */
    @GetMapping("/tour/{tourId}")
    @Operation(summary = "Lấy danh sách bình luận của tour")
    public ResponseEntity<Page<CommentResponse>> getCommentsByTour(
            @PathVariable Long tourId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CommentResponse> comments = commentService.getCommentsByTour(tourId, pageable);
        
        return ResponseEntity.ok(comments);
    }

    /**
     * Lấy rating trung bình và số lượng bình luận của tour
     */
    @GetMapping("/tour/{tourId}/rating")
    @Operation(summary = "Lấy thông tin rating của tour")
    public ResponseEntity<Map<String, Object>> getTourRating(@PathVariable Long tourId) {
        Map<String, Object> rating = new HashMap<>();
        rating.put("averageRating", commentService.getTourRatingAverage(tourId));
        rating.put("totalComments", commentService.getTourCommentCount(tourId));
        return ResponseEntity.ok(rating);
    }

    /**
     * Lấy tất cả bình luận (Admin)
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy tất cả bình luận (Admin)")
    public ResponseEntity<Page<CommentResponse>> getAllComments(
            @RequestParam(required = false) Boolean isApproved,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CommentResponse> comments = commentService.getAllComments(isApproved, pageable);
        
        return ResponseEntity.ok(comments);
    }

    /**
     * Lấy bình luận của user hiện tại
     */
    @GetMapping("/my-comments")
    @Operation(summary = "Lấy danh sách bình luận của tôi")
    public ResponseEntity<Page<CommentResponse>> getMyComments(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CommentResponse> comments = commentService.getUserComments(authentication.getName(), pageable);
        
        return ResponseEntity.ok(comments);
    }

    /**
     * Cập nhật bình luận
     */
    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật bình luận")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody CommentRequest request) {
        CommentResponse updatedComment = commentService.updateComment(id, authentication.getName(), request);
        return ResponseEntity.ok(updatedComment);
    }

    /**
     * Xóa bình luận
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa bình luận")
    public ResponseEntity<MessageResponse> deleteComment(
            @PathVariable Long id,
            Authentication authentication) {
        commentService.deleteComment(id, authentication.getName());
        return ResponseEntity.ok(new MessageResponse("Xóa bình luận thành công"));
    }

    /**
     * Phê duyệt bình luận (Admin)
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Phê duyệt bình luận")
    public ResponseEntity<CommentResponse> approveComment(@PathVariable Long id) {
        CommentResponse approvedComment = commentService.approveComment(id);
        return ResponseEntity.ok(approvedComment);
    }

    /**
     * Từ chối bình luận (Admin)
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Từ chối bình luận")
    public ResponseEntity<CommentResponse> rejectComment(@PathVariable Long id) {
        CommentResponse rejectedComment = commentService.rejectComment(id);
        return ResponseEntity.ok(rejectedComment);
    }
}

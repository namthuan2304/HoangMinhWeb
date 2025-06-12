package com.travel.service;

import com.travel.dto.request.CommentRequest;
import com.travel.dto.response.CommentResponse;
import com.travel.entity.Comment;
import com.travel.entity.Tour;
import com.travel.entity.User;
import com.travel.enums.CommentStatus;
import com.travel.exception.ResourceNotFoundException;
import com.travel.repository.CommentRepository;
import com.travel.repository.TourRepository;
import com.travel.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;


/**
 * Service xử lý logic nghiệp vụ cho Comment
 */
@Service
@Transactional
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModelMapper modelMapper;

    /**
     * Thêm bình luận mới
     */
    public CommentResponse createComment(String username, CommentRequest request) {
        // Lấy thông tin user
        User user = userRepository.findByUsernameAndDeletedAtIsNull(username)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        // Lấy thông tin tour
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(request.getTourId())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour"));

        // Kiểm tra user đã bình luận cho tour này chưa
        boolean hasCommented = commentRepository.existsByUserAndTourAndDeletedAtIsNull(user, tour);
        if (hasCommented) {
            throw new IllegalArgumentException("Bạn đã bình luận cho tour này rồi");
        }

        // Tạo comment mới
        Comment comment = new Comment();
        comment.setUser(user);
        comment.setTour(tour);
        comment.setContent(request.getContent());
        comment.setRating(request.getRating());

        Comment savedComment = commentRepository.save(comment);

        // Cập nhật rating trung bình của tour
        updateTourRatingAverage(tour);

        return mapToCommentResponse(savedComment);
    }    /**
     * Lấy bình luận theo tour với phân trang
     */
    public Page<CommentResponse> getCommentsByTour(Long tourId, Pageable pageable) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(tourId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour"));

        Page<Comment> comments = commentRepository.findByTourAndApproved(tour, pageable);
        return comments.map(this::mapToCommentResponse);
    }

    /**
     * Lấy tất cả bình luận (Admin)
     */
    public Page<CommentResponse> getAllComments(CommentStatus status, Pageable pageable) {
        Page<Comment> comments;
          if (status != null) {
            comments = commentRepository.findByStatusAndDeletedAtIsNull(status, pageable);
        } else {
            comments = commentRepository.findByDeletedAtIsNull(pageable);
        }
        
        return comments.map(this::mapToCommentResponse);
    }

    /**
     * Lấy bình luận theo trạng thái (Admin)
     */
    public Page<CommentResponse> getCommentsByStatus(CommentStatus status, Pageable pageable) {
        Page<Comment> comments = commentRepository.findByStatusAndDeletedAtIsNull(status, pageable);
        return comments.map(this::mapToCommentResponse);
    }

    /**
     * Cập nhật bình luận
     */
    public CommentResponse updateComment(Long id, String username, CommentRequest request) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận"));

        // Kiểm tra quyền sửa (chỉ người tạo mới được sửa)
        if (!comment.getUser().getUsername().equals(username)) {
            throw new IllegalArgumentException("Bạn không có quyền sửa bình luận này");
        }

        // Cập nhật nội dung
        comment.setContent(request.getContent());
        comment.setRating(request.getRating());
        comment.setStatus(CommentStatus.PENDING); // Reset về chờ duyệt sau khi sửa

        Comment savedComment = commentRepository.save(comment);

        // Cập nhật rating trung bình của tour
        updateTourRatingAverage(comment.getTour());

        return mapToCommentResponse(savedComment);
    }

    /**
     * Xóa bình luận
     */
    public void deleteComment(Long id, String username) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận"));

        // Kiểm tra quyền xóa (người tạo hoặc admin)
        User user = userRepository.findByUsernameAndDeletedAtIsNull(username)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (!comment.getUser().getUsername().equals(username) && !user.isAdmin()) {
            throw new IllegalArgumentException("Bạn không có quyền xóa bình luận này");
        }

        // Soft delete
        comment.markAsDeleted();
        commentRepository.save(comment);

        // Cập nhật rating trung bình của tour
        updateTourRatingAverage(comment.getTour());
    }

    /**
     * Phê duyệt bình luận (Admin)
     */
    public CommentResponse approveComment(Long id) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận"));

        comment.approve();
        Comment savedComment = commentRepository.save(comment);

        // Cập nhật rating trung bình của tour
        updateTourRatingAverage(comment.getTour());

        return mapToCommentResponse(savedComment);
    }    /**
     * Từ chối bình luận (Admin)
     */
    public CommentResponse rejectComment(Long id) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận"));

        comment.reject();
        Comment savedComment = commentRepository.save(comment);

        // Cập nhật rating trung bình của tour
        updateTourRatingAverage(comment.getTour());

        return mapToCommentResponse(savedComment);
    }

    /**
     * Từ chối bình luận với lý do (Admin)
     */
    public CommentResponse rejectComment(Long id, String reason) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận"));

        comment.reject(reason);
        Comment savedComment = commentRepository.save(comment);

        // Cập nhật rating trung bình của tour
        updateTourRatingAverage(comment.getTour());

        return mapToCommentResponse(savedComment);
    }

    /**
     * Lấy rating trung bình của tour
     */
    public Double getTourRatingAverage(Long tourId) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(tourId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour"));

        return commentRepository.getAverageRatingByTour(tour);
    }

    /**
     * Lấy số lượng bình luận của tour
     */
    public long getTourCommentCount(Long tourId) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(tourId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour"));

        return commentRepository.countByTourAndApproved(tour);
    }

    /**
     * Cập nhật rating trung bình của tour
     */
    private void updateTourRatingAverage(Tour tour) {
        Double averageRating = commentRepository.getAverageRatingByTour(tour);
        tour.setRatingAverage(averageRating != null ? averageRating : 0.0);
        tourRepository.save(tour);
    }    /**
     * Map Comment entity to CommentResponse DTO
     */
    private CommentResponse mapToCommentResponse(Comment comment) {
        CommentResponse response = modelMapper.map(comment, CommentResponse.class);
          // Map status fields
        response.setStatus(comment.getStatus());
        response.setRejectReason(comment.getRejectReason());
        
        // Map user info
        CommentResponse.UserInfo userInfo = new CommentResponse.UserInfo();
        userInfo.setId(comment.getUser().getId());
        userInfo.setUsername(comment.getUser().getUsername());
        userInfo.setFullName(comment.getUser().getFullName());
        userInfo.setAvatarUrl(comment.getUser().getAvatarUrl());
        response.setUser(userInfo);
        
        // Map tour info
        CommentResponse.TourInfo tourInfo = new CommentResponse.TourInfo();
        tourInfo.setId(comment.getTour().getId());
        tourInfo.setName(comment.getTour().getName());
        tourInfo.setDestination(comment.getTour().getDestination());
        response.setTour(tourInfo);
        
        return response;
    }

    /**
     * Lấy bình luận của user
     */
    public Page<CommentResponse> getUserComments(String username, Pageable pageable) {
        User user = userRepository.findByUsernameAndDeletedAtIsNull(username)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        Page<Comment> comments = commentRepository.findByUserAndDeletedAtIsNull(user, pageable);
        return comments.map(this::mapToCommentResponse);
    }

    /**
     * Lấy phân tích rating theo số sao
     */
    public Map<String, Long> getRatingBreakdown(Long tourId) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(tourId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour"));        Map<String, Long> breakdown = new HashMap<>();
        breakdown.put("fiveStarCount", commentRepository.countByTourAndRatingAndApproved(tour, 5));
        breakdown.put("fourStarCount", commentRepository.countByTourAndRatingAndApproved(tour, 4));
        breakdown.put("threeStarCount", commentRepository.countByTourAndRatingAndApproved(tour, 3));
        breakdown.put("twoStarCount", commentRepository.countByTourAndRatingAndApproved(tour, 2));
        breakdown.put("oneStarCount", commentRepository.countByTourAndRatingAndApproved(tour, 1));
        
        return breakdown;
    }
}

package com.travel.controller;

import com.travel.dto.request.TourRequest;
import com.travel.dto.response.MessageResponse;
import com.travel.dto.response.TourResponse;
import com.travel.enums.TourStatus;
import com.travel.enums.TourType;
import com.travel.service.TourService;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Controller xử lý các API liên quan đến Tour
 */
@RestController
@RequestMapping("/api/tours")
@Tag(name = "Tour Management", description = "APIs quản lý tour du lịch")
public class TourController {

    @Autowired
    private TourService tourService;

    /**
     * Lấy danh sách tất cả tour (Public)
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách tour", description = "Lấy danh sách tất cả tour với phân trang")
    public ResponseEntity<Page<TourResponse>> getAllTours(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<TourResponse> tours = tourService.getAllTours(pageable);
        
        return ResponseEntity.ok(tours);
    }

    /**
     * Tìm kiếm tour (Public)
     */
    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm tour", description = "Tìm kiếm tour theo nhiều tiêu chí")
    public ResponseEntity<Page<TourResponse>> searchTours(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) TourType tourType,
            @RequestParam(required = false) TourStatus status,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<TourResponse> tours = tourService.searchTours(
            keyword, tourType, status, minPrice, maxPrice, startDate, endDate, pageable);
        
        return ResponseEntity.ok(tours);
    }

    /**
     * Lấy danh sách tất cả tour cho admin (Admin only)
     * IMPORTANT: This endpoint must come BEFORE /{id} to avoid routing conflicts
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lấy danh sách tour cho admin với thông tin đầy đủ")
    public ResponseEntity<Page<TourResponse>> getToursForAdmin(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) TourStatus status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Use search method with admin access to get all tours including inactive ones
        Page<TourResponse> tours = tourService.searchTours(
            keyword, 
            null, // tourType - allow all types for admin
            status, 
            minPrice, 
            maxPrice, 
            null, // startDate
            null, // endDate
            pageable
        );
        
        return ResponseEntity.ok(tours);
    }

    /**
     * Lấy thông tin chi tiết tour (Public)
     */
    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết tour")
    public ResponseEntity<TourResponse> getTourById(@PathVariable Long id) {
        TourResponse tour = tourService.getTourById(id);
        return ResponseEntity.ok(tour);
    }

    /**
     * Tạo tour mới (Admin only)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Tạo tour mới")
    public ResponseEntity<TourResponse> createTour(@Valid @RequestBody TourRequest request) {
        TourResponse createdTour = tourService.createTour(request);
        return ResponseEntity.ok(createdTour);
    }

    /**
     * Cập nhật tour (Admin only)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cập nhật thông tin tour")
    public ResponseEntity<TourResponse> updateTour(
            @PathVariable Long id,
            @Valid @RequestBody TourRequest request) {
        TourResponse updatedTour = tourService.updateTour(id, request);
        return ResponseEntity.ok(updatedTour);
    }

    /**
     * Xóa tour (Admin only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Xóa tour")
    public ResponseEntity<MessageResponse> deleteTour(@PathVariable Long id) {
        tourService.deleteTour(id);
        return ResponseEntity.ok(new MessageResponse("Xóa tour thành công"));
    }

    /**
     * Upload ảnh chính cho tour (Admin only)
     */
    @PostMapping("/{id}/upload-main-image")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Upload ảnh chính cho tour")
    public ResponseEntity<TourResponse> uploadMainImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        TourResponse updatedTour = tourService.uploadMainImage(id, file);
        return ResponseEntity.ok(updatedTour);
    }

    /**
     * Upload nhiều ảnh cho tour (Admin only)
     */
    @PostMapping("/{id}/upload-images")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Upload nhiều ảnh cho tour")
    public ResponseEntity<TourResponse> uploadImages(
            @PathVariable Long id,
            @RequestParam("files") MultipartFile[] files) {
        TourResponse updatedTour = tourService.uploadImages(id, files);
        return ResponseEntity.ok(updatedTour);
    }

    /**
     * Xóa ảnh của tour (Admin only)
     */
    @DeleteMapping("/{id}/images")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Xóa ảnh của tour")
    public ResponseEntity<TourResponse> deleteImage(
            @PathVariable Long id,
            @RequestParam String imageUrl) {
        TourResponse updatedTour = tourService.deleteImage(id, imageUrl);
        return ResponseEntity.ok(updatedTour);
    }

    /**
     * Đặt ảnh chính cho tour (Admin only)
     */
    @PostMapping("/{id}/set-main-image")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Đặt ảnh chính cho tour")
    public ResponseEntity<TourResponse> setMainImage(
            @PathVariable Long id,
            @RequestParam String imageUrl) {
        TourResponse updatedTour = tourService.setMainImage(id, imageUrl);
        return ResponseEntity.ok(updatedTour);
    }

    /**
     * Lấy tour hot (Public)
     */
    @GetMapping("/hot")
    @Operation(summary = "Lấy tour hot", description = "Lấy danh sách tour được đặt nhiều nhất")
    public ResponseEntity<Page<TourResponse>> getHotTours(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<TourResponse> tours = tourService.getHotTours(pageable);
        return ResponseEntity.ok(tours);
    }

    /**
     * Lấy tour nổi bật (Public)
     */
    @GetMapping("/featured")
    @Operation(summary = "Lấy tour nổi bật")
    public ResponseEntity<Page<TourResponse>> getFeaturedTours(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<TourResponse> tours = tourService.getFeaturedTours(pageable);
        return ResponseEntity.ok(tours);
    }

    /**
     * Lấy tour có sẵn (Public)
     */
    @GetMapping("/available")
    @Operation(summary = "Lấy tour có sẵn", description = "Lấy danh sách tour còn chỗ trống")
    public ResponseEntity<Page<TourResponse>> getAvailableTours(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<TourResponse> tours = tourService.getAvailableTours(pageable);
        return ResponseEntity.ok(tours);
    }

    /**
     * Lấy tour theo loại (Public)
     */
    @GetMapping("/type/{tourType}")
    @Operation(summary = "Lấy tour theo loại")
    public ResponseEntity<Page<TourResponse>> getToursByType(
            @PathVariable TourType tourType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<TourResponse> tours = tourService.getToursByType(tourType, pageable);
        return ResponseEntity.ok(tours);
    }

    /**
     * Lấy tour liên quan (Public)
     */
    @GetMapping("/{id}/related")
    @Operation(summary = "Lấy tour liên quan")
    public ResponseEntity<List<TourResponse>> getRelatedTours(
            @PathVariable Long id,
            @RequestParam(defaultValue = "5") int limit) {
        List<TourResponse> relatedTours = tourService.getRelatedTours(id, limit);
        return ResponseEntity.ok(relatedTours);
    }

    /**
     * Cập nhật trạng thái tour (Admin only)
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cập nhật trạng thái tour")
    public ResponseEntity<TourResponse> updateTourStatus(
            @PathVariable Long id,
            @RequestParam TourStatus status) {
        TourResponse updatedTour = tourService.updateTourStatus(id, status);
        return ResponseEntity.ok(updatedTour);
    }

    /**
     * Đánh dấu/bỏ đánh dấu tour nổi bật (Admin only)
     */
    @PutMapping("/{id}/toggle-featured")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Đánh dấu/bỏ đánh dấu tour nổi bật")
    public ResponseEntity<TourResponse> toggleFeatured(@PathVariable Long id) {
        TourResponse updatedTour = tourService.toggleFeatured(id);
        return ResponseEntity.ok(updatedTour);
    }

    /**
     * Lấy thống kê tour (Admin only)
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lấy thống kê tour")
    public ResponseEntity<Object> getTourStatistics() {
        Object statistics = tourService.getTourStatistics();
        return ResponseEntity.ok(statistics);
    }

    /**
     * Lấy doanh thu theo tháng (Admin only)
     */
    @GetMapping("/revenue/monthly")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lấy doanh thu theo tháng")
    public ResponseEntity<List<Object[]>> getRevenueByMonth(@RequestParam int year) {
        List<Object[]> revenue = tourService.getRevenueByMonth(year);
        return ResponseEntity.ok(revenue);
    }
}

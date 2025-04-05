package com.travel.controller;

import com.travel.dto.request.BookingTourRequest;
import com.travel.dto.response.BookingTourResponse;
import com.travel.dto.response.MessageResponse;
import com.travel.enums.BookingStatus;
import com.travel.service.BookingTourService;
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

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller xử lý các API liên quan đến BookingTour
 */
@RestController
@RequestMapping("/api/bookings")
@Tag(name = "Booking Management", description = "APIs quản lý đặt tour")
@SecurityRequirement(name = "bearerAuth")
public class BookingTourController {

    @Autowired
    private BookingTourService bookingTourService;

    /**
     * Đặt tour mới
     */
    @PostMapping
    @Operation(summary = "Đặt tour mới")
    public ResponseEntity<BookingTourResponse> createBooking(
            Authentication authentication,
            @Valid @RequestBody BookingTourRequest request) {
        BookingTourResponse booking = bookingTourService.createBooking(authentication.getName(), request);
        return ResponseEntity.ok(booking);
    }

    /**
     * Lấy danh sách tất cả đơn đặt (Admin only)
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy danh sách tất cả đơn đặt")
    public ResponseEntity<Page<BookingTourResponse>> getAllBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<BookingTourResponse> bookings = bookingTourService.getAllBookings(status, keyword, pageable);
        
        return ResponseEntity.ok(bookings);
    }

    /**
     * Lấy lịch sử đặt tour của user hiện tại
     */
    @GetMapping("/my-bookings")
    @Operation(summary = "Lấy lịch sử đặt tour của tôi")
    public ResponseEntity<Page<BookingTourResponse>> getMyBookings(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<BookingTourResponse> bookings = bookingTourService.getUserBookings(authentication.getName(), pageable);
        
        return ResponseEntity.ok(bookings);
    }

    /**
     * Lấy chi tiết đơn đặt
     */
    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết đơn đặt")
    public ResponseEntity<BookingTourResponse> getBookingById(@PathVariable Long id) {
        BookingTourResponse booking = bookingTourService.getBookingById(id);
        return ResponseEntity.ok(booking);
    }

    /**
     * Cập nhật trạng thái đơn đặt (Admin only)
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật trạng thái đơn đặt")
    public ResponseEntity<BookingTourResponse> updateBookingStatus(
            @PathVariable Long id,
            @RequestParam BookingStatus status,
            @RequestParam(required = false) String notes) {
        BookingTourResponse updatedBooking = bookingTourService.updateBookingStatus(id, status, notes);
        return ResponseEntity.ok(updatedBooking);
    }

    /**
     * Hủy đơn đặt
     */
    @PostMapping("/{id}/cancel")
    @Operation(summary = "Hủy đơn đặt")
    public ResponseEntity<BookingTourResponse> cancelBooking(
            @PathVariable Long id,
            Authentication authentication,
            @RequestParam(required = false) String reason) {
        BookingTourResponse cancelledBooking = bookingTourService.cancelBooking(
            id, authentication.getName(), reason);
        return ResponseEntity.ok(cancelledBooking);
    }

    /**
     * Thống kê doanh thu theo tháng (Admin only)
     */
    @GetMapping("/statistics/revenue/monthly")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Thống kê doanh thu theo tháng")
    public ResponseEntity<List<Object[]>> getRevenueStatsByMonth(@RequestParam int year) {
        List<Object[]> stats = bookingTourService.getRevenueStatsByMonth(year);
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê doanh thu theo quý (Admin only)
     */
    @GetMapping("/statistics/revenue/quarterly")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Thống kê doanh thu theo quý")
    public ResponseEntity<List<Object[]>> getRevenueStatsByQuarter(@RequestParam int year) {
        List<Object[]> stats = bookingTourService.getRevenueStatsByQuarter(year);
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê tổng doanh thu theo năm (Admin only)
     */
    @GetMapping("/statistics/revenue/yearly")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Thống kê tổng doanh thu theo năm")
    public ResponseEntity<BigDecimal> getTotalRevenueByYear(@RequestParam int year) {
        BigDecimal totalRevenue = bookingTourService.getTotalRevenueByYear(year);
        return ResponseEntity.ok(totalRevenue);
    }

    /**
     * Lấy top tours được đặt nhiều nhất (Admin only)
     */
    @GetMapping("/statistics/top-tours")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy top tours được đặt nhiều nhất")
    public ResponseEntity<List<Object[]>> getTopBookedTours(@RequestParam(defaultValue = "10") int limit) {
        List<Object[]> topTours = bookingTourService.getTopBookedTours(limit);
        return ResponseEntity.ok(topTours);
    }

    /**
     * Thống kê booking theo trạng thái (Admin only)
     */
    @GetMapping("/statistics/by-status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Thống kê booking theo trạng thái")
    public ResponseEntity<List<Object[]>> getBookingStatsByStatus() {
        List<Object[]> stats = bookingTourService.getBookingStatsByStatus();
        return ResponseEntity.ok(stats);
    }

    /**
     * Dashboard statistics (Admin only)
     */
    @GetMapping("/dashboard-stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy thống kê dashboard cho booking")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBookings", bookingTourService.getTotalBookings());
        stats.put("newBookingsThisMonth", bookingTourService.getNewBookingsThisMonth());
        stats.put("currentMonthRevenue", bookingTourService.getCurrentMonthRevenue());
        return ResponseEntity.ok(stats);
    }
}

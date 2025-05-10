package com.travel.controller;

import com.travel.service.BookingTourService;
import com.travel.service.TourService;
import com.travel.service.UserService;
import com.travel.service.ArticleService;
import com.travel.service.PdfService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller xử lý các API thống kê và báo cáo
 */
@RestController
@RequestMapping("/api/statistics")
@Tag(name = "Statistics & Reports", description = "APIs thống kê và báo cáo")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class StatisticsController {

    @Autowired
    private UserService userService;

    @Autowired
    private TourService tourService;

    @Autowired
    private BookingTourService bookingTourService;

    @Autowired
    private ArticleService articleService;

    @Autowired
    private PdfService pdfService;

    /**
     * Dashboard tổng quan
     */
    @GetMapping("/dashboard")
    @Operation(summary = "Lấy thống kê dashboard tổng quan")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Thống kê tổng quan
        stats.put("totalUsers", userService.getTotalUsers());
        stats.put("totalTours", tourService.getTotalTours());
        stats.put("totalBookings", bookingTourService.getTotalBookings());
        stats.put("totalArticles", articleService.getTotalArticles());
        
        // Thống kê tháng hiện tại
        stats.put("newUsersThisMonth", userService.getNewUsersThisMonth());
        stats.put("newBookingsThisMonth", bookingTourService.getNewBookingsThisMonth());
        stats.put("currentMonthRevenue", bookingTourService.getCurrentMonthRevenue());
        stats.put("publishedArticles", articleService.getPublishedArticlesCount());
        
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê người dùng theo tháng
     */
    @GetMapping("/users/monthly")
    @Operation(summary = "Thống kê số lượng người dùng theo tháng")
    public ResponseEntity<List<Object[]>> getUserStatsByMonth(@RequestParam int year) {
        List<Object[]> stats = userService.getUserStatsByMonth(year);
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê doanh thu theo tháng
     */
    @GetMapping("/revenue/monthly")
    @Operation(summary = "Thống kê doanh thu theo tháng")
    public ResponseEntity<List<Object[]>> getRevenueStatsByMonth(@RequestParam int year) {
        List<Object[]> stats = bookingTourService.getRevenueStatsByMonth(year);
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê doanh thu theo quý
     */
    @GetMapping("/revenue/quarterly")
    @Operation(summary = "Thống kê doanh thu theo quý")
    public ResponseEntity<List<Object[]>> getRevenueStatsByQuarter(@RequestParam int year) {
        List<Object[]> stats = bookingTourService.getRevenueStatsByQuarter(year);
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê tổng doanh thu theo năm
     */
    @GetMapping("/revenue/yearly")
    @Operation(summary = "Thống kê tổng doanh thu theo năm")
    public ResponseEntity<Map<String, Object>> getTotalRevenueByYear(@RequestParam int year) {
        BigDecimal totalRevenue = bookingTourService.getTotalRevenueByYear(year);
        
        Map<String, Object> response = new HashMap<>();
        response.put("year", year);
        response.put("totalRevenue", totalRevenue);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Top tours được đặt nhiều nhất
     */
    @GetMapping("/tours/top-booked")
    @Operation(summary = "Lấy top tours được đặt nhiều nhất")
    public ResponseEntity<List<Object[]>> getTopBookedTours(
            @RequestParam(defaultValue = "10") int limit) {
        List<Object[]> topTours = bookingTourService.getTopBookedTours(limit);
        return ResponseEntity.ok(topTours);
    }

    /**
     * Thống kê booking theo trạng thái
     */
    @GetMapping("/bookings/status")
    @Operation(summary = "Thống kê booking theo trạng thái")
    public ResponseEntity<List<Object[]>> getBookingStatsByStatus() {
        List<Object[]> stats = bookingTourService.getBookingStatsByStatus();
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê tours theo loại
     */
    @GetMapping("/tours/type")
    @Operation(summary = "Thống kê tours theo loại")
    public ResponseEntity<List<Object[]>> getTourStatsByType() {
        List<Object[]> stats = tourService.getTourStatsByType();
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê tours theo trạng thái
     */
    @GetMapping("/tours/status")
    @Operation(summary = "Thống kê tours theo trạng thái")
    public ResponseEntity<List<Object[]>> getTourStatsByStatus() {
        List<Object[]> stats = tourService.getTourStatsByStatus();
        return ResponseEntity.ok(stats);
    }

    /**
     * Xuất báo cáo doanh thu PDF theo tháng
     */
    @GetMapping("/revenue/monthly/pdf")
    @Operation(summary = "Xuất báo cáo doanh thu PDF theo tháng")
    public ResponseEntity<byte[]> exportMonthlyRevenuePdf(
            @RequestParam int year,
            @RequestParam int month) {
        
        // Lấy dữ liệu doanh thu
        BigDecimal monthlyRevenue = bookingTourService.getCurrentMonthRevenue();
        
        String title = "BÁO CÁO DOANH THU THÁNG " + month + "/" + year;
        String period = "Tháng " + month + "/" + year;
        String totalRevenue = String.format("%,.0f VNĐ", monthlyRevenue);
        String details = "Chi tiết doanh thu tháng " + month + "/" + year;
        
        byte[] pdfBytes = pdfService.generateRevenueReportPdf(title, period, totalRevenue, details);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", 
            "bao-cao-doanh-thu-" + month + "-" + year + ".pdf");
        
        return ResponseEntity.ok()
            .headers(headers)
            .body(pdfBytes);
    }

    /**
     * Xuất báo cáo doanh thu PDF theo năm
     */
    @GetMapping("/revenue/yearly/pdf")
    @Operation(summary = "Xuất báo cáo doanh thu PDF theo năm")
    public ResponseEntity<byte[]> exportYearlyRevenuePdf(@RequestParam int year) {
        
        BigDecimal yearlyRevenue = bookingTourService.getTotalRevenueByYear(year);
        
        String title = "BÁO CÁO DOANH THU NĂM " + year;
        String period = "Năm " + year;
        String totalRevenue = String.format("%,.0f VNĐ", yearlyRevenue);
        String details = "Chi tiết doanh thu năm " + year;
        
        byte[] pdfBytes = pdfService.generateRevenueReportPdf(title, period, totalRevenue, details);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", 
            "bao-cao-doanh-thu-nam-" + year + ".pdf");
        
        return ResponseEntity.ok()
            .headers(headers)
            .body(pdfBytes);
    }

    /**
     * Thống kê tăng trưởng theo tháng
     */
    @GetMapping("/growth/monthly")
    @Operation(summary = "Thống kê tăng trưởng theo tháng")
    public ResponseEntity<Map<String, Object>> getMonthlyGrowthStats(
            @RequestParam int year,
            @RequestParam int month) {
        
        Map<String, Object> growth = new HashMap<>();
        
        // Thống kê cơ bản
        growth.put("newUsers", userService.getNewUsersThisMonth());
        growth.put("newBookings", bookingTourService.getNewBookingsThisMonth());
        growth.put("revenue", bookingTourService.getCurrentMonthRevenue());
        
        // Tính toán tỷ lệ tăng trưởng (so với tháng trước)
        // Ở đây có thể thêm logic so sánh với tháng trước
        growth.put("userGrowthRate", 0.0); // Placeholder
        growth.put("bookingGrowthRate", 0.0); // Placeholder
        growth.put("revenueGrowthRate", 0.0); // Placeholder
        
        return ResponseEntity.ok(growth);
    }

    /**
     * Thống kê hoạt động hệ thống
     */
    @GetMapping("/system-activity")
    @Operation(summary = "Thống kê hoạt động hệ thống")
    public ResponseEntity<Map<String, Object>> getSystemActivityStats() {
        Map<String, Object> activity = new HashMap<>();
        
        // Thời gian server
        activity.put("serverTime", LocalDateTime.now().format(
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
        
        // Thống kê hoạt động
        activity.put("activeUsers", userService.getTotalUsers()); // Users active
        activity.put("pendingBookings", 0); // Số booking đang chờ xử lý
        activity.put("activeTours", tourService.getActiveTours().size());
        activity.put("publishedArticles", articleService.getPublishedArticlesCount());
        
        return ResponseEntity.ok(activity);
    }
}

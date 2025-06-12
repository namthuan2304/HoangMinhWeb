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

    // ========== USER STATISTICS APIs ==========

    /**
     * Thống kê người dùng tổng quan
     */
    @GetMapping("/users/overview")
    @Operation(summary = "Thống kê người dùng tổng quan")
    public ResponseEntity<Map<String, Object>> getUserOverview() {
        Map<String, Object> overview = new HashMap<>();
        
        // Tổng số người dùng
        overview.put("totalUsers", userService.getTotalUsers());
        overview.put("newUsersThisMonth", userService.getNewUsersThisMonth());
        overview.put("activeUsers", userService.getActiveUsers());
        overview.put("inactiveUsers", userService.getInactiveUsers());
        
        // Tỷ lệ tăng trưởng
        overview.put("userGrowthRate", userService.getUserGrowthRate());
        overview.put("activeRate", userService.getActiveUserRate());
        
        return ResponseEntity.ok(overview);
    }    /**
     * Thống kê người dùng theo độ tuổi
     */
    @GetMapping("/users/age-distribution")
    @Operation(summary = "Thống kê người dùng theo độ tuổi")
    public ResponseEntity<List<Object[]>> getUserAgeDistribution() {
        List<Object[]> stats = userService.getUserAgeDistribution();
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê người dùng theo vị trí
     */
    @GetMapping("/users/location-distribution")
    @Operation(summary = "Thống kê người dùng theo vị trí")
    public ResponseEntity<List<Object[]>> getUserLocationDistribution() {
        List<Object[]> stats = userService.getUserLocationDistribution();
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê người dùng theo giới tính
     */
    @GetMapping("/users/gender-distribution")
    @Operation(summary = "Thống kê người dùng theo giới tính")
    public ResponseEntity<List<Object[]>> getUserGenderDistribution() {
        List<Object[]> stats = userService.getUserGenderDistribution();
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê hoạt động đăng ký người dùng theo ngày
     */
    @GetMapping("/users/registration-trends")
    @Operation(summary = "Thống kê hoạt động đăng ký người dùng theo ngày")
    public ResponseEntity<List<Object[]>> getUserRegistrationTrends(
            @RequestParam(defaultValue = "30") int days) {
        List<Object[]> stats = userService.getUserRegistrationTrends(days);
        return ResponseEntity.ok(stats);
    }

    /**
     * Top người dùng có nhiều booking nhất
     */
    @GetMapping("/users/top-bookings")
    @Operation(summary = "Top người dùng có nhiều booking nhất")
    public ResponseEntity<List<Object[]>> getTopUsersByBookings(
            @RequestParam(defaultValue = "10") int limit) {
        List<Object[]> stats = userService.getTopUsersByBookings(limit);
        return ResponseEntity.ok(stats);
    }

    /**
     * Người dùng mới nhất
     */
    @GetMapping("/users/recent")
    @Operation(summary = "Danh sách người dùng mới nhất")
    public ResponseEntity<List<Object[]>> getRecentUsers(
            @RequestParam(defaultValue = "10") int limit) {
        List<Object[]> stats = userService.getRecentUsers(limit);
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê tổng số người dùng
     */
    @GetMapping("/users/total")
    @Operation(summary = "Thống kê tổng số người dùng")
    public ResponseEntity<Map<String, Object>> getUserTotal() {
        Map<String, Object> response = new HashMap<>();
        response.put("count", userService.getTotalUsers());
        response.put("growthRate", userService.getUserGrowthRate());
        return ResponseEntity.ok(response);
    }

    /**
     * Thống kê người dùng mới
     */
    @GetMapping("/users/new-users")
    @Operation(summary = "Thống kê người dùng mới")
    public ResponseEntity<Map<String, Object>> getNewUsers(
            @RequestParam(defaultValue = "30") int days) {
        Map<String, Object> response = new HashMap<>();
        response.put("count", userService.getNewUsersThisMonth());
        response.put("growthRate", userService.getUserGrowthRate());
        return ResponseEntity.ok(response);
    }

    /**
     * Thống kê người dùng đang hoạt động
     */
    @GetMapping("/users/active")
    @Operation(summary = "Thống kê người dùng đang hoạt động")
    public ResponseEntity<Map<String, Object>> getActiveUsers() {
        Map<String, Object> response = new HashMap<>();
        response.put("count", userService.getActiveUsers());
        response.put("growthRate", userService.getActiveUserRate());
        return ResponseEntity.ok(response);
    }

    /**
     * Thống kê tỷ lệ giữ chân người dùng
     */
    @GetMapping("/users/retention-rate")
    @Operation(summary = "Thống kê tỷ lệ giữ chân người dùng")
    public ResponseEntity<Map<String, Object>> getUserRetentionRate() {
        Map<String, Object> response = new HashMap<>();
        response.put("rate", 68.5); // Placeholder value
        response.put("change", 4.1); // Placeholder value
        return ResponseEntity.ok(response);
    }

    /**
     * Top người dùng theo booking
     */
    @GetMapping("/users/top-by-bookings")
    @Operation(summary = "Top người dùng theo booking")
    public ResponseEntity<List<Object[]>> getTopUsersByBookingsAlias(
            @RequestParam(defaultValue = "10") int limit) {
        List<Object[]> stats = userService.getTopUsersByBookings(limit);
        return ResponseEntity.ok(stats);
    }

    /**
     * Người dùng mới gần đây
     */
    @GetMapping("/users/recent-users")
    @Operation(summary = "Người dùng mới gần đây")
    public ResponseEntity<List<Object[]>> getRecentUsersAlias(
            @RequestParam(defaultValue = "10") int limit) {
        List<Object[]> stats = userService.getRecentUsers(limit);
        return ResponseEntity.ok(stats);
    }

    // ========== TOUR STATISTICS APIs ==========

    /**
     * Thống kê tours tổng quan
     */
    @GetMapping("/tours/overview")
    @Operation(summary = "Thống kê tours tổng quan")
    public ResponseEntity<Map<String, Object>> getTourOverview() {
        Map<String, Object> overview = new HashMap<>();
        
        // Tổng số tours
        overview.put("totalTours", tourService.getTotalTours());
        overview.put("activeTours", tourService.getActiveTours().size());
        overview.put("inactiveTours", tourService.getInactiveTours().size());
        overview.put("newToursThisMonth", tourService.getNewToursThisMonth());
        
        // Thống kê booking
        overview.put("totalBookings", bookingTourService.getTotalBookings());
        overview.put("totalRevenue", bookingTourService.getCurrentMonthRevenue());
        overview.put("averageRating", tourService.getAverageRating());
        
        // Tỷ lệ hiệu quả
        overview.put("bookingRate", tourService.getBookingRate());
        overview.put("completionRate", bookingTourService.getCompletionRate());
        overview.put("cancellationRate", bookingTourService.getCancellationRate());
        
        return ResponseEntity.ok(overview);
    }

    /**
     * Thống kê booking tours theo ngày
     */
    @GetMapping("/tours/booking-trends")
    @Operation(summary = "Thống kê booking tours theo ngày")
    public ResponseEntity<List<Object[]>> getTourBookingTrends(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "daily") String type) {
        List<Object[]> stats = bookingTourService.getBookingTrends(days, type);
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê tours theo điểm đến phổ biến
     */
    @GetMapping("/tours/popular-destinations")
    @Operation(summary = "Thống kê tours theo điểm đến phổ biến")
    public ResponseEntity<List<Object[]>> getPopularDestinations(
            @RequestParam(defaultValue = "10") int limit) {
        List<Object[]> stats = tourService.getPopularDestinations(limit);
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê tours theo danh mục
     */
    @GetMapping("/tours/category-distribution")
    @Operation(summary = "Thống kê tours theo danh mục")
    public ResponseEntity<List<Object[]>> getTourCategoryDistribution() {
        List<Object[]> stats = tourService.getTourCategoryDistribution();
        return ResponseEntity.ok(stats);
    }

    /**
     * Top tours hiệu quả nhất
     */
    @GetMapping("/tours/top-performance")
    @Operation(summary = "Top tours hiệu quả nhất")
    public ResponseEntity<List<Object[]>> getTopPerformanceTours(
            @RequestParam(defaultValue = "10") int limit) {
        List<Object[]> stats = tourService.getTopPerformanceTours(limit);
        return ResponseEntity.ok(stats);
    }    /**
     * Tours mới nhất
     */
    @GetMapping("/tours/recent")
    @Operation(summary = "Danh sách tours mới nhất")
    public ResponseEntity<List<Object[]>> getRecentTours(
            @RequestParam(defaultValue = "10") int limit) {
        List<Object[]> stats = tourService.getRecentTours(limit);
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê doanh thu theo tours
     */
    @GetMapping("/tours/revenue-breakdown")
    @Operation(summary = "Thống kê doanh thu theo tours")
    public ResponseEntity<List<Object[]>> getTourRevenueBreakdown(
            @RequestParam(defaultValue = "30") int days) {
        List<Object[]> stats = tourService.getTourRevenueBreakdown(days);
        return ResponseEntity.ok(stats);
    }    /**
     * Thống kê đánh giá tours
     */
    @GetMapping("/tours/rating-distribution")
    @Operation(summary = "Thống kê đánh giá tours")
    public ResponseEntity<List<Object[]>> getTourRatingDistribution() {
        List<Object[]> stats = tourService.getTourRatingDistribution();
        return ResponseEntity.ok(stats);
    }

    // ========== MISSING USER STATISTICS APIs ==========

    /**
     * Thống kê người dùng theo khu vực
     */
    @GetMapping("/users/regional-stats")
    @Operation(summary = "Thống kê người dùng theo khu vực")
    public ResponseEntity<List<Object[]>> getUserRegionalStats() {
        List<Object[]> stats = userService.getUserLocationDistribution();
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê hoạt động người dùng hàng ngày
     */
    @GetMapping("/users/daily-activity")
    @Operation(summary = "Thống kê hoạt động người dùng hàng ngày")
    public ResponseEntity<List<Object[]>> getUserDailyActivity(
            @RequestParam(defaultValue = "30") int days) {
        List<Object[]> stats = userService.getUserDailyActivity(days);
        return ResponseEntity.ok(stats);
    }

    /**
     * Thống kê tăng trưởng người dùng
     */
    @GetMapping("/users/growth-stats")
    @Operation(summary = "Thống kê tăng trưởng người dùng")
    public ResponseEntity<Map<String, Object>> getUserGrowthStats() {
        Map<String, Object> growthStats = new HashMap<>();
        
        // Thống kê tăng trưởng
        growthStats.put("totalUsers", userService.getTotalUsers());
        growthStats.put("newUsersThisMonth", userService.getNewUsersThisMonth());
        growthStats.put("newUsersLastMonth", userService.getNewUsersLastMonth());
        growthStats.put("growthRate", userService.getUserGrowthRate());
        
        // Dự đoán tăng trưởng
        long avgGrowthPerMonth = (userService.getNewUsersThisMonth() + userService.getNewUsersLastMonth()) / 2;
        growthStats.put("predictedNextMonth", avgGrowthPerMonth);
        
        return ResponseEntity.ok(growthStats);
    }

    // ========== MISSING TOUR STATISTICS APIs ==========

    /**
     * Tổng số tours
     */
    @GetMapping("/tours/total")
    @Operation(summary = "Tổng số tours")
    public ResponseEntity<Map<String, Object>> getTotalTours() {
        Map<String, Object> response = new HashMap<>();
        response.put("count", tourService.getTotalTours());
        response.put("growthRate", tourService.getTourGrowthRate());
        return ResponseEntity.ok(response);
    }

    /**
     * Tours mới
     */
    @GetMapping("/tours/new-tours")
    @Operation(summary = "Tours mới")
    public ResponseEntity<Map<String, Object>> getNewTours(
            @RequestParam(defaultValue = "30") int days) {
        Map<String, Object> response = new HashMap<>();
        response.put("count", tourService.getNewToursCount(days));
        response.put("growthRate", tourService.getNewToursGrowthRate());
        return ResponseEntity.ok(response);
    }

    /**
     * Đánh giá trung bình của tours
     */
    @GetMapping("/tours/average-rating")
    @Operation(summary = "Đánh giá trung bình của tours")
    public ResponseEntity<Map<String, Object>> getAverageRating() {
        Map<String, Object> response = new HashMap<>();
        response.put("rating", tourService.getAverageRating());
        response.put("change", tourService.getRatingChange());
        return ResponseEntity.ok(response);
    }

    /**
     * Tỷ lệ booking tours
     */
    @GetMapping("/tours/booking-rate")
    @Operation(summary = "Tỷ lệ booking tours")
    public ResponseEntity<Map<String, Object>> getTourBookingRate() {
        Map<String, Object> response = new HashMap<>();
        response.put("rate", tourService.getBookingRate());
        response.put("change", tourService.getBookingRateChange());
        return ResponseEntity.ok(response);
    }    // ========== MISSING BOOKING STATISTICS APIs ==========

    /**
     * Tổng số bookings
     */
    @GetMapping("/bookings/total")
    @Operation(summary = "Tổng số bookings")
    public ResponseEntity<Map<String, Object>> getTotalBookings() {
        Map<String, Object> response = new HashMap<>();
        response.put("count", bookingTourService.getTotalBookings());
        response.put("growthRate", bookingTourService.getBookingGrowthRate());
        return ResponseEntity.ok(response);
    }

    /**
     * Tỷ lệ hoàn thành booking
     */
    @GetMapping("/bookings/completion-rate")
    @Operation(summary = "Tỷ lệ hoàn thành booking")
    public ResponseEntity<Map<String, Object>> getBookingCompletionRate() {
        Map<String, Object> response = new HashMap<>();
        response.put("rate", bookingTourService.getCompletionRate());
        response.put("change", bookingTourService.getCompletionRateChange());
        return ResponseEntity.ok(response);
    }

    /**
     * Tỷ lệ hủy booking
     */
    @GetMapping("/bookings/cancellation-rate")
    @Operation(summary = "Tỷ lệ hủy booking")
    public ResponseEntity<Map<String, Object>> getBookingCancellationRate() {
        Map<String, Object> response = new HashMap<>();
        response.put("rate", bookingTourService.getCancellationRate());
        response.put("change", bookingTourService.getCancellationRateChange());
        return ResponseEntity.ok(response);
    }

    /**
     * Xu hướng booking
     */
    @GetMapping("/bookings/trends")
    @Operation(summary = "Xu hướng booking")
    public ResponseEntity<List<Object[]>> getBookingTrends(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "daily") String type) {
        List<Object[]> stats = bookingTourService.getBookingTrends(days, type);
        return ResponseEntity.ok(stats);
    }
}

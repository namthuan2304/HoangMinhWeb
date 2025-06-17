package com.travel.controller;

import com.travel.dto.request.ChangePasswordRequest;
import com.travel.dto.request.UpdateProfileRequest;
import com.travel.dto.response.MessageResponse;
import com.travel.dto.response.UserResponse;
import com.travel.enums.UserRole;
import com.travel.service.UserService;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller xử lý các API liên quan đến User
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "APIs quản lý người dùng")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * Lấy danh sách users (Admin only)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy danh sách người dùng", description = "Lấy danh sách tất cả người dùng với phân trang và tìm kiếm")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) UserRole role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<UserResponse> users = userService.getAllUsers(keyword, role, pageable);
        
        return ResponseEntity.ok(users);
    }

    /**
     * Lấy thông tin user theo ID (Admin only)
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy thông tin người dùng theo ID")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    /**
     * Cập nhật thông tin user (Admin only)
     */    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật thông tin người dùng")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProfileRequest request) {
        
        // Debug log
        System.out.println("Updating user " + id + " with data: " + 
            "fullName=" + request.getFullName() + 
            ", role=" + request.getRole() + 
            ", isActive=" + request.getIsActive());
            
        UserResponse updatedUser = userService.updateUser(id, request);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Xóa user (Admin only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Xóa người dùng")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(new MessageResponse("Xóa người dùng thành công"));
    }

    /**
     * Reset mật khẩu user (Admin only)
     */
    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reset mật khẩu người dùng về mặc định")
    public ResponseEntity<MessageResponse> resetUserPassword(@PathVariable Long id) {
        userService.resetUserPassword(id);
        return ResponseEntity.ok(new MessageResponse("Reset mật khẩu thành công. Mật khẩu mới: 123456"));
    }

    /**
     * Lấy thống kê users theo tháng (Admin only)
     */
    @GetMapping("/statistics/monthly")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Thống kê số lượng người dùng theo tháng")
    public ResponseEntity<List<Object[]>> getUserStatsByMonth(@RequestParam int year) {
        List<Object[]> stats = userService.getUserStatsByMonth(year);
        return ResponseEntity.ok(stats);
    }

    /**
     * Tạo admin mới (Admin only)
     */
    @PostMapping("/create-admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tạo tài khoản admin mới")
    public ResponseEntity<UserResponse> createAdmin(
            @RequestParam String username,
            @RequestParam String email,
            @RequestParam String fullName) {
        UserResponse admin = userService.createAdmin(username, email, fullName);
        return ResponseEntity.ok(admin);
    }

    /**
     * Cập nhật vai trò user (Admin only)
     */
    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật vai trò người dùng")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable Long id,
            @RequestParam UserRole role) {
        UserResponse updatedUser = userService.updateUserRole(id, role);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Kích hoạt/vô hiệu hóa user (Admin only)
     */
    @PutMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Kích hoạt/vô hiệu hóa người dùng")
    public ResponseEntity<UserResponse> toggleUserStatus(@PathVariable Long id) {
        UserResponse updatedUser = userService.toggleUserStatus(id);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Lấy thông tin cá nhân
     */
    @GetMapping("/profile")
    @Operation(summary = "Lấy thông tin cá nhân")
    public ResponseEntity<UserResponse> getProfile(Authentication authentication) {
        UserResponse user = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(user);
    }

    /**
     * Cập nhật thông tin cá nhân
     */
    @PutMapping("/profile")
    @Operation(summary = "Cập nhật thông tin cá nhân")
    public ResponseEntity<UserResponse> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse updatedUser = userService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(updatedUser);
    }    /**
     * Đổi mật khẩu
     */
    @PostMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu")
    public ResponseEntity<MessageResponse> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        
        try {
            System.out.println("Change password request received for user: " + authentication.getName());
            System.out.println("Request data - currentPassword: " + (request.getCurrentPassword() != null ? "[PROVIDED]" : "null"));
            System.out.println("Request data - newPassword: " + (request.getNewPassword() != null ? "[PROVIDED]" : "null"));
            System.out.println("Request data - confirmPassword: " + (request.getConfirmPassword() != null ? "[PROVIDED]" : "null"));
            
            if (!request.isPasswordMatching()) {
                System.out.println("Password matching validation failed");
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Mật khẩu mới và xác nhận mật khẩu không khớp"));
            }
            
            userService.changePassword(authentication.getName(), request);
            System.out.println("Password changed successfully for user: " + authentication.getName());
            return ResponseEntity.ok(new MessageResponse("Đổi mật khẩu thành công"));
            
        } catch (Exception e) {
            System.err.println("Change password error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                .body(new MessageResponse("Có lỗi xảy ra khi đổi mật khẩu: " + e.getMessage()));
        }
    }

    /**
     * Upload ảnh đại diện
     */
    @PostMapping("/upload-avatar")
    @Operation(summary = "Upload ảnh đại diện")
    public ResponseEntity<UserResponse> uploadAvatar(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {
        UserResponse updatedUser = userService.uploadAvatar(authentication.getName(), file);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Dashboard statistics (Admin only)
     */
    @GetMapping("/dashboard-stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy thống kê dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userService.getTotalUsers());
        stats.put("newUsersThisMonth", userService.getNewUsersThisMonth());
        return ResponseEntity.ok(stats);
    }
}

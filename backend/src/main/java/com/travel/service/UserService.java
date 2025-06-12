package com.travel.service;

import com.travel.dto.request.ChangePasswordRequest;
import com.travel.dto.request.UpdateProfileRequest;
import com.travel.dto.response.UserResponse;
import com.travel.entity.User;
import com.travel.enums.UserRole;
import com.travel.exception.ResourceNotFoundException;
import com.travel.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service xử lý logic nghiệp vụ cho User
 */
@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private FileUploadService fileUploadService;

    /**
     * Lấy danh sách users có phân trang và tìm kiếm
     */
    public Page<UserResponse> getAllUsers(String keyword, UserRole role, Pageable pageable) {
        Page<User> users;
        
        if (keyword != null && !keyword.trim().isEmpty() && role != null) {
            users = userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseAndRoleAndDeletedAtIsNull(
                keyword, keyword, role, pageable);
        } else if (keyword != null && !keyword.trim().isEmpty()) {
            users = userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseAndDeletedAtIsNull(
                keyword, keyword, pageable);
        } else if (role != null) {
            users = userRepository.findByRoleAndDeletedAtIsNull(role, pageable);
        } else {
            users = userRepository.findByDeletedAtIsNull(pageable);
        }
        
        return users.map(user -> modelMapper.map(user, UserResponse.class));
    }

    /**
     * Lấy thông tin user theo ID
     */
    public UserResponse getUserById(Long id) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
        return modelMapper.map(user, UserResponse.class);
    }

    /**
     * Lấy thông tin user theo username
     */
    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsernameAndDeletedAtIsNull(username)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với username: " + username));
        return modelMapper.map(user, UserResponse.class);
    }    /**
     * Cập nhật thông tin user (Admin)
     */    public UserResponse updateUser(Long id, UpdateProfileRequest request) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        if (request.getBirthDate() != null) {
            user.setBirthDate(request.getBirthDate());
        }        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }        if (request.getRole() != null) {
            System.out.println("Updating user role from " + user.getRole() + " to " + request.getRole());
            user.setRole(request.getRole());
        }

        User savedUser = userRepository.save(user);
        return modelMapper.map(savedUser, UserResponse.class);
    }

    /**
     * Cập nhật thông tin cá nhân
     */    public UserResponse updateProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsernameAndDeletedAtIsNull(username)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        if (request.getBirthDate() != null) {
            user.setBirthDate(request.getBirthDate());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }

        User savedUser = userRepository.save(user);
        return modelMapper.map(savedUser, UserResponse.class);
    }

    /**
     * Đổi mật khẩu
     */
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsernameAndDeletedAtIsNull(username)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không đúng");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * Upload ảnh đại diện
     */
    public UserResponse uploadAvatar(String username, MultipartFile file) {
        User user = userRepository.findByUsernameAndDeletedAtIsNull(username)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        String avatarUrl = fileUploadService.uploadFile(file, "avatars");
        user.setAvatarUrl(avatarUrl);
        
        User savedUser = userRepository.save(user);
        return modelMapper.map(savedUser, UserResponse.class);
    }

    /**
     * Xóa user (soft delete)
     */
    public void deleteUser(Long id) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
        
        user.markAsDeleted();
        userRepository.save(user);
    }

    /**
     * Reset mật khẩu về mặc định (Admin)
     */
    public void resetUserPassword(Long id) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
        
        user.setPassword(passwordEncoder.encode("123456")); // Mật khẩu mặc định
        userRepository.save(user);
    }    /**
     * Thống kê số lượng users theo tháng
     */
    public List<Object[]> getUserStatsByMonth(int year) {
        LocalDateTime startOfYear = LocalDateTime.of(year, 1, 1, 0, 0);
        LocalDateTime endOfYear = LocalDateTime.of(year, 12, 31, 23, 59, 59);
        return userRepository.countUsersByMonth(startOfYear, endOfYear);
    }

    /**
     * Tạo admin mới
     */
    public UserResponse createAdmin(String username, String email, String fullName) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username đã tồn tại");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }

        User admin = new User();
        admin.setUsername(username);
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode("admin123")); // Mật khẩu mặc định cho admin
        admin.setFullName(fullName);
        admin.setRole(UserRole.ADMIN);
        admin.setIsEmailVerified(true);
        admin.setIsActive(true);

        User savedAdmin = userRepository.save(admin);
        return modelMapper.map(savedAdmin, UserResponse.class);
    }

    /**
     * Cập nhật vai trò user
     */
    public UserResponse updateUserRole(Long id, UserRole role) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
        
        user.setRole(role);
        User savedUser = userRepository.save(user);
        return modelMapper.map(savedUser, UserResponse.class);
    }

    /**
     * Kích hoạt/vô hiệu hóa user
     */
    public UserResponse toggleUserStatus(Long id) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
        
        user.setIsActive(!user.getIsActive());
        User savedUser = userRepository.save(user);
        return modelMapper.map(savedUser, UserResponse.class);
    }

    /**
     * Lấy tổng số users
     */
    public long getTotalUsers() {
        return userRepository.countByDeletedAtIsNull();
    }

    /**
     * Lấy tỷ lệ tăng trưởng user
     */
    public double getUserGrowthRate() {
        long thisMonth = userRepository.countNewUsersThisMonth();
        long lastMonth = userRepository.countNewUsersLastMonth();
        if (lastMonth == 0) return 0;
        return ((double) thisMonth - lastMonth) / lastMonth * 100;
    }

    /**
     * Lấy số users mới tháng này
     */
    public long getNewUsersThisMonth() {
        return userRepository.countNewUsersThisMonth();
    }

    /**
     * Lấy số users mới tháng trước
     */
    public long getNewUsersLastMonth() {
        return userRepository.countNewUsersLastMonth();
    }

    /**
     * Lấy số users đang hoạt động
     */
    public long getActiveUsers() {
        return userRepository.countActiveUsers();
    }

    /**
     * Lấy tỷ lệ users hoạt động
     */
    public double getActiveUserRate() {
        long totalUsers = getTotalUsers();
        long activeUsers = getActiveUsers();
        if (totalUsers == 0) return 0;
        return ((double) activeUsers / totalUsers) * 100;
    }

    /**
     * Lấy tỷ lệ giữ chân users
     */
    public double getUserRetentionRate() {
        // Tính toán tỷ lệ users có booking trong 3 tháng gần nhất
        long activeUsers = userRepository.countUsersWithRecentBookings();
        long totalUsers = getTotalUsers();
        if (totalUsers == 0) return 0;
        return ((double) activeUsers / totalUsers) * 100;
    }

    /**
     * Thống kê hoạt động users hàng ngày
     */
    public List<Object[]> getUserDailyActivity(int days) {
        LocalDateTime fromDate = LocalDateTime.now().minusDays(days);
        return userRepository.getUserDailyActivity(fromDate);
    }

    /**
     * Thống kê phân bố độ tuổi
     */
    public List<Object[]> getUserAgeDistribution() {
        return userRepository.getUserAgeDistribution();
    }

    /**
     * Thống kê phân bố theo vị trí
     */
    public List<Object[]> getUserLocationDistribution() {
        return userRepository.getUserLocationDistribution();
    }

    /**
     * Thống kê phân bố theo giới tính
     */
    public List<Object[]> getUserGenderDistribution() {
        return userRepository.getUserGenderDistribution();
    }

    /**
     * Thống kê xu hướng đăng ký theo ngày
     */
    public List<Object[]> getUserRegistrationTrends(int days) {
        LocalDateTime fromDate = LocalDateTime.now().minusDays(days);
        return userRepository.getUserRegistrationTrends(fromDate);
    }    /**
     * Top users có nhiều booking nhất
     */
    public List<Object[]> getTopUsersByBookings(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return userRepository.getTopUsersByBookings(pageable);
    }

    /**
     * Users mới nhất
     */
    public List<Object[]> getRecentUsers(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return userRepository.getRecentUsers(pageable);
    }
}

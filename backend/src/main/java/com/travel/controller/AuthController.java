package com.travel.controller;

import com.travel.dto.request.LoginRequest;
import com.travel.dto.request.SignupRequest;
import com.travel.dto.request.ForgotPasswordRequest;
import com.travel.dto.request.GoogleAuthRequest;
import com.travel.dto.response.JwtResponse;
import com.travel.dto.response.MessageResponse;
import com.travel.entity.User;
import com.travel.enums.UserRole;
import com.travel.repository.UserRepository;
import com.travel.service.JwtService;
import com.travel.service.EmailService;
import com.travel.service.GoogleAuthService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller xử lý authentication và authorization
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "API xác thực và phân quyền")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private EmailService emailService;
    
    @Autowired
    private GoogleAuthService googleAuthService;

    @PostMapping("/signin")
    @Operation(summary = "Đăng nhập", description = "Đăng nhập với username/email và password")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            User userDetails = (User) authentication.getPrincipal();
            
            // Cập nhật thời gian đăng nhập cuối
            userDetails.updateLastLogin();
            userRepository.save(userDetails);
            
            String jwt = jwtService.generateJwtToken(authentication);
            String refreshToken = jwtService.generateRefreshToken(userDetails.getUsername());

            List<String> roles = userDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList());

            return ResponseEntity.ok(new JwtResponse(jwt, refreshToken,
                    userDetails.getId(),
                    userDetails.getUsername(),
                    userDetails.getEmail(),
                    userDetails.getFullName(),
                    roles));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Tên đăng nhập hoặc mật khẩu không chính xác!"));
        }
    }

    @PostMapping("/signup")
    @Operation(summary = "Đăng ký", description = "Đăng ký tài khoản mới")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Tên người dùng đã tồn tại!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Email đã được sử dụng!"));
        }

        // Tạo tài khoản mới
        User user = new User(signUpRequest.getUsername(),
                           signUpRequest.getEmail(),
                           encoder.encode(signUpRequest.getPassword()));

        user.setFullName(signUpRequest.getFullName());
        user.setPhone(signUpRequest.getPhone());
        user.setRole(UserRole.USER);
        
        // Tạo email verification token
        String verificationToken = UUID.randomUUID().toString();
        user.setEmailVerificationToken(verificationToken);
        user.setEmailVerificationExpiresAt(LocalDateTime.now().plusHours(24));

        userRepository.save(user);

        // Gửi email xác thực
        try {
            emailService.sendEmailVerification(user.getEmail(), user.getFullName(), verificationToken);
        } catch (Exception e) {
            // Log error nhưng vẫn cho phép đăng ký thành công
            System.err.println("Lỗi gửi email xác thực: " + e.getMessage());
        }

        return ResponseEntity.ok(MessageResponse.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản."));
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Xác thực email", description = "Xác thực email với token")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        Optional<User> userOptional = userRepository.findByEmailVerificationToken(token);
        
        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Token xác thực không hợp lệ!"));
        }

        User user = userOptional.get();
        
        if (user.getEmailVerificationExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Token xác thực đã hết hạn!"));
        }

        user.setIsEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiresAt(null);
        userRepository.save(user);

        return ResponseEntity.ok(MessageResponse.success("Xác thực email thành công!"));
    }    @PostMapping("/forgot-password")
    @Operation(summary = "Quên mật khẩu", description = "Gửi email reset mật khẩu")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());
        
        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Không tìm thấy tài khoản với email này!"));
        }

        User user = userOptional.get();
        String resetToken = UUID.randomUUID().toString();
        user.setPasswordResetToken(resetToken);
        user.setPasswordResetExpiresAt(LocalDateTime.now().plusHours(1)); // Token có hiệu lực 1 giờ
        userRepository.save(user);

        try {
            emailService.sendPasswordReset(user.getEmail(), user.getFullName(), resetToken);
            return ResponseEntity.ok(MessageResponse.success("Email reset mật khẩu đã được gửi!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Lỗi gửi email: " + e.getMessage()));
        }
    }    @PostMapping("/reset-password")
    @Operation(summary = "Reset mật khẩu", description = "Đặt lại mật khẩu với token")
    public ResponseEntity<?> resetPassword(@RequestParam String token, @RequestParam String newPassword) {
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Mật khẩu phải có ít nhất 6 ký tự!"));
        }

        Optional<User> userOptional = userRepository.findByPasswordResetToken(token);
        
        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Token reset mật khẩu không hợp lệ!"));
        }

        User user = userOptional.get();
        
        if (user.getPasswordResetExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Token reset mật khẩu đã hết hạn!"));
        }

        user.setPassword(encoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
        userRepository.save(user);

        return ResponseEntity.ok(MessageResponse.success("Đặt lại mật khẩu thành công!"));
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Làm mới token", description = "Làm mới JWT token")
    public ResponseEntity<?> refreshToken(@RequestParam String refreshToken) {
        try {
            if (jwtService.validateJwtToken(refreshToken)) {
                String username = jwtService.getUsernameFromJwtToken(refreshToken);
                String newToken = jwtService.generateTokenFromUsername(username);
                String newRefreshToken = jwtService.generateRefreshToken(username);
                
                return ResponseEntity.ok(MessageResponse.success("Làm mới token thành công!", 
                    new JwtResponse(newToken, newRefreshToken, null, username, null, null, null)));
            } else {
                return ResponseEntity.badRequest()
                        .body(MessageResponse.error("Refresh token không hợp lệ!"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Lỗi làm mới token: " + e.getMessage()));
        }
    }

    @PostMapping("/signout")
    @Operation(summary = "Đăng xuất", description = "Đăng xuất và hủy token")
    public ResponseEntity<?> logoutUser() {
        // Với JWT stateless, chúng ta chỉ cần clear token ở client
        // Nhưng ở đây chúng ta có thể thêm logic để blacklist token nếu cần
        return ResponseEntity.ok(MessageResponse.success("Đăng xuất thành công!"));
    }
      @PostMapping("/google")
    @Operation(summary = "Đăng nhập bằng Google", description = "Xác thực bằng Google ID Token")
    public ResponseEntity<?> googleSignIn(@Valid @RequestBody GoogleAuthRequest request) {
        try {
            GoogleIdToken.Payload payload = googleAuthService.verifyGoogleToken(request.getCredential());
            User user = googleAuthService.findOrCreateUser(payload);
            
            // Tạo JWT token
            String jwt = jwtService.generateTokenFromUsername(user.getUsername());
            String refreshToken = jwtService.generateRefreshToken(user.getUsername());
            List<String> roles = List.of("ROLE_" + user.getRole().name());
            
            return ResponseEntity.ok(new JwtResponse(
                jwt,
                refreshToken,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                roles
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Đăng nhập Google thất bại: " + e.getMessage()));
        }
    }
      @PostMapping("/google/signup")
    @Operation(summary = "Đăng ký bằng Google", description = "Đăng ký tài khoản mới bằng Google ID Token")
    public ResponseEntity<?> googleSignUp(@Valid @RequestBody GoogleAuthRequest request) {
        try {
            GoogleIdToken.Payload payload = googleAuthService.verifyGoogleToken(request.getCredential());
            String email = payload.getEmail();
            
            // Kiểm tra email đã tồn tại chưa
            if (userRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest()
                        .body(MessageResponse.error("Email này đã được đăng ký!"));
            }
            
            User user = googleAuthService.findOrCreateUser(payload);
            
            // Tạo JWT token
            String jwt = jwtService.generateTokenFromUsername(user.getUsername());
            String refreshToken = jwtService.generateRefreshToken(user.getUsername());
            List<String> roles = List.of("ROLE_" + user.getRole().name());
            
            return ResponseEntity.ok(new JwtResponse(
                jwt,
                refreshToken,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                roles
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Đăng ký Google thất bại: " + e.getMessage()));
        }
    }
    
    @GetMapping("/debug/user/{email}")
    @Operation(summary = "Debug user info", description = "Debug endpoint để kiểm tra thông tin user")
    public ResponseEntity<?> debugUser(@PathVariable String email) {
        try {
            Optional<User> user = userRepository.findByEmail(email);
            if (user.isPresent()) {
                User u = user.get();
                Map<String, Object> info = new HashMap<>();
                info.put("id", u.getId());
                info.put("username", u.getUsername());
                info.put("email", u.getEmail());
                info.put("isActive", u.getIsActive());
                info.put("deletedAt", u.getDeletedAt());
                info.put("role", u.getRole());
                return ResponseEntity.ok(info);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Debug failed: " + e.getMessage()));
        }
    }
}

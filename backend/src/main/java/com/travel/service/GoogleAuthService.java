package com.travel.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.travel.entity.User;
import com.travel.enums.UserRole;
import com.travel.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

/**
 * Service xử lý Google OAuth2 authentication
 */
@Service
public class GoogleAuthService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleAuthService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    /**
     * Xác thực Google ID Token và trả về thông tin user
     */
    public GoogleIdToken.Payload verifyGoogleToken(String idTokenString) throws Exception {
        logger.info("Verifying Google token...");
        
        if (googleClientId == null || googleClientId.isEmpty()) {
            logger.error("Google Client ID is not configured");
            throw new RuntimeException("Google Client ID is not configured");
        }

        logger.info("Using Google Client ID: {}", googleClientId);

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), 
                GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken idToken = verifier.verify(idTokenString);
        if (idToken != null) {
            GoogleIdToken.Payload payload = idToken.getPayload();
            logger.info("Google token verified successfully for email: {}", payload.getEmail());
            return payload;
        } else {
            logger.error("Invalid Google ID token");
            throw new RuntimeException("Invalid Google ID token");
        }
    }

    /**
     * Tìm hoặc tạo user từ Google profile
     */
    public User findOrCreateUser(GoogleIdToken.Payload payload) {
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String pictureUrl = (String) payload.get("picture");
        
        logger.info("Finding or creating user for email: {}", email);
        
        // Tìm user theo email
        Optional<User> existingUser = userRepository.findByEmail(email);        
        
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            logger.info("Found existing user: username={}, isActive={}, deletedAt={}", 
                       user.getUsername(), user.getIsActive(), user.getDeletedAt());
            
            // Kiểm tra user có bị xóa không
            if (user.getDeletedAt() != null) {
                logger.warn("User was soft deleted, reactivating: {}", user.getUsername());
                user.setDeletedAt(null);
                user.setIsActive(true);
            }
            
            // Kiểm tra user có active không
            if (!user.getIsActive()) {
                logger.warn("User was inactive, activating: {}", user.getUsername());
                user.setIsActive(true);
            }
            
            // Cập nhật thông tin từ Google nếu cần
            if (pictureUrl != null && !pictureUrl.isEmpty()) {
                user.setAvatarUrl(pictureUrl);
            }
            
            User savedUser = userRepository.save(user);
            logger.info("Updated existing user successfully: {}", savedUser.getUsername());
            return savedUser;
        }
        
        // Tạo user mới
        logger.info("Creating new user for email: {}", email);
        User newUser = new User();
        newUser.setEmail(email);
        newUser.setFullName(name != null ? name : email);
        
        // Tạo username từ email
        String username = email.split("@")[0];
        // Đảm bảo username là duy nhất
        String finalUsername = username;
        int counter = 1;
        while (userRepository.existsByUsername(finalUsername)) {
            finalUsername = username + counter;
            counter++;
        }
        logger.info("Generated username: {}", finalUsername);
        newUser.setUsername(finalUsername);
        
        // Mật khẩu ngẫu nhiên (user không cần biết vì đăng nhập qua Google)
        newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        
        // Set avatar từ Google
        if (pictureUrl != null && !pictureUrl.isEmpty()) {
            newUser.setAvatarUrl(pictureUrl);
        }
        
        // Set role mặc định
        newUser.setRole(UserRole.USER);
        newUser.setIsActive(true);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setUpdatedAt(LocalDateTime.now());
        
        User savedUser = userRepository.save(newUser);
        logger.info("Created new user successfully: {}", savedUser.getUsername());
        return savedUser;
    }
}

package com.travel.config;

import com.travel.entity.User;
import com.travel.enums.UserRole;
import com.travel.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Khởi tạo dữ liệu ban đầu
 */
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Tạo admin mặc định nếu chưa có
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@travelbooking.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFullName("Administrator");
            admin.setRole(UserRole.ADMIN);
            admin.setIsActive(true);
            admin.setIsEmailVerified(true);
            
            userRepository.save(admin);
            System.out.println("=== Đã tạo tài khoản admin mặc định ===");
            System.out.println("Username: admin");
            System.out.println("Password: admin123");
            System.out.println("========================================");
        }

        // Tạo user demo
        if (!userRepository.existsByUsername("demo")) {
            User demo = new User();
            demo.setUsername("demo");
            demo.setEmail("demo@travelbooking.com");
            demo.setPassword(passwordEncoder.encode("demo123"));
            demo.setFullName("Demo User");
            demo.setRole(UserRole.USER);
            demo.setIsActive(true);
            demo.setIsEmailVerified(true);
            
            userRepository.save(demo);
            System.out.println("=== Đã tạo tài khoản demo ===");
            System.out.println("Username: demo");
            System.out.println("Password: demo123");
            System.out.println("=============================");
        }
    }
}

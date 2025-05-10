package com.travel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Ứng dụng chính cho hệ thống đặt tour du lịch
 * * Ứng dụng này sử dụng Spring Boot để khởi tạo và cấu hình các thành phần cần thiết
 * * Bao gồm các thành phần như JPA Auditing để theo dõi thời gian tạo và cập nhật của các thực thể
 */
@SpringBootApplication
@EnableJpaAuditing
public class TravelBookingApplication {

    public static void main(String[] args) {
        SpringApplication.run(TravelBookingApplication.class, args);
        System.out.println("=== Ứng dụng đặt tour du lịch đã khởi động thành công! ===");
    }
}

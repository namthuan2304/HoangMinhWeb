package com.travel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Ứng dụng chính cho hệ thống đặt tour du lịch
 * 
 * @author HoangMinh
 */
@SpringBootApplication
@EnableJpaAuditing
public class TravelBookingApplication {

    public static void main(String[] args) {
        SpringApplication.run(TravelBookingApplication.class, args);
        System.out.println("=== Ứng dụng đặt tour du lịch đã khởi động thành công! ===");
    }
}

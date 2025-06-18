package com.travel.service.test;

import com.travel.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Class test cho EmailService bất đồng bộ
 * Chỉ dùng cho testing, không sử dụng trong production
 */
@Component
public class EmailServiceTester {

    @Autowired
    private EmailService emailService;

    /**
     * Test gửi email đơn giản
     */
    public void testSendSimpleEmail() {
        System.out.println("=== Bắt đầu test gửi email bất đồng bộ ===");
        
        // Gửi email test
        emailService.sendSimpleEmail(
            "test@example.com", 
            "Test Email Bất Đồng Bộ", 
            "Đây là email test gửi bất đồng bộ từ hệ thống du lịch!"
        );
        
        System.out.println("=== Lệnh gửi email đã được thực thi (bất đồng bộ) ===");
        System.out.println("Email sẽ được gửi trong background thread");
    }

    /**
     * Test gửi email thông báo
     */
    public void testSendNotificationEmail() {
        String htmlContent = """
            <html>
            <body>
                <h2>Test Email Thông Báo</h2>
                <p>Đây là email thông báo test từ hệ thống du lịch.</p>
                <p>Email được gửi bằng cách <strong>bất đồng bộ</strong>.</p>
                <p>Thời gian gửi: """ + java.time.LocalDateTime.now() + """
                </p>
            </body>
            </html>
            """;
        
        emailService.sendNotificationEmail(
            "notification@example.com",
            "Thông báo test từ hệ thống",
            htmlContent
        );
        
        System.out.println("=== Lệnh gửi email thông báo đã được thực thi (bất đồng bộ) ===");
    }
}

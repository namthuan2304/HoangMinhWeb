# Hệ Thống Gửi Email Bất Đồng Bộ

## Tổng quan

Hệ thống đã được cập nhật để hỗ trợ gửi email bất đồng bộ (asynchronous email sending). Điều này giúp:

- Cải thiện hiệu suất ứng dụng
- Tránh blocking các request khác khi gửi email
- Xử lý lỗi email tốt hơn
- Theo dõi trạng thái gửi email qua logging

## Cấu hình

### 1. Kích hoạt Async
```java
@SpringBootApplication
@EnableAsync
public class TravelBookingApplication {
    // ...
}
```

### 2. Cấu hình Thread Pool
```java
@Configuration
public class AsyncConfig implements AsyncConfigurer {
    @Override
    @Bean(name = "taskExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);        // Số thread tối thiểu
        executor.setMaxPoolSize(5);         // Số thread tối đa
        executor.setQueueCapacity(100);     // Capacity của queue
        executor.setThreadNamePrefix("Async-Email-");
        executor.initialize();
        return executor;
    }
}
```

## Sử dụng

### 1. Gửi Email Xác Thực
```java
@Autowired
private EmailService emailService;

// Gửi email xác thực (bất đồng bộ)
emailService.sendEmailVerification(
    "user@example.com", 
    "Nguyễn Văn A", 
    "verification-token"
);
```

### 2. Gửi Email Reset Mật Khẩu
```java
// Gửi email reset mật khẩu (bất đồng bộ)
emailService.sendPasswordReset(
    "user@example.com", 
    "Nguyễn Văn A", 
    "reset-token"
);
```

### 3. Gửi Email Booking
```java
// Gửi email xác nhận đặt tour (bất đồng bộ)
emailService.sendBookingConfirmationEmail(bookingTour);

// Gửi email xác nhận tour (bất đồng bộ)
emailService.sendBookingConfirmedEmail(bookingTour);

// Gửi email hủy tour (bất đồng bộ)
emailService.sendBookingCancelledEmail(bookingTour);
```

### 4. Gửi Email Thông Báo Chung
```java
String htmlContent = """
    <html>
    <body>
        <h2>Thông báo từ hệ thống</h2>
        <p>Nội dung thông báo...</p>
    </body>
    </html>
    """;

emailService.sendNotificationEmail(
    "user@example.com",
    "Tiêu đề thông báo",
    htmlContent
);
```

## Logging

Hệ thống sử dụng SLF4J để ghi log:

```
INFO  - Bắt đầu gửi email xác thực tài khoản cho: user@example.com
INFO  - Gửi email xác thực tài khoản thành công cho: user@example.com
ERROR - Lỗi gửi email xác thực tài khoản cho user@example.com: Connection refused
```

## Xử lý lỗi

- Tất cả các method gửi email đều có try-catch
- Lỗi được log với level ERROR
- Ứng dụng không bị crash khi gửi email thất bại
- Email được gửi trong background thread riêng biệt

## Performance

- **Trước**: Gửi email đồng bộ -> blocking 2-5 giây
- **Sau**: Gửi email bất đồng bộ -> không blocking, response ngay lập tức

## Monitoring

Có thể theo dõi email qua:
1. Application logs
2. Thread pool metrics
3. Email service provider logs (Gmail, SendGrid, etc.)

## Cấu hình Thread Pool

Có thể điều chỉnh trong `AsyncConfig.java`:

```java
executor.setCorePoolSize(2);        // Số thread tối thiểu
executor.setMaxPoolSize(5);         // Số thread tối đa  
executor.setQueueCapacity(100);     // Số email tối đa trong queue
```

## Lưu ý

1. **Không throw exception**: Methods async không nên throw exception ra ngoài
2. **Logging**: Sử dụng logging thay vì System.out
3. **Testing**: Sử dụng `EmailServiceTester` để test
4. **Production**: Cấu hình email server thật trong `application.properties`

## Test

Sử dụng `EmailServiceTester` để test:

```java
@Autowired
private EmailServiceTester emailTester;

// Test gửi email đơn giản
emailTester.testSendSimpleEmail();

// Test gửi email thông báo
emailTester.testSendNotificationEmail();
```

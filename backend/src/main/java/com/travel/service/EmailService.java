package com.travel.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Service gửi email với hỗ trợ bất đồng bộ
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;    /**
     * Gửi email xác thực tài khoản (bất đồng bộ)
     */
    @Async
    public void sendEmailVerification(String toEmail, String fullName, String token) {
        try {
            logger.info("Bắt đầu gửi email xác thực tài khoản cho: {}", toEmail);
            String subject = "Xác thực tài khoản - Website Du lịch";
            String verifyUrl = "http://localhost:8080/api/auth/verify-email?token=" + token;
            
            String content = String.format("""
                <html>
                <body>
                    <h2>Xin chào %s!</h2>
                    <p>Cảm ơn bạn đã đăng ký tài khoản tại Website Du lịch của chúng tôi.</p>
                    <p>Vui lòng nhấp vào liên kết bên dưới để xác thực tài khoản:</p>
                    <p><a href="%s" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Xác thực tài khoản</a></p>
                    <p>Hoặc copy và paste URL sau vào trình duyệt:</p>
                    <p>%s</p>
                    <p>Link này sẽ hết hạn sau 24 giờ.</p>
                    <p>Trân trọng,<br/>Đội ngũ Website Du lịch</p>
                </body>
                </html>
                """, fullName, verifyUrl, verifyUrl);

            sendHtmlEmail(toEmail, subject, content);
            logger.info("Gửi email xác thực tài khoản thành công cho: {}", toEmail);
        } catch (Exception e) {
            logger.error("Lỗi gửi email xác thực tài khoản cho {}: {}", toEmail, e.getMessage(), e);
        }
    }    /**
     * Gửi email reset mật khẩu (bất đồng bộ)
     */
    @Async
    public void sendPasswordReset(String toEmail, String fullName, String token) {
        try {
            logger.info("Bắt đầu gửi email reset mật khẩu cho: {}", toEmail);
            String subject = "Đặt lại mật khẩu - Website Du lịch";
            String resetUrl = "http://localhost:3000/reset-password?token=" + token;
            
            String content = String.format("""
                <html>
                <body>
                    <h2>Xin chào %s!</h2>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                    <p>Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu:</p>
                    <p><a href="%s" style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Đặt lại mật khẩu</a></p>
                    <p>Hoặc copy và paste URL sau vào trình duyệt:</p>
                    <p>%s</p>
                    <p>Link này sẽ hết hạn sau 1 giờ.</p>
                    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                    <p>Trân trọng,<br/>Đội ngũ Website Du lịch</p>
                </body>
                </html>
                """, fullName, resetUrl, resetUrl);

            sendHtmlEmail(toEmail, subject, content);
            logger.info("Gửi email reset mật khẩu thành công cho: {}", toEmail);
        } catch (Exception e) {
            logger.error("Lỗi gửi email reset mật khẩu cho {}: {}", toEmail, e.getMessage(), e);
        }
    }
    /**
     * Gửi email HTML
     */
    private void sendHtmlEmail(String toEmail, String subject, String content) throws MessagingException {
        logger.debug("Đang tạo và gửi email HTML tới: {}", toEmail);
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setFrom(fromEmail);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(content, true);
        
        mailSender.send(message);
        logger.debug("Email HTML đã được gửi thành công tới: {}", toEmail);
    }

    /**
     * Gửi email thông báo chung (bất đồng bộ)
     */
    @Async
    public void sendNotificationEmail(String toEmail, String subject, String content) {
        try {
            logger.info("Bắt đầu gửi email thông báo cho: {}", toEmail);
            sendHtmlEmail(toEmail, subject, content);
            logger.info("Gửi email thông báo thành công cho: {}", toEmail);
        } catch (Exception e) {
            logger.error("Lỗi gửi email thông báo cho {}: {}", toEmail, e.getMessage(), e);
        }
    }/**
     * Gửi email text đơn giản (bất đồng bộ)
     */
    @Async
    public void sendSimpleEmail(String toEmail, String subject, String content) {
        try {
            logger.info("Bắt đầu gửi email đơn giản cho: {}", toEmail);
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(content);
            
            mailSender.send(message);
            logger.info("Gửi email đơn giản thành công cho: {}", toEmail);        } catch (Exception e) {
            logger.error("Lỗi gửi email đơn giản cho {}: {}", toEmail, e.getMessage(), e);
        }
    }

    /**
     * Gửi email xác nhận đặt tour (bất đồng bộ)
     */    @Async
    public void sendBookingConfirmationEmail(com.travel.entity.BookingTour booking) {
        try {
            logger.info("Bắt đầu gửi email xác nhận đặt tour cho: {}", booking.getContactEmail());
            String subject = "Xác nhận đặt tour - " + booking.getTour().getName();
            
            String content = String.format("""
                <html>
                <body>
                    <h2>Xác nhận đặt tour thành công!</h2>
                    <p>Xin chào %s,</p>
                    <p>Chúng tôi đã nhận được đơn đặt tour của bạn với thông tin sau:</p>
                    
                    <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
                        <h3>Thông tin tour:</h3>
                        <p><strong>Tên tour:</strong> %s</p>
                        <p><strong>Điểm đến:</strong> %s</p>
                        <p><strong>Ngày khởi hành:</strong> %s</p>
                        <p><strong>Số người:</strong> %d</p>
                        <p><strong>Tổng tiền:</strong> %,.0f VNĐ</p>
                        <p><strong>Mã đơn hàng:</strong> %s</p>
                    </div>
                    
                    <p>Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận thông tin.</p>
                    <p>Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi!</p>
                    
                    <p>Trân trọng,<br/>Đội ngũ Website Du lịch</p>
                </body>
                </html>
                """, 
                booking.getContactName(),
                booking.getTour().getName(),
                booking.getTour().getDestination(),
                booking.getTour().getDepartureDate(),
                booking.getParticipantsCount(),
                booking.getTotalAmount(),
                booking.getInvoiceNumber()
            );

            sendHtmlEmail(booking.getContactEmail(), subject, content);
            logger.info("Gửi email xác nhận đặt tour thành công cho: {}", booking.getContactEmail());
        } catch (Exception e) {
            logger.error("Lỗi gửi email xác nhận đặt tour cho {}: {}", booking.getContactEmail(), e.getMessage(), e);
        }
    }/**
     * Gửi email khi booking được xác nhận (bất đồng bộ)
     */    @Async
    public void sendBookingConfirmedEmail(com.travel.entity.BookingTour booking) {
        try {
            logger.info("Bắt đầu gửi email xác nhận tour được phê duyệt cho: {}", booking.getContactEmail());
            String subject = "Tour đã được xác nhận - " + booking.getTour().getName();
            
            String content = String.format("""
                <html>
                <body>
                    <h2>Tour của bạn đã được xác nhận!</h2>
                    <p>Xin chào %s,</p>
                    <p>Tour <strong>%s</strong> của bạn đã được xác nhận.</p>
                    
                    <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
                        <h3>Thông tin tour:</h3>
                        <p><strong>Ngày khởi hành:</strong> %s</p>
                        <p><strong>Điểm tập trung:</strong> %s</p>
                        <p><strong>Số người:</strong> %d</p>
                        <p><strong>Mã đơn hàng:</strong> %s</p>
                    </div>
                    
                    <p>Vui lòng có mặt tại điểm tập trung đúng giờ.</p>
                    <p>Chúc bạn có chuyến đi vui vẻ!</p>
                    
                    <p>Trân trọng,<br/>Đội ngũ Website Du lịch</p>
                </body>
                </html>
                """, 
                booking.getContactName(),
                booking.getTour().getName(),
                booking.getTour().getDepartureDate(),
                booking.getTour().getDepartureLocation() != null ? booking.getTour().getDepartureLocation() : "Sẽ thông báo sau",
                booking.getParticipantsCount(),
                booking.getInvoiceNumber()
            );

            sendHtmlEmail(booking.getContactEmail(), subject, content);
            logger.info("Gửi email xác nhận tour được phê duyệt thành công cho: {}", booking.getContactEmail());
        } catch (Exception e) {
            logger.error("Lỗi gửi email xác nhận tour được phê duyệt cho {}: {}", booking.getContactEmail(), e.getMessage(), e);
        }
    }/**
     * Gửi email khi booking bị hủy (bất đồng bộ)
     */    @Async
    public void sendBookingCancelledEmail(com.travel.entity.BookingTour booking) {
        try {
            logger.info("Bắt đầu gửi email thông báo hủy tour cho: {}", booking.getContactEmail());
            String subject = "Thông báo hủy tour - " + booking.getTour().getName();
            
            String content = String.format("""
                <html>
                <body>
                    <h2>Thông báo hủy tour</h2>
                    <p>Xin chào %s,</p>
                    <p>Chúng tôi rất tiếc phải thông báo tour <strong>%s</strong> của bạn đã bị hủy.</p>
                    
                    <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
                        <p><strong>Mã đơn hàng:</strong> %s</p>
                        <p><strong>Lý do hủy:</strong> %s</p>
                        <p><strong>Số tiền:</strong> %,.0f VNĐ</p>
                    </div>
                    
                    <p>Chúng tôi sẽ hoàn trả số tiền trong vòng 5-7 ngày làm việc.</p>
                    <p>Rất mong được phục vụ bạn trong tương lai!</p>
                    
                    <p>Trân trọng,<br/>Đội ngũ Website Du lịch</p>
                </body>
                </html>
                """, 
                booking.getContactName(),
                booking.getTour().getName(),
                booking.getInvoiceNumber(),
                booking.getCancellationReason() != null ? booking.getCancellationReason() : "Không rõ lý do",
                booking.getTotalAmount()
            );

            sendHtmlEmail(booking.getContactEmail(), subject, content);
            logger.info("Gửi email thông báo hủy tour thành công cho: {}", booking.getContactEmail());
        } catch (Exception e) {
            logger.error("Lỗi gửi email thông báo hủy tour cho {}: {}", booking.getContactEmail(), e.getMessage(), e);
        }
    }
}

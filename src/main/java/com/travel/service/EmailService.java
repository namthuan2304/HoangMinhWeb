package com.travel.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Service gửi email
 */
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Gửi email xác thực tài khoản
     */
    public void sendEmailVerification(String toEmail, String fullName, String token) throws MessagingException {
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
    }

    /**
     * Gửi email reset mật khẩu
     */
    public void sendPasswordReset(String toEmail, String fullName, String token) throws MessagingException {
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
    }

    /**
     * Gửi email xác nhận đặt tour
     */
    public void sendBookingConfirmation(String toEmail, String fullName, String tourName, 
                                      String bookingCode, String tourDate) throws MessagingException {
        String subject = "Xác nhận đặt tour - " + tourName;
        
        String content = String.format("""
            <html>
            <body>
                <h2>Xin chào %s!</h2>
                <p>Cảm ơn bạn đã đặt tour tại Website Du lịch của chúng tôi.</p>
                <h3>Thông tin đặt tour:</h3>
                <ul>
                    <li><strong>Mã đặt tour:</strong> %s</li>
                    <li><strong>Tên tour:</strong> %s</li>
                    <li><strong>Ngày khởi hành:</strong> %s</li>
                </ul>
                <p>Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận chi tiết.</p>
                <p>Trân trọng,<br/>Đội ngũ Website Du lịch</p>
            </body>
            </html>
            """, fullName, bookingCode, tourName, tourDate);

        sendHtmlEmail(toEmail, subject, content);
    }

    /**
     * Gửi email HTML
     */
    private void sendHtmlEmail(String toEmail, String subject, String content) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setFrom(fromEmail);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(content, true);
        
        mailSender.send(message);
    }

    /**
     * Gửi email text đơn giản
     */
    public void sendSimpleEmail(String toEmail, String subject, String content) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(content);
        
        mailSender.send(message);
    }
}

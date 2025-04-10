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

    /**
     * Gửi email xác nhận đặt tour
     */
    public void sendBookingConfirmationEmail(com.travel.entity.BookingTour booking) {
        try {
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
        } catch (Exception e) {
            System.err.println("Lỗi gửi email xác nhận đặt tour: " + e.getMessage());
        }
    }

    /**
     * Gửi email khi booking được xác nhận
     */
    public void sendBookingConfirmedEmail(com.travel.entity.BookingTour booking) {
        try {
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
        } catch (Exception e) {
            System.err.println("Lỗi gửi email xác nhận tour: " + e.getMessage());
        }
    }

    /**
     * Gửi email khi booking bị hủy
     */
    public void sendBookingCancelledEmail(com.travel.entity.BookingTour booking) {
        try {
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
        } catch (Exception e) {
            System.err.println("Lỗi gửi email hủy tour: " + e.getMessage());
        }
    }
}

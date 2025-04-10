package com.travel.service;

import com.travel.entity.BookingTour;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Service xuất PDF hóa đơn
 */
@Service
public class PdfService {

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.of("vi", "VN"));
    private final DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.of("vi", "VN"));

    /**
     * Tạo PDF hóa đơn đặt tour
     */
    public byte[] generateInvoicePdf(BookingTour booking) {
        try {
            // Sử dụng StringBuilder để tạo HTML content
            StringBuilder htmlContent = new StringBuilder();
            
            htmlContent.append("<!DOCTYPE html>");
            htmlContent.append("<html lang='vi'>");
            htmlContent.append("<head>");
            htmlContent.append("<meta charset='UTF-8'>");
            htmlContent.append("<title>Hóa đơn đặt tour</title>");
            htmlContent.append("<style>");
            htmlContent.append("body { font-family: 'Arial', sans-serif; margin: 20px; color: #333; }");
            htmlContent.append(".header { text-align: center; margin-bottom: 30px; }");
            htmlContent.append(".company-name { font-size: 24px; font-weight: bold; color: #2c3e50; }");
            htmlContent.append(".invoice-title { font-size: 18px; margin-top: 10px; color: #e74c3c; }");
            htmlContent.append(".invoice-info { margin: 20px 0; }");
            htmlContent.append(".section { margin: 20px 0; }");
            htmlContent.append(".section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #2c3e50; }");
            htmlContent.append("table { width: 100%; border-collapse: collapse; margin: 10px 0; }");
            htmlContent.append("th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }");
            htmlContent.append("th { background-color: #f8f9fa; font-weight: bold; }");
            htmlContent.append(".total { font-size: 18px; font-weight: bold; color: #e74c3c; }");
            htmlContent.append(".footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }");
            htmlContent.append("</style>");
            htmlContent.append("</head>");
            htmlContent.append("<body>");

            // Header
            htmlContent.append("<div class='header'>");
            htmlContent.append("<div class='company-name'>CÔNG TY DU LỊCH TRAVEL BOOKING</div>");
            htmlContent.append("<div>Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM</div>");
            htmlContent.append("<div>Điện thoại: 0123-456-789 | Email: info@travelbooking.com</div>");
            htmlContent.append("<div class='invoice-title'>HÓA ĐƠN ĐẶT TOUR</div>");
            htmlContent.append("</div>");

            // Invoice Info
            htmlContent.append("<div class='invoice-info'>");
            htmlContent.append("<table>");
            htmlContent.append("<tr><td><strong>Số hóa đơn:</strong></td><td>").append(booking.getInvoiceNumber()).append("</td></tr>");
            htmlContent.append("<tr><td><strong>Ngày đặt:</strong></td><td>").append(booking.getBookingDate().format(dateTimeFormatter)).append("</td></tr>");
            htmlContent.append("<tr><td><strong>Trạng thái:</strong></td><td>").append(getStatusText(booking.getStatus().getDescription())).append("</td></tr>");
            htmlContent.append("</table>");
            htmlContent.append("</div>");

            // Customer Info
            htmlContent.append("<div class='section'>");
            htmlContent.append("<div class='section-title'>THÔNG TIN KHÁCH HÀNG</div>");
            htmlContent.append("<table>");
            htmlContent.append("<tr><td><strong>Họ tên:</strong></td><td>").append(booking.getContactName()).append("</td></tr>");
            htmlContent.append("<tr><td><strong>Email:</strong></td><td>").append(booking.getContactEmail()).append("</td></tr>");
            htmlContent.append("<tr><td><strong>Số điện thoại:</strong></td><td>").append(booking.getContactPhone()).append("</td></tr>");
            htmlContent.append("</table>");
            htmlContent.append("</div>");

            // Tour Info
            htmlContent.append("<div class='section'>");
            htmlContent.append("<div class='section-title'>THÔNG TIN TOUR</div>");
            htmlContent.append("<table>");
            htmlContent.append("<tr><td><strong>Tên tour:</strong></td><td>").append(booking.getTour().getName()).append("</td></tr>");
            htmlContent.append("<tr><td><strong>Điểm đến:</strong></td><td>").append(booking.getTour().getDestination()).append("</td></tr>");
            htmlContent.append("<tr><td><strong>Ngày khởi hành:</strong></td><td>").append(booking.getTour().getDepartureDate().format(dateFormatter)).append("</td></tr>");
            if (booking.getTour().getReturnDate() != null) {
                htmlContent.append("<tr><td><strong>Ngày về:</strong></td><td>").append(booking.getTour().getReturnDate().format(dateFormatter)).append("</td></tr>");
            }
            htmlContent.append("<tr><td><strong>Số ngày:</strong></td><td>").append(booking.getTour().getDurationDays()).append(" ngày</td></tr>");
            htmlContent.append("</table>");
            htmlContent.append("</div>");

            // Booking Details
            htmlContent.append("<div class='section'>");
            htmlContent.append("<div class='section-title'>CHI TIẾT ĐẶT TOUR</div>");
            htmlContent.append("<table>");
            htmlContent.append("<tr><th>Mô tả</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr>");
            htmlContent.append("<tr>");
            htmlContent.append("<td>").append(booking.getTour().getName()).append("</td>");
            htmlContent.append("<td>").append(booking.getParticipantsCount()).append(" người</td>");
            htmlContent.append("<td>").append(String.format("%,.0f VNĐ", booking.getTour().getPrice())).append("</td>");
            htmlContent.append("<td>").append(String.format("%,.0f VNĐ", booking.getTotalAmount())).append("</td>");
            htmlContent.append("</tr>");
            htmlContent.append("<tr><td colspan='3' class='total'>TỔNG CỘNG:</td><td class='total'>")
                    .append(String.format("%,.0f VNĐ", booking.getTotalAmount())).append("</td></tr>");
            htmlContent.append("</table>");
            htmlContent.append("</div>");

            // Special Requests
            if (booking.getSpecialRequests() != null && !booking.getSpecialRequests().trim().isEmpty()) {
                htmlContent.append("<div class='section'>");
                htmlContent.append("<div class='section-title'>YÊU CẦU ĐẶC BIỆT</div>");
                htmlContent.append("<p>").append(booking.getSpecialRequests()).append("</p>");
                htmlContent.append("</div>");
            }

            // Footer
            htmlContent.append("<div class='footer'>");
            htmlContent.append("<p>Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</p>");
            htmlContent.append("<p>Mọi thắc mắc xin liên hệ: 0123-456-789 hoặc info@travelbooking.com</p>");
            htmlContent.append("</div>");

            htmlContent.append("</body>");
            htmlContent.append("</html>");

            // Trong thực tế, bạn có thể sử dụng thư viện như iText hoặc Flying Saucer
            // để chuyển HTML thành PDF. Ở đây chỉ là demo trả về HTML dưới dạng bytes
            return htmlContent.toString().getBytes("UTF-8");

        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi tạo PDF hóa đơn: " + e.getMessage(), e);
        }
    }

    /**
     * Lấy text trạng thái
     */
    private String getStatusText(String status) {
        return switch (status) {
            case "PENDING" -> "Chờ xác nhận";
            case "CONFIRMED" -> "Đã xác nhận";
            case "CANCELLED" -> "Đã hủy";
            case "COMPLETED" -> "Đã hoàn thành";
            default -> status;
        };
    }

    /**
     * Tạo PDF báo cáo doanh thu
     */
    public byte[] generateRevenueReportPdf(String title, String period, String totalRevenue, String details) {
        try {
            StringBuilder htmlContent = new StringBuilder();
            
            htmlContent.append("<!DOCTYPE html>");
            htmlContent.append("<html lang='vi'>");
            htmlContent.append("<head>");
            htmlContent.append("<meta charset='UTF-8'>");
            htmlContent.append("<title>").append(title).append("</title>");
            htmlContent.append("<style>");
            htmlContent.append("body { font-family: 'Arial', sans-serif; margin: 20px; color: #333; }");
            htmlContent.append(".header { text-align: center; margin-bottom: 30px; }");
            htmlContent.append(".company-name { font-size: 24px; font-weight: bold; color: #2c3e50; }");
            htmlContent.append(".report-title { font-size: 18px; margin-top: 10px; color: #e74c3c; }");
            htmlContent.append(".summary { background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; }");
            htmlContent.append(".total-revenue { font-size: 24px; font-weight: bold; color: #27ae60; text-align: center; }");
            htmlContent.append("</style>");
            htmlContent.append("</head>");
            htmlContent.append("<body>");

            // Header
            htmlContent.append("<div class='header'>");
            htmlContent.append("<div class='company-name'>CÔNG TY DU LỊCH TRAVEL BOOKING</div>");
            htmlContent.append("<div class='report-title'>").append(title).append("</div>");
            htmlContent.append("<div>Thời gian: ").append(period).append("</div>");
            htmlContent.append("</div>");

            // Summary
            htmlContent.append("<div class='summary'>");
            htmlContent.append("<div class='total-revenue'>TỔNG DOANH THU: ").append(totalRevenue).append("</div>");
            htmlContent.append("</div>");

            // Details
            if (details != null && !details.trim().isEmpty()) {
                htmlContent.append("<div class='details'>");
                htmlContent.append(details);
                htmlContent.append("</div>");
            }

            htmlContent.append("</body>");
            htmlContent.append("</html>");

            return htmlContent.toString().getBytes("UTF-8");

        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi tạo PDF báo cáo: " + e.getMessage(), e);
        }
    }
}

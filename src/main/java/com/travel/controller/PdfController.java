package com.travel.controller;

import com.travel.entity.BookingTour;
import com.travel.exception.ResourceNotFoundException;
import com.travel.repository.BookingTourRepository;
import com.travel.service.PdfService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý xuất PDF
 */
@RestController
@RequestMapping("/api/pdf")
@Tag(name = "PDF Export", description = "APIs xuất PDF")
@SecurityRequirement(name = "bearerAuth")
public class PdfController {

    @Autowired
    private BookingTourRepository bookingTourRepository;

    @Autowired
    private PdfService pdfService;

    /**
     * Xuất hóa đơn PDF
     */
    @GetMapping("/invoice/{bookingId}")
    @Operation(summary = "Xuất hóa đơn PDF cho booking")
    public ResponseEntity<byte[]> exportInvoicePdf(
            @PathVariable Long bookingId,
            Authentication authentication) {
        
        BookingTour booking = bookingTourRepository.findByIdAndDeletedAtIsNull(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt tour"));

        // Kiểm tra quyền truy cập (chỉ người đặt hoặc admin)
        String username = authentication.getName();
        if (!booking.getUser().getUsername().equals(username) && 
            !booking.getUser().isAdmin()) {
            throw new IllegalArgumentException("Bạn không có quyền truy cập hóa đơn này");
        }

        byte[] pdfBytes = pdfService.generateInvoicePdf(booking);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", 
            "hoa-don-" + booking.getInvoiceNumber() + ".pdf");

        return ResponseEntity.ok()
            .headers(headers)
            .body(pdfBytes);
    }

    /**
     * Xuất hóa đơn PDF (Admin có thể xuất bất kỳ hóa đơn nào)
     */
    @GetMapping("/admin/invoice/{bookingId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Xuất hóa đơn PDF (Admin)")
    public ResponseEntity<byte[]> exportInvoicePdfAdmin(@PathVariable Long bookingId) {
        
        BookingTour booking = bookingTourRepository.findByIdAndDeletedAtIsNull(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt tour"));

        byte[] pdfBytes = pdfService.generateInvoicePdf(booking);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", 
            "hoa-don-" + booking.getInvoiceNumber() + ".pdf");

        return ResponseEntity.ok()
            .headers(headers)
            .body(pdfBytes);
    }
}

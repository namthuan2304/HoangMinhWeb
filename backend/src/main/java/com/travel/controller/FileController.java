package com.travel.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Controller xử lý việc serve static files
 */
@RestController
@RequestMapping("/api/files")
@Tag(name = "File Management", description = "APIs quản lý file")
public class FileController {    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * Lấy đường dẫn upload thực tế
     */
    private String getActualUploadDir() {
        String currentDir = System.getProperty("user.dir");
        
        // Kiểm tra nếu đang chạy từ thư mục backend
        if (currentDir.endsWith("backend")) {
            return currentDir + "/" + uploadDir;
        } else {
            // Nếu chạy từ root project hoặc thư mục khác
            return currentDir + "/backend/" + uploadDir;
        }
    }

    /**
     * Serve uploaded files
     */
    @GetMapping("/{subDir}/{filename:.+}")
    @Operation(summary = "Lấy file đã upload")
    public ResponseEntity<Resource> getFile(
            @PathVariable String subDir,
            @PathVariable String filename) {
        try {
            String actualUploadDir = getActualUploadDir();
            Path filePath = Paths.get(actualUploadDir, subDir, filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                // Xác định content type
                String contentType = determineContentType(filename);
                
                return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Xác định content type từ extension
     */
    private String determineContentType(String filename) {
        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        
        return switch (extension) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "webp" -> "image/webp";
            case "pdf" -> "application/pdf";
            case "txt" -> "text/plain";
            case "html" -> "text/html";
            case "css" -> "text/css";
            case "js" -> "application/javascript";
            default -> "application/octet-stream";
        };
    }
}

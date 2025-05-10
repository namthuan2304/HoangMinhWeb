package com.travel.service;

import com.travel.exception.FileUploadException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Service xử lý upload file
 */
@Service
public class FileUploadService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private final List<String> allowedImageTypes = Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );

    private final long maxFileSize = 10 * 1024 * 1024; // 10MB

    /**
     * Upload file
     */
    public String uploadFile(MultipartFile file, String subDir) {
        if (file.isEmpty()) {
            throw new FileUploadException("File không được để trống");
        }

        // Kiểm tra kích thước file
        if (file.getSize() > maxFileSize) {
            throw new FileUploadException("File quá lớn. Kích thước tối đa là 10MB");
        }

        // Kiểm tra loại file
        String contentType = file.getContentType();
        if (contentType == null || !allowedImageTypes.contains(contentType.toLowerCase())) {
            throw new FileUploadException("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)");
        }

        try {
            // Tạo thư mục nếu chưa tồn tại
            Path uploadPath = Paths.get(uploadDir, subDir);
            Files.createDirectories(uploadPath);

            // Tạo tên file unique
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
            String fileName = UUID.randomUUID().toString() + fileExtension;

            // Lưu file
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Trả về URL tương đối
            return subDir + "/" + fileName;

        } catch (IOException e) {
            throw new FileUploadException("Không thể lưu file: " + e.getMessage());
        }
    }

    /**
     * Upload nhiều file
     */
    public List<String> uploadMultipleFiles(MultipartFile[] files, String subDir) {
        return Arrays.stream(files)
            .map(file -> uploadFile(file, subDir))
            .toList();
    }

    /**
     * Xóa file
     */
    public void deleteFile(String filePath) {
        try {
            Path path = Paths.get(uploadDir, filePath);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            // Log error nhưng không throw exception
            System.err.println("Không thể xóa file: " + filePath + ", Error: " + e.getMessage());
        }
    }

    /**
     * Kiểm tra file có tồn tại không
     */
    public boolean fileExists(String filePath) {
        Path path = Paths.get(uploadDir, filePath);
        return Files.exists(path);
    }
}

package com.travel.controller;

import com.travel.dto.request.ArticleRequest;
import com.travel.dto.response.ArticleResponse;
import com.travel.dto.response.MessageResponse;
import com.travel.service.ArticleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Controller xử lý các API liên quan đến Article
 */
@RestController
@RequestMapping("/api/articles")
@Tag(name = "Article Management", description = "APIs quản lý bài viết")
public class ArticleController {

    @Autowired
    private ArticleService articleService;

    /**
     * Tạo bài viết mới (Admin/Author)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Tạo bài viết mới")
    public ResponseEntity<ArticleResponse> createArticle(
            Authentication authentication,
            @Valid @RequestBody ArticleRequest request) {
        ArticleResponse article = articleService.createArticle(authentication.getName(), request);
        return ResponseEntity.ok(article);
    }

    /**
     * Lấy danh sách tất cả bài viết (Admin)
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lấy danh sách tất cả bài viết (Admin)")
    public ResponseEntity<Page<ArticleResponse>> getAllArticles(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) Boolean published,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ArticleResponse> articles = articleService.getAllArticles(keyword, published, pageable);
        
        return ResponseEntity.ok(articles);
    }

    /**
     * Lấy danh sách bài viết đã xuất bản (Public)
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách bài viết đã xuất bản")
    public ResponseEntity<Page<ArticleResponse>> getPublishedArticles(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ArticleResponse> articles = articleService.getPublishedArticles(keyword, pageable);
        
        return ResponseEntity.ok(articles);
    }

    /**
     * Lấy chi tiết bài viết theo ID (Admin)
     */
    @GetMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lấy chi tiết bài viết theo ID (Admin)")
    public ResponseEntity<ArticleResponse> getArticleById(@PathVariable Long id) {
        ArticleResponse article = articleService.getArticleById(id);
        return ResponseEntity.ok(article);
    }

    /**
     * Lấy chi tiết bài viết theo slug (Public)
     */
    @GetMapping("/{slug}")
    @Operation(summary = "Lấy chi tiết bài viết theo slug")
    public ResponseEntity<ArticleResponse> getArticleBySlug(@PathVariable String slug) {
        ArticleResponse article = articleService.getArticleBySlug(slug);
        return ResponseEntity.ok(article);
    }

    /**
     * Cập nhật bài viết
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cập nhật bài viết")
    public ResponseEntity<ArticleResponse> updateArticle(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody ArticleRequest request) {
        ArticleResponse updatedArticle = articleService.updateArticle(id, authentication.getName(), request);
        return ResponseEntity.ok(updatedArticle);
    }

    /**
     * Xóa bài viết
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Xóa bài viết")
    public ResponseEntity<MessageResponse> deleteArticle(
            @PathVariable Long id,
            Authentication authentication) {
        articleService.deleteArticle(id, authentication.getName());
        return ResponseEntity.ok(new MessageResponse("Xóa bài viết thành công"));
    }

    /**
     * Xuất bản bài viết
     */
    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Xuất bản bài viết")
    public ResponseEntity<ArticleResponse> publishArticle(@PathVariable Long id) {
        ArticleResponse publishedArticle = articleService.publishArticle(id);
        return ResponseEntity.ok(publishedArticle);
    }

    /**
     * Gỡ xuất bản bài viết
     */
    @PostMapping("/{id}/unpublish")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Gỡ xuất bản bài viết")
    public ResponseEntity<ArticleResponse> unpublishArticle(@PathVariable Long id) {
        ArticleResponse unpublishedArticle = articleService.unpublishArticle(id);
        return ResponseEntity.ok(unpublishedArticle);
    }

    /**
     * Upload ảnh đại diện cho bài viết
     */
    @PostMapping("/{id}/upload-featured-image")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Upload ảnh đại diện cho bài viết")
    public ResponseEntity<ArticleResponse> uploadFeaturedImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        ArticleResponse updatedArticle = articleService.uploadFeaturedImage(id, file);
        return ResponseEntity.ok(updatedArticle);
    }

    /**
     * Lấy bài viết liên quan đến tour
     */
    @GetMapping("/tour/{tourId}")
    @Operation(summary = "Lấy bài viết liên quan đến tour")
    public ResponseEntity<List<ArticleResponse>> getArticlesByTour(@PathVariable Long tourId) {
        List<ArticleResponse> articles = articleService.getArticlesByTour(tourId);
        return ResponseEntity.ok(articles);
    }

    /**
     * Lấy bài viết theo tác giả
     */
    @GetMapping("/author/{authorId}")
    @Operation(summary = "Lấy bài viết theo tác giả")
    public ResponseEntity<Page<ArticleResponse>> getArticlesByAuthor(
            @PathVariable Long authorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ArticleResponse> articles = articleService.getArticlesByAuthor(authorId, pageable);
        
        return ResponseEntity.ok(articles);
    }

    /**
     * Lấy bài viết theo tag
     */
    @GetMapping("/tag/{tag}")
    @Operation(summary = "Lấy bài viết theo tag")
    public ResponseEntity<Page<ArticleResponse>> getArticlesByTag(
            @PathVariable String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ArticleResponse> articles = articleService.getArticlesByTag(tag, pageable);
        
        return ResponseEntity.ok(articles);
    }

    /**
     * Lấy bài viết phổ biến
     */
    @GetMapping("/popular")
    @Operation(summary = "Lấy bài viết phổ biến")
    public ResponseEntity<List<ArticleResponse>> getPopularArticles(
            @RequestParam(defaultValue = "5") int limit) {
        List<ArticleResponse> articles = articleService.getPopularArticles(limit);
        return ResponseEntity.ok(articles);
    }

    /**
     * Lấy bài viết mới nhất
     */
    @GetMapping("/latest")
    @Operation(summary = "Lấy bài viết mới nhất")
    public ResponseEntity<List<ArticleResponse>> getLatestArticles(
            @RequestParam(defaultValue = "5") int limit) {
        List<ArticleResponse> articles = articleService.getLatestArticles(limit);
        return ResponseEntity.ok(articles);
    }

    /**
     * Lấy bài viết của tôi (Admin/Author)
     */
    @GetMapping("/my-articles")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lấy bài viết của tôi")
    public ResponseEntity<Page<ArticleResponse>> getMyArticles(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ArticleResponse> articles = articleService.getMyArticles(authentication.getName(), pageable);
        
        return ResponseEntity.ok(articles);
    }
}

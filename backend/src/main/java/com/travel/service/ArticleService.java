package com.travel.service;

import com.travel.dto.request.ArticleRequest;
import com.travel.dto.response.ArticleResponse;
import com.travel.entity.Article;
import com.travel.entity.Tour;
import com.travel.entity.User;
import com.travel.exception.ResourceNotFoundException;
import com.travel.repository.ArticleRepository;
import com.travel.repository.TourRepository;
import com.travel.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service xử lý logic nghiệp vụ cho Article
 */
@Service
@Transactional
public class ArticleService {

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private FileUploadService fileUploadService;

    /**
     * Tạo bài viết mới
     */
    public ArticleResponse createArticle(String username, ArticleRequest request) {
        User author = userRepository.findByUsernameAndDeletedAtIsNull(username)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        Article article = new Article();
        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setSummary(request.getSummary());
        article.setAuthor(author);
        article.setTags(request.getTags());
        article.setMetaTitle(request.getMetaTitle());
        article.setMetaDescription(request.getMetaDescription());
        article.setMetaKeywords(request.getMetaKeywords());

        // Xử lý tours liên quan
        if (request.getRelatedTourIds() != null && !request.getRelatedTourIds().isEmpty()) {
            List<Tour> relatedTours = tourRepository.findByIdInAndDeletedAtIsNull(request.getRelatedTourIds());
            article.setRelatedTours(relatedTours);
        }

        Article savedArticle = articleRepository.save(article);
        return modelMapper.map(savedArticle, ArticleResponse.class);
    }

    /**
     * Lấy danh sách bài viết có phân trang và tìm kiếm
     */
    public Page<ArticleResponse> getAllArticles(String keyword, Boolean published, Pageable pageable) {
        Page<Article> articles;

        if (keyword != null && !keyword.trim().isEmpty() && published != null) {
            articles = articleRepository.findByTitleContainingIgnoreCaseAndIsPublishedAndDeletedAtIsNull(
                keyword, published, pageable);
        } else if (keyword != null && !keyword.trim().isEmpty()) {
            articles = articleRepository.findByTitleContainingIgnoreCaseAndDeletedAtIsNull(keyword, pageable);
        } else if (published != null) {
            articles = articleRepository.findByIsPublishedAndDeletedAtIsNull(published, pageable);
        } else {
            articles = articleRepository.findByDeletedAtIsNull(pageable);
        }

        return articles.map(article -> modelMapper.map(article, ArticleResponse.class));
    }

    /**
     * Lấy danh sách bài viết đã xuất bản (Public)
     */
    public Page<ArticleResponse> getPublishedArticles(String keyword, Pageable pageable) {
        Page<Article> articles;

        if (keyword != null && !keyword.trim().isEmpty()) {
            articles = articleRepository.findByTitleContainingIgnoreCaseAndIsPublishedTrueAndDeletedAtIsNull(
                keyword, pageable);
        } else {
            articles = articleRepository.findByIsPublishedTrueAndDeletedAtIsNull(pageable);
        }

        return articles.map(article -> {
            ArticleResponse response = modelMapper.map(article, ArticleResponse.class);
            // Không trả về toàn bộ content cho danh sách
            response.setContent(null);
            return response;
        });
    }

    /**
     * Lấy chi tiết bài viết theo ID
     */
    public ArticleResponse getArticleById(Long id) {
        Article article = articleRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với ID: " + id));

        // Tăng view count
        article.incrementViewCount();
        articleRepository.save(article);

        return modelMapper.map(article, ArticleResponse.class);
    }

    /**
     * Lấy chi tiết bài viết theo slug (Public)
     */
    public ArticleResponse getArticleBySlug(String slug) {
        Article article = articleRepository.findBySlugAndIsPublishedTrueAndDeletedAtIsNull(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết"));

        // Tăng view count
        article.incrementViewCount();
        articleRepository.save(article);

        return modelMapper.map(article, ArticleResponse.class);
    }

    /**
     * Cập nhật bài viết
     */
    public ArticleResponse updateArticle(Long id, String username, ArticleRequest request) {
        Article article = articleRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với ID: " + id));

        User user = userRepository.findByUsernameAndDeletedAtIsNull(username)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        // Kiểm tra quyền sửa (chỉ tác giả hoặc admin)
        if (!article.getAuthor().getId().equals(user.getId()) && !user.isAdmin()) {
            throw new IllegalArgumentException("Bạn không có quyền sửa bài viết này");
        }

        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setSummary(request.getSummary());
        article.setTags(request.getTags());
        article.setMetaTitle(request.getMetaTitle());
        article.setMetaDescription(request.getMetaDescription());
        article.setMetaKeywords(request.getMetaKeywords());

        // Cập nhật slug nếu title thay đổi
        if (request.getTitle() != null) {
            article.setTitle(request.getTitle());
        }

        // Xử lý tours liên quan
        if (request.getRelatedTourIds() != null) {
            if (request.getRelatedTourIds().isEmpty()) {
                article.getRelatedTours().clear();
            } else {
                List<Tour> relatedTours = tourRepository.findByIdInAndDeletedAtIsNull(request.getRelatedTourIds());
                article.setRelatedTours(relatedTours);
            }
        }

        Article savedArticle = articleRepository.save(article);
        return modelMapper.map(savedArticle, ArticleResponse.class);
    }

    /**
     * Xóa bài viết (soft delete)
     */
    public void deleteArticle(Long id, String username) {
        Article article = articleRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với ID: " + id));

        User user = userRepository.findByUsernameAndDeletedAtIsNull(username)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        // Kiểm tra quyền xóa (chỉ tác giả hoặc admin)
        if (!article.getAuthor().getId().equals(user.getId()) && !user.isAdmin()) {
            throw new IllegalArgumentException("Bạn không có quyền xóa bài viết này");
        }

        article.markAsDeleted();
        articleRepository.save(article);
    }

    /**
     * Xuất bản bài viết
     */
    public ArticleResponse publishArticle(Long id) {
        Article article = articleRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với ID: " + id));

        article.publish();
        Article savedArticle = articleRepository.save(article);
        return modelMapper.map(savedArticle, ArticleResponse.class);
    }

    /**
     * Gỡ xuất bản bài viết
     */
    public ArticleResponse unpublishArticle(Long id) {
        Article article = articleRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với ID: " + id));

        article.unpublish();
        Article savedArticle = articleRepository.save(article);
        return modelMapper.map(savedArticle, ArticleResponse.class);
    }

    /**
     * Upload ảnh đại diện cho bài viết
     */
    public ArticleResponse uploadFeaturedImage(Long id, MultipartFile file) {
        Article article = articleRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với ID: " + id));

        String imageUrl = fileUploadService.uploadFile(file, "articles");
        article.setFeaturedImageUrl(imageUrl);

        Article savedArticle = articleRepository.save(article);
        return modelMapper.map(savedArticle, ArticleResponse.class);
    }

    /**
     * Lấy bài viết liên quan đến tour
     */
    public List<ArticleResponse> getArticlesByTour(Long tourId) {
        Tour tour = tourRepository.findByIdAndDeletedAtIsNull(tourId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tour với ID: " + tourId));

        List<Article> articles = articleRepository.findByRelatedToursContainingAndIsPublishedTrueAndDeletedAtIsNull(tour);
        return articles.stream()
            .map(article -> {
                ArticleResponse response = modelMapper.map(article, ArticleResponse.class);
                // Không trả về toàn bộ content
                response.setContent(null);
                return response;
            })
            .collect(Collectors.toList());
    }

    /**
     * Lấy bài viết theo tác giả
     */
    public Page<ArticleResponse> getArticlesByAuthor(Long authorId, Pageable pageable) {
        User author = userRepository.findByIdAndDeletedAtIsNull(authorId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác giả với ID: " + authorId));

        Page<Article> articles = articleRepository.findByAuthorAndDeletedAtIsNull(author, pageable);
        return articles.map(article -> modelMapper.map(article, ArticleResponse.class));
    }

    /**
     * Lấy bài viết theo tag
     */
    public Page<ArticleResponse> getArticlesByTag(String tag, Pageable pageable) {
        Page<Article> articles = articleRepository.findByTagsContainingAndIsPublishedTrueAndDeletedAtIsNull(tag, pageable);
        return articles.map(article -> {
            ArticleResponse response = modelMapper.map(article, ArticleResponse.class);
            // Không trả về toàn bộ content
            response.setContent(null);
            return response;
        });
    }    /**
     * Lấy bài viết phổ biến (view nhiều nhất)
     */
    public List<ArticleResponse> getPopularArticles(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<Article> articles = articleRepository.findTopByIsPublishedTrueAndDeletedAtIsNullOrderByViewCountDesc(pageable);
        return articles.stream()
            .map(article -> {
                ArticleResponse response = modelMapper.map(article, ArticleResponse.class);
                // Không trả về toàn bộ content
                response.setContent(null);
                return response;
            })
            .collect(Collectors.toList());
    }

    /**
     * Lấy bài viết mới nhất
     */
    public List<ArticleResponse> getLatestArticles(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<Article> articles = articleRepository.findTopByIsPublishedTrueAndDeletedAtIsNullOrderByCreatedAtDesc(pageable);
        return articles.stream()
            .map(article -> {
                ArticleResponse response = modelMapper.map(article, ArticleResponse.class);
                // Không trả về toàn bộ content
                response.setContent(null);
                return response;
            })
            .collect(Collectors.toList());
    }

    /**
     * Lấy tổng số bài viết
     */
    public long getTotalArticles() {
        return articleRepository.countByDeletedAtIsNull();
    }

    /**
     * Lấy số bài viết đã xuất bản
     */
    public long getPublishedArticlesCount() {
        return articleRepository.countByIsPublishedTrueAndDeletedAtIsNull();
    }

    /**
     * Lấy bài viết của tác giả
     */
    public Page<ArticleResponse> getMyArticles(String username, Pageable pageable) {
        User author = userRepository.findByUsernameAndDeletedAtIsNull(username)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        Page<Article> articles = articleRepository.findByAuthorAndDeletedAtIsNull(author, pageable);
        return articles.map(article -> modelMapper.map(article, ArticleResponse.class));
    }
}

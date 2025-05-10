package com.travel.repository;

import com.travel.entity.Article;
import com.travel.entity.Tour;
import com.travel.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho entity Article
 */
@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {

    /**
     * Tìm article đã xuất bản
     */
    @Query("SELECT a FROM Article a WHERE a.deletedAt IS NULL AND a.isPublished = true ORDER BY a.createdAt DESC")
    List<Article> findPublishedArticles();

    /**
     * Tìm article đã xuất bản có phân trang
     */
    @Query("SELECT a FROM Article a WHERE a.deletedAt IS NULL AND a.isPublished = true ORDER BY a.createdAt DESC")
    Page<Article> findPublishedArticles(Pageable pageable);

    /**
     * Tìm article theo tác giả
     */
    @Query("SELECT a FROM Article a WHERE a.deletedAt IS NULL AND a.author = :author ORDER BY a.createdAt DESC")
    List<Article> findByAuthor(@Param("author") User author);

    /**
     * Tìm article theo slug
     */
    @Query("SELECT a FROM Article a WHERE a.deletedAt IS NULL AND a.slug = :slug")
    Optional<Article> findBySlug(@Param("slug") String slug);

    /**
     * Tìm kiếm article theo tiêu đề hoặc nội dung
     */
    @Query("SELECT a FROM Article a WHERE a.deletedAt IS NULL AND a.isPublished = true AND " +
           "(LOWER(a.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.summary) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Article> searchArticles(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Tìm article liên quan đến tour
     */
    @Query("SELECT a FROM Article a JOIN a.relatedTours t WHERE a.deletedAt IS NULL AND a.isPublished = true AND t = :tour")
    List<Article> findByRelatedTour(@Param("tour") Tour tour);

    /**
     * Tìm article theo tag
     */
    @Query("SELECT a FROM Article a WHERE a.deletedAt IS NULL AND a.isPublished = true AND :tag MEMBER OF a.tags")
    List<Article> findByTag(@Param("tag") String tag);

    /**
     * Lấy top article được xem nhiều nhất
     */
    @Query("SELECT a FROM Article a WHERE a.deletedAt IS NULL AND a.isPublished = true ORDER BY a.viewCount DESC")
    List<Article> findMostViewedArticles(Pageable pageable);

    /**
     * Lấy article mới nhất
     */
    @Query("SELECT a FROM Article a WHERE a.deletedAt IS NULL AND a.isPublished = true ORDER BY a.createdAt DESC")
    List<Article> findLatestArticles(Pageable pageable);

    /**
     * Đếm số article đã xuất bản
     */
    @Query("SELECT COUNT(a) FROM Article a WHERE a.deletedAt IS NULL AND a.isPublished = true")
    long countPublishedArticles();

    /**
     * Đếm số article theo tác giả
     */
    @Query("SELECT COUNT(a) FROM Article a WHERE a.deletedAt IS NULL AND a.author = :author")
    long countByAuthor(@Param("author") User author);

    /**
     * Kiểm tra slug đã tồn tại hay chưa
     */
    @Query("SELECT COUNT(a) > 0 FROM Article a WHERE a.deletedAt IS NULL AND a.slug = :slug AND a.id != :id")
    boolean existsBySlugAndIdNot(@Param("slug") String slug, @Param("id") Long id);

    /**
     * Tìm article chưa bị xóa theo ID
     */
    @Query("SELECT a FROM Article a WHERE a.id = :id AND a.deletedAt IS NULL")
    Optional<Article> findByIdAndNotDeleted(@Param("id") Long id);

    /**
     * Tìm article theo ID và chưa bị xóa
     */
    Optional<Article> findByIdAndDeletedAtIsNull(Long id);

    /**
     * Tìm article theo slug và đã xuất bản
     */
    Optional<Article> findBySlugAndIsPublishedTrueAndDeletedAtIsNull(String slug);

    /**
     * Lấy tất cả article chưa bị xóa
     */
    Page<Article> findByDeletedAtIsNull(Pageable pageable);

    /**
     * Tìm article theo trạng thái published
     */
    Page<Article> findByIsPublishedAndDeletedAtIsNull(Boolean isPublished, Pageable pageable);

    /**
     * Tìm article đã xuất bản
     */
    Page<Article> findByIsPublishedTrueAndDeletedAtIsNull(Pageable pageable);

    /**
     * Tìm kiếm article theo tiêu đề
     */
    Page<Article> findByTitleContainingIgnoreCaseAndDeletedAtIsNull(String title, Pageable pageable);

    /**
     * Tìm kiếm article theo tiêu đề và trạng thái
     */
    Page<Article> findByTitleContainingIgnoreCaseAndIsPublishedAndDeletedAtIsNull(
        String title, Boolean isPublished, Pageable pageable);

    /**
     * Tìm kiếm article đã xuất bản theo tiêu đề
     */
    Page<Article> findByTitleContainingIgnoreCaseAndIsPublishedTrueAndDeletedAtIsNull(
        String title, Pageable pageable);

    /**
     * Tìm article theo tác giả
     */
    Page<Article> findByAuthorAndDeletedAtIsNull(User author, Pageable pageable);

    /**
     * Tìm article theo tag
     */
    Page<Article> findByTagsContainingAndIsPublishedTrueAndDeletedAtIsNull(String tag, Pageable pageable);

    /**
     * Tìm article liên quan đến tour
     */
    List<Article> findByRelatedToursContainingAndIsPublishedTrueAndDeletedAtIsNull(Tour tour);    /**
     * Lấy article phổ biến nhất
     */
    @Query(value = "SELECT a FROM Article a WHERE a.deletedAt IS NULL AND a.isPublished = true ORDER BY a.viewCount DESC")
    List<Article> findTopByIsPublishedTrueAndDeletedAtIsNullOrderByViewCountDesc(Pageable pageable);

    /**
     * Lấy article mới nhất
     */
    @Query(value = "SELECT a FROM Article a WHERE a.deletedAt IS NULL AND a.isPublished = true ORDER BY a.createdAt DESC")
    List<Article> findTopByIsPublishedTrueAndDeletedAtIsNullOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Đếm tổng số article
     */
    long countByDeletedAtIsNull();

    /**
     * Đếm article đã xuất bản
     */
    long countByIsPublishedTrueAndDeletedAtIsNull();
}

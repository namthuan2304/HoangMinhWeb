# Articles Management API Documentation

## Tổng quan
Nhóm API Articles Management cung cấp đầy đủ chức năng quản lý bài viết du lịch cho hệ thống Travel Booking, bao gồm:
- CRUD operations cho bài viết
- Quản lý xuất bản/gỡ xuất bản
- Upload ảnh đại diện
- Tìm kiếm và phân loại bài viết
- Liên kết bài viết với tours

## Cấu trúc thành phần

### 1. Entity (Article.java)
**Đường dẫn:** `src/main/java/com/travel/entity/Article.java`

**Thuộc tính chính:**
- `id`: ID bài viết
- `title`: Tiêu đề bài viết
- `slug`: Slug cho SEO-friendly URL
- `content`: Nội dung bài viết (LONGTEXT)
- `summary`: Tóm tắt bài viết
- `featuredImageUrl`: Ảnh đại diện
- `author`: Tác giả (User entity)
- `relatedTours`: Danh sách tours liên quan
- `isPublished`: Trạng thái xuất bản
- `viewCount`: Số lượt xem
- `tags`: Danh sách tags
- `metaTitle`, `metaDescription`, `metaKeywords`: Thông tin SEO

**Tính năng đặc biệt:**
- Tự động tạo slug từ tiêu đề với hỗ trợ tiếng Việt
- Soft delete support
- View count tracking
- SEO optimization fields

### 2. Repository (ArticleRepository.java)
**Đường dẫn:** `src/main/java/com/travel/repository/ArticleRepository.java`

**Các phương thức chính:**
- `findBySlugAndIsPublishedTrueAndDeletedAtIsNull()`: Tìm bài viết đã xuất bản theo slug
- `findByDeletedAtIsNull()`: Lấy tất cả bài viết chưa bị xóa
- `findByIsPublishedTrueAndDeletedAtIsNull()`: Lấy bài viết đã xuất bản
- `findByTitleContainingIgnoreCaseAndDeletedAtIsNull()`: Tìm kiếm theo tiêu đề
- `findByAuthorAndDeletedAtIsNull()`: Lấy bài viết theo tác giả
- `findByTagsContainingAndIsPublishedTrueAndDeletedAtIsNull()`: Lấy bài viết theo tag
- `findByRelatedToursContainingAndIsPublishedTrueAndDeletedAtIsNull()`: Lấy bài viết liên quan tour
- `findTopByIsPublishedTrueAndDeletedAtIsNullOrderByViewCountDesc()`: Top bài viết phổ biến
- `findTopByIsPublishedTrueAndDeletedAtIsNullOrderByCreatedAtDesc()`: Bài viết mới nhất

### 3. DTOs

#### ArticleRequest.java
**Đường dẫn:** `src/main/java/com/travel/dto/request/ArticleRequest.java`

**Validation:**
```java
@NotBlank(message = "Tiêu đề không được để trống")
@Size(max = 200, message = "Tiêu đề không được vượt quá 200 ký tự")
private String title;

@NotBlank(message = "Nội dung không được để trống")
private String content;

@Size(max = 500, message = "Tóm tắt không được vượt quá 500 ký tự")
private String summary;
```

#### ArticleResponse.java
**Đường dẫn:** `src/main/java/com/travel/dto/response/ArticleResponse.java`

**Nested Classes:**
- `AuthorInfo`: Thông tin tác giả
- `RelatedTourInfo`: Thông tin tours liên quan

### 4. Service (ArticleService.java)
**Đường dẫn:** `src/main/java/com/travel/service/ArticleService.java`

**Các phương thức chính:**
- `createArticle()`: Tạo bài viết mới
- `getAllArticles()`: Lấy tất cả bài viết (Admin)
- `getPublishedArticles()`: Lấy bài viết đã xuất bản (Public)
- `getArticleById()`: Lấy chi tiết bài viết theo ID
- `getArticleBySlug()`: Lấy chi tiết bài viết theo slug
- `updateArticle()`: Cập nhật bài viết
- `deleteArticle()`: Xóa bài viết (soft delete)
- `publishArticle()`: Xuất bản bài viết
- `unpublishArticle()`: Gỡ xuất bản
- `uploadFeaturedImage()`: Upload ảnh đại diện
- `getArticlesByTour()`: Lấy bài viết liên quan tour
- `getArticlesByAuthor()`: Lấy bài viết theo tác giả
- `getArticlesByTag()`: Lấy bài viết theo tag
- `getPopularArticles()`: Lấy bài viết phổ biến
- `getLatestArticles()`: Lấy bài viết mới nhất
- `getMyArticles()`: Lấy bài viết của tác giả

### 5. Controller (ArticleController.java)
**Đường dẫn:** `src/main/java/com/travel/controller/ArticleController.java`

## API Endpoints

### Public APIs (Không cần xác thực)

#### 1. Lấy danh sách bài viết đã xuất bản
```http
GET /api/articles
```
**Parameters:**
- `keyword` (optional): Từ khóa tìm kiếm
- `page` (default: 0): Số trang
- `size` (default: 10): Kích thước trang
- `sortBy` (default: createdAt): Trường sắp xếp
- `sortDir` (default: desc): Hướng sắp xếp

**Response:** `Page<ArticleResponse>`

#### 2. Lấy chi tiết bài viết theo slug
```http
GET /api/articles/{slug}
```
**Response:** `ArticleResponse`
**Note:** Tự động tăng view count

#### 3. Lấy bài viết theo tác giả
```http
GET /api/articles/author/{authorId}
```
**Parameters:** Pagination parameters
**Response:** `Page<ArticleResponse>`

#### 4. Lấy bài viết theo tag
```http
GET /api/articles/tag/{tag}
```
**Parameters:** Pagination parameters
**Response:** `Page<ArticleResponse>`

#### 5. Lấy bài viết liên quan đến tour
```http
GET /api/articles/tour/{tourId}
```
**Response:** `List<ArticleResponse>`

#### 6. Lấy bài viết phổ biến
```http
GET /api/articles/popular
```
**Parameters:**
- `limit` (default: 5): Số lượng bài viết

**Response:** `List<ArticleResponse>`

#### 7. Lấy bài viết mới nhất
```http
GET /api/articles/latest
```
**Parameters:**
- `limit` (default: 5): Số lượng bài viết

**Response:** `List<ArticleResponse>`

### Admin APIs (Cần xác thực ADMIN)

#### 1. Tạo bài viết mới
```http
POST /api/articles
Authorization: Bearer {token}
Content-Type: application/json
```
**Body:** `ArticleRequest`
**Response:** `ArticleResponse`

#### 2. Lấy tất cả bài viết (Admin)
```http
GET /api/articles/admin
Authorization: Bearer {token}
```
**Parameters:**
- `keyword` (optional): Từ khóa tìm kiếm
- `published` (optional): Trạng thái xuất bản
- Pagination parameters

**Response:** `Page<ArticleResponse>`

#### 3. Lấy chi tiết bài viết theo ID (Admin)
```http
GET /api/articles/admin/{id}
Authorization: Bearer {token}
```
**Response:** `ArticleResponse`

#### 4. Cập nhật bài viết
```http
PUT /api/articles/{id}
Authorization: Bearer {token}
Content-Type: application/json
```
**Body:** `ArticleRequest`
**Response:** `ArticleResponse`

#### 5. Xóa bài viết
```http
DELETE /api/articles/{id}
Authorization: Bearer {token}
```
**Response:** `MessageResponse`

#### 6. Xuất bản bài viết
```http
POST /api/articles/{id}/publish
Authorization: Bearer {token}
```
**Response:** `ArticleResponse`

#### 7. Gỡ xuất bản bài viết
```http
POST /api/articles/{id}/unpublish
Authorization: Bearer {token}
```
**Response:** `ArticleResponse`

#### 8. Upload ảnh đại diện
```http
POST /api/articles/{id}/upload-featured-image
Authorization: Bearer {token}
Content-Type: multipart/form-data
```
**Form Data:**
- `file`: Image file

**Response:** `ArticleResponse`

#### 9. Lấy bài viết của tôi
```http
GET /api/articles/my-articles
Authorization: Bearer {token}
```
**Parameters:** Pagination parameters
**Response:** `Page<ArticleResponse>`

## Tính năng đặc biệt

### 1. SEO Optimization
- Tự động tạo slug từ tiêu đề với hỗ trợ tiếng Việt
- Meta tags cho SEO (title, description, keywords)
- Friendly URLs với slug

### 2. Content Management
- Rich text content support
- Featured image upload
- Article summary for preview
- Tag system for categorization

### 3. Tour Integration
- Liên kết bài viết với tours
- Lấy bài viết liên quan đến tour cụ thể
- Cross-promotion giữa content và tours

### 4. Analytics & Performance
- View count tracking
- Popular articles ranking
- Latest articles feed
- Author performance tracking

### 5. Publication Workflow
- Draft/Published status
- Admin approval workflow
- Scheduled publishing support (through isPublished flag)

### 6. Security & Permissions
- Admin-only content management
- Author can edit own articles
- Public read access for published content
- Secure file upload for images

## Frontend Integration

### JavaScript API Client
File: `frontend/assets/js/api.js`

**Available Methods:**
```javascript
// Lấy danh sách bài viết
await api.getArticles({ keyword: 'du lịch', page: 0, size: 10 });

// Lấy chi tiết bài viết
await api.getArticle('slug-bai-viet');

// Tạo bài viết mới (Admin)
await api.createArticle({
    title: 'Tiêu đề bài viết',
    content: 'Nội dung bài viết...',
    summary: 'Tóm tắt...',
    tags: ['du-lich', 'vietnam'],
    relatedTourIds: [1, 2, 3]
});

// Cập nhật bài viết (Admin)
await api.updateArticle(articleId, articleData);

// Xóa bài viết (Admin)
await api.deleteArticle(articleId);
```

## Testing với Swagger UI

Truy cập: `http://localhost:8080/swagger-ui/index.html`

Tìm section "Article Management" để test các APIs.

## Database Schema

### Articles Table
```sql
CREATE TABLE articles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(300) UNIQUE,
    content LONGTEXT NOT NULL,
    summary TEXT,
    featured_image_url VARCHAR(500),
    author_id BIGINT NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    view_count BIGINT DEFAULT 0,
    meta_title VARCHAR(200),
    meta_description VARCHAR(300),
    meta_keywords VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE article_tags (
    article_id BIGINT,
    tag VARCHAR(100),
    FOREIGN KEY (article_id) REFERENCES articles(id)
);

CREATE TABLE article_tours (
    article_id BIGINT,
    tour_id BIGINT,
    FOREIGN KEY (article_id) REFERENCES articles(id),
    FOREIGN KEY (tour_id) REFERENCES tours(id)
);
```

## Lỗi thường gặp và cách xử lý

### 1. ResourceNotFoundException
- **Nguyên nhân:** Không tìm thấy bài viết với ID/slug đã cho
- **Xử lý:** Kiểm tra ID/slug và trạng thái bài viết

### 2. IllegalArgumentException  
- **Nguyên nhân:** Không có quyền chỉnh sửa/xóa bài viết
- **Xử lý:** Chỉ tác giả hoặc admin mới có quyền

### 3. Validation Errors
- **Nguyên nhân:** Dữ liệu đầu vào không hợp lệ
- **Xử lý:** Kiểm tra validation constraints trong ArticleRequest

## Kết luận

Nhóm API Articles Management đã được triển khai đầy đủ với:
✅ CRUD operations hoàn chỉnh
✅ Phân quyền và bảo mật
✅ SEO optimization
✅ Tour integration
✅ File upload support
✅ Analytics tracking
✅ Public và Admin APIs
✅ Frontend integration ready
✅ Swagger documentation

Hệ thống sẵn sàng để sử dụng trong production!

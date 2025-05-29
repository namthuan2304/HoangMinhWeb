# Articles Management - Client Implementation

## Tổng quan

Phần client của Articles Management đã được triển khai hoàn chỉnh với các tính năng:

### 🏠 Trang chủ (index.html)
- **Featured Articles Section**: Hiển thị 3 bài viết nổi bật
- **Navigation Menu**: Có link đến trang bài viết
- **Responsive Design**: Hỗ trợ mobile và desktop

### 📝 Trang danh sách bài viết (articles.html)
- **Tìm kiếm**: Tìm kiếm theo tiêu đề và nội dung
- **Lọc theo tag**: Lọc bài viết theo chủ đề
- **Sắp xếp**: Theo ngày tạo, lượt xem, tên A-Z
- **Phân trang**: Hiển thị 9 bài viết mỗi trang
- **Sidebar**: Bài viết phổ biến và mới nhất
- **Responsive Grid**: Layout linh hoạt cho mọi thiết bị

### 📖 Trang chi tiết bài viết (article-detail.html)
- **Breadcrumb**: Điều hướng rõ ràng
- **Meta thông tin**: Ngày đăng, tác giả, lượt xem, thời gian đọc
- **Chia sẻ**: Facebook, Twitter, LinkedIn
- **Thông tin tác giả**: Avatar và bio
- **Bài viết liên quan**: 3 bài viết tương tự
- **Bình luận**: Đọc và viết bình luận (yêu cầu đăng nhập)
- **Tracking view**: Tự động đếm lượt xem

## 🎨 CSS Styles

### articles.css
- **Filter section**: Search box, tag buttons, sort dropdown
- **Articles grid**: Responsive 1-2-3 columns
- **Article cards**: Hover effects, meta info, truncated text
- **Pagination**: Number buttons với prev/next
- **Sidebar widgets**: Popular và latest articles
- **Loading states**: Spinner và skeleton

### article-detail.css
- **Article header**: Meta thông tin, tags
- **Article content**: Typography, images, blockquotes
- **Share buttons**: Social media với hover effects
- **Author info**: Card layout với avatar
- **Related articles**: Grid layout
- **Comments section**: Form và danh sách bình luận
- **Print styles**: Tối ưu cho in ấn

## 🚀 JavaScript Functionality

### articles.js - ArticlesManager class
```javascript
class ArticlesManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 9;
        this.currentTag = '';
        this.currentSearch = '';
        this.currentSort = 'createdAt:desc';
    }
    
    // Methods:
    loadArticles()          // Load articles with filters
    loadTags()              // Load available tags
    loadPopularArticles()   // Sidebar popular articles
    loadLatestArticles()    // Sidebar latest articles
    renderArticles()        // Render articles grid
    renderPagination()      // Render page numbers
    goToPage(page)          // Navigate to page
}
```

### article-detail.js - ArticleDetailManager class
```javascript
class ArticleDetailManager {
    constructor() {
        this.articleSlug = this.getSlugFromUrl();
        this.article = null;
    }
    
    // Methods:
    loadArticle()           // Load article by slug
    renderArticle()         // Render article content
    loadRelatedArticles()   // Load related articles
    loadComments()          // Load article comments
    submitComment()         // Submit new comment
    shareArticle()          // Social media sharing
    trackView()             // Track article view
}
```

### index.js - Featured Articles
```javascript
// Functions added:
loadFeaturedArticles()      // Load 3 featured articles
renderFeaturedArticles()    // Render featured cards
renderFallbackArticles()    // Fallback data
```

## 🔗 API Integration

### API Endpoints sử dụng:
```
GET  /api/articles                 // Danh sách bài viết với filters
GET  /api/articles/{slug}          // Chi tiết bài viết
GET  /api/articles/tags            // Danh sách tags
POST /api/articles/{id}/view       // Track lượt xem
GET  /api/comments/article/{id}    // Comments của bài viết
POST /api/comments                 // Tạo comment mới
```

### API Client Methods (api.js):
```javascript
// Existing methods:
getArticles(params)         // Get articles with pagination/filter
getArticle(slug)           // Get single article
createArticle()            // Admin only
updateArticle()            // Admin only
deleteArticle()            // Admin only
publishArticle()           // Admin only

// New methods added:
getArticleTags()           // Get available tags
trackArticleView()         // Track view count
getArticleComments()       // Get comments for article
createArticleComment()     // Create new comment
```

## 📱 Responsive Design

### Breakpoints:
- **Mobile**: < 768px
  - Single column layout
  - Stacked filters
  - Mobile-optimized cards
  
- **Tablet**: 768px - 991px
  - 2 column grid
  - Side-by-side filters
  
- **Desktop**: > 992px
  - 3 column grid
  - Full filter row
  - Sidebar layout

### Mobile Optimizations:
- Touch-friendly buttons
- Readable font sizes
- Optimized images
- Swipe gestures support
- Fast loading

## 🎯 Key Features

### 1. Search & Filter
- **Real-time search**: 300ms debounce
- **Tag filtering**: Dynamic tag buttons
- **Sort options**: Date, popularity, alphabetical
- **URL parameters**: Shareable filtered URLs

### 2. Pagination
- **Client-side pagination**: API supports server-side
- **Page size**: 9 articles per page
- **Navigation**: Previous/Next + page numbers
- **Smooth scrolling**: Auto scroll to top on page change

### 3. Performance
- **Lazy loading**: Images load when visible
- **Error handling**: Graceful fallbacks
- **Loading states**: Spinners và skeletons
- **Caching**: Browser caching for images

### 4. SEO & Accessibility
- **Semantic HTML**: Proper heading structure
- **Alt text**: All images have descriptions
- **Keyboard navigation**: Full keyboard support
- **Screen reader**: ARIA labels
- **Meta tags**: Dynamic title updates

## 🔧 Configuration

### Global Constants (utils.js):
```javascript
window.API_BASE_URL = 'http://localhost:8080';

// Helper functions:
getAuthHeaders()           // Get authorization headers
getCurrentUser()           // Get logged in user
isAuthenticated()          // Check auth status
showToast()               // Show notifications
```

### Page Settings:
```javascript
// Articles page
pageSize: 9               // Articles per page
debounceDelay: 300ms      // Search debounce

// Article detail
readingSpeed: 200         // Words per minute
relatedCount: 3           // Related articles to show
```

## 🎨 CSS Variables

### Định nghĩa trong style.css:
```css
--bright-navy-blue: #1967D2;
--white: #FFFFFF;
--cultured: #F8F9FA;
--sonic-silver: #757575;
--platinum: #E0E0E0;
--radius-5: 5px;
--radius-10: 10px;
--transition-1: 0.3s ease;
--shadow-1: 0 2px 8px rgba(0,0,0,0.1);
```

## 📝 Usage Examples

### Load articles with filters:
```javascript
// Search articles
articlesManager.currentSearch = 'du lịch';
articlesManager.loadArticles();

// Filter by tag
articlesManager.currentTag = 'Kinh nghiệm';
articlesManager.loadArticles();

// Sort by popularity
articlesManager.currentSort = 'viewCount:desc';
articlesManager.loadArticles();
```

### Navigate to article:
```javascript
// Direct navigation
window.location.href = `article-detail.html?slug=${slug}`;

// With tracking
articleDetailManager.trackView();
```

### Submit comment:
```javascript
// Check authentication first
if (getCurrentUser()) {
    articleDetailManager.submitComment();
} else {
    window.location.href = 'login.html';
}
```

## 🚀 Future Enhancements

### Phase 2 (Admin Features):
- Article editor với WYSIWYG
- Image upload cho articles
- Draft management
- SEO optimization tools
- Analytics dashboard

### Phase 3 (Advanced Features):
- Bookmarking articles
- Reading progress indicator
- Email newsletter integration
- Social login
- Article recommendations

## 🐛 Troubleshooting

### Common Issues:

1. **Articles not loading**:
   - Check API connection
   - Verify CORS settings
   - Check browser console for errors

2. **Images not displaying**:
   - Check image URLs
   - Verify upload directory permissions
   - Use fallback images

3. **Search not working**:
   - Check debounce timing
   - Verify API endpoint
   - Clear browser cache

4. **Comments not submitting**:
   - Check authentication status
   - Verify API permissions
   - Check form validation

## 📞 Support

Để hỗ trợ kỹ thuật:
1. Check browser console logs
2. Verify API server status
3. Test with fallback data
4. Contact development team

---

**Status**: ✅ **HOÀN THÀNH** - Articles Management Client đã sẵn sàng sử dụng!

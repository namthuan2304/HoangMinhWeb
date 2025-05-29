/**
 * Article Detail Page JavaScript
 * Handles individual article display, comments, and related articles
 */

class ArticleDetailManager {
    constructor() {
        this.articleSlug = this.getSlugFromUrl();
        this.article = null;
        this.isLoading = false;
        
        if (!this.articleSlug) {
            this.showError('Không tìm thấy bài viết');
            return;
        }
        
        this.initializeElements();
        this.bindEvents();
        this.loadArticle();
    }

    getSlugFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('slug');
    }

    initializeElements() {
        // Main content elements
        this.breadcrumbNav = document.querySelector('.breadcrumb-nav');
        this.articleHeader = document.querySelector('.article-header');
        this.articleContent = document.querySelector('.article-content');
        this.authorInfo = document.querySelector('.author-info');
        this.relatedArticles = document.querySelector('.related-grid');
        
        // Loading and error states
        this.loadingContainer = document.querySelector('.loading-container');
        this.errorContainer = document.querySelector('.error-container');
        
        // Comments elements
        this.commentsSection = document.querySelector('.comments-section');
        this.commentForm = document.querySelector('.comment-form');
        this.commentsList = document.querySelector('.comments-list');
        this.commentsCount = document.querySelector('.comments-count');
    }

    bindEvents() {
        // Share buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.share-btn')) {
                const btn = e.target.closest('.share-btn');
                const platform = btn.dataset.platform;
                this.shareArticle(platform);
            }
        });

        // Comment form submission
        if (this.commentForm) {
            const form = this.commentForm.querySelector('form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.submitComment();
                });
            }
        }

        // Back button
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.history.back();
            });
        }
    }

    async loadArticle() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();

        try {
            const response = await fetch(`${API_BASE_URL}/api/articles/${this.articleSlug}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Bài viết không tồn tại');
                }
                throw new Error('Không thể tải bài viết');
            }

            this.article = await response.json();
            this.renderArticle();
            this.updatePageTitle();
            this.loadRelatedArticles();
            this.loadComments();
            
            // Track view
            this.trackView();

        } catch (error) {
            console.error('Error loading article:', error);
            this.showError(error.message);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    renderArticle() {
        if (!this.article) return;

        // Update breadcrumb
        this.updateBreadcrumb();
        
        // Render article header
        this.renderHeader();
        
        // Render article content
        this.renderContent();
        
        // Render author info
        this.renderAuthorInfo();
    }

    updateBreadcrumb() {
        const breadcrumbSpan = this.breadcrumbNav.querySelector('span:last-child');
        if (breadcrumbSpan) {
            breadcrumbSpan.textContent = this.article.title;
        }
    }

    renderHeader() {
        const publishedDate = new Date(this.article.publishedAt || this.article.createdAt).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const headerHTML = `
            <div class="container">
                <div class="article-meta">
                    <div class="meta-item">
                        <ion-icon name="calendar-outline"></ion-icon>
                        <span>${publishedDate}</span>
                    </div>                    <div class="meta-item">
                        <ion-icon name="person-outline"></ion-icon>
                        <span>${this.article.author?.fullName || this.article.author?.username || 'Admin'}</span>
                    </div>
                    <div class="meta-item">
                        <ion-icon name="eye-outline"></ion-icon>
                        <span>${this.article.viewCount || 0} lượt xem</span>
                    </div>
                    <div class="meta-item">
                        <ion-icon name="time-outline"></ion-icon>
                        <span>${this.estimateReadingTime(this.article.content)} phút đọc</span>
                    </div>
                </div>
                
                <h1 class="article-title">${this.article.title}</h1>
                
                ${this.article.summary ? `<p class="article-excerpt">${this.article.summary}</p>` : ''}
                
                ${this.article.tags && this.article.tags.length > 0 ? `
                    <div class="article-tags">
                        ${this.article.tags.map(tag => `<a href="articles.html?tag=${tag}" class="article-tag">${tag}</a>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        this.articleHeader.innerHTML = headerHTML;
    }    renderContent() {
        const defaultImage = './assets/images/img8.jpg';
        const featuredImage = this.article.featuredImageUrl ? `http://localhost:8080${this.article.featuredImageUrl}` : defaultImage;

        const contentHTML = `
            <div class="container">
                <figure class="article-banner">
                    <img src="${featuredImage}" alt="${this.article.title}" 
                         onerror="this.src='${defaultImage}'">
                </figure>
                
                <div class="article-body">
                    ${this.formatContent(this.article.content || '')}
                </div>
            </div>
        `;

        this.articleContent.innerHTML = contentHTML;
        
        // Render article footer with actions
        this.renderArticleFooter();
    }

    renderArticleFooter() {
        const footerHTML = `
            <div class="container">
                <div class="article-actions">
                    <div class="share-buttons">
                        <span class="share-label">Chia sẻ:</span>
                        <a href="#" class="share-btn facebook" data-platform="facebook">
                            <ion-icon name="logo-facebook"></ion-icon>
                        </a>
                        <a href="#" class="share-btn twitter" data-platform="twitter">
                            <ion-icon name="logo-twitter"></ion-icon>
                        </a>
                        <a href="#" class="share-btn linkedin" data-platform="linkedin">
                            <ion-icon name="logo-linkedin"></ion-icon>
                        </a>
                    </div>
                    
                    <div class="article-stats">
                        <div class="stat-item">
                            <ion-icon name="eye-outline"></ion-icon>
                            <span>${this.article.viewCount || 0} lượt xem</span>
                        </div>
                        <div class="stat-item">
                            <ion-icon name="calendar-outline"></ion-icon>
                            <span>${new Date(this.article.publishedAt || this.article.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Find or create article footer
        let articleFooter = document.querySelector('.article-footer');
        if (!articleFooter) {
            articleFooter = document.createElement('section');
            articleFooter.className = 'article-footer';
            this.articleContent.parentNode.insertBefore(articleFooter, this.articleContent.nextSibling);
        }
        
        articleFooter.innerHTML = footerHTML;
    }    renderAuthorInfo() {
        if (!this.authorInfo) return;

        const authorHTML = `
            <div class="author-header">
                <div class="author-avatar">
                    <img src="./assets/images/default-avatar.png" alt="Tác giả" 
                         onerror="this.src='./assets/images/default-avatar.png'">
                </div>
                <div class="author-details">
                    <h4>${this.article.author?.fullName || this.article.author?.username || 'Admin'}</h4>
                    <p class="author-role">Tác giả</p>
                </div>
            </div>
            <p class="author-bio">
                Chuyên gia du lịch với nhiều năm kinh nghiệm khám phá các điểm đến tuyệt vời trên khắp thế giới.
                Chia sẻ những trải nghiệm và kiến thức để giúp bạn có những chuyến đi đáng nhớ.
            </p>
        `;

        this.authorInfo.innerHTML = authorHTML;
    }

    async loadRelatedArticles() {
        try {
            const params = new URLSearchParams({
                size: 3,
                sort: 'createdAt:desc'
            });

            // Add tags for related articles if available
            if (this.article.tags && this.article.tags.length > 0) {
                params.append('tag', this.article.tags[0]);
            }

            const response = await fetch(`${API_BASE_URL}/api/articles?${params}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load related articles');
            }

            const data = await response.json();
            // Filter out current article
            const related = data.content.filter(article => article.slug !== this.articleSlug);
            this.renderRelatedArticles(related.slice(0, 3));

        } catch (error) {
            console.error('Error loading related articles:', error);
        }
    }

    renderRelatedArticles(articles) {
        if (!this.relatedArticles || articles.length === 0) {
            const relatedSection = document.querySelector('.related-articles');
            if (relatedSection) {
                relatedSection.style.display = 'none';
            }
            return;
        }        this.relatedArticles.innerHTML = articles.map(article => {
            const publishedDate = new Date(article.publishedAt || article.createdAt).toLocaleDateString('vi-VN');
            const defaultImage = './assets/images/img8.jpg';
            const articleImage = article.featuredImageUrl ? `http://localhost:8080${article.featuredImageUrl}` : defaultImage;

            return `
                <div class="article-card" onclick="window.location.href='article-detail.html?slug=${article.slug}'">
                    <figure class="card-banner">
                        <img src="${articleImage}" alt="${article.title}" loading="lazy" 
                             onerror="this.src='${defaultImage}'">
                    </figure>
                    
                    <div class="card-content">
                        <div class="card-meta">
                            <div class="meta-item">
                                <ion-icon name="calendar-outline"></ion-icon>
                                <span>${publishedDate}</span>
                            </div>
                            <div class="meta-item">
                                <ion-icon name="eye-outline"></ion-icon>
                                <span>${article.viewCount || 0}</span>
                            </div>
                        </div>
                        
                        <h3 class="h3 card-title">
                            <a href="article-detail.html?slug=${article.slug}">${article.title}</a>
                        </h3>
                        
                        <p class="card-text">${article.summary || article.content?.substring(0, 100) + '...' || ''}</p>
                        
                        <div class="card-footer">
                            <a href="article-detail.html?slug=${article.slug}" class="read-more-btn">
                                Đọc thêm
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadComments() {
        if (!this.commentsSection) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/comments/article/${this.article.id}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load comments');
            }

            const comments = await response.json();
            this.renderComments(comments);

        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    renderComments(comments) {
        if (!this.commentsCount || !this.commentsList) return;

        this.commentsCount.textContent = `${comments.length} bình luận`;

        if (comments.length === 0) {
            this.commentsList.innerHTML = '<p class="no-comments">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>';
            return;
        }

        this.commentsList.innerHTML = comments.map(comment => {
            const commentDate = new Date(comment.createdAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="comment-item">
                    <div class="comment-header">
                        <div class="comment-avatar">
                            <img src="./assets/images/default-avatar.png" alt="${comment.authorName}" 
                                 onerror="this.src='./assets/images/default-avatar.png'">
                        </div>
                        <div class="comment-info">
                            <h5>${comment.authorName}</h5>
                            <span class="comment-date">${commentDate}</span>
                        </div>
                    </div>
                    <p class="comment-text">${comment.content}</p>
                </div>
            `;
        }).join('');
    }

    async submitComment() {
        const user = getCurrentUser();
        if (!user) {
            showToast('Vui lòng đăng nhập để bình luận', 'warning');
            window.location.href = 'login.html';
            return;
        }

        const textarea = this.commentForm.querySelector('textarea');
        const content = textarea.value.trim();

        if (!content) {
            showToast('Vui lòng nhập nội dung bình luận', 'warning');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/comments`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    articleId: this.article.id,
                    content: content
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit comment');
            }

            textarea.value = '';
            showToast('Bình luận đã được gửi thành công', 'success');
            this.loadComments(); // Reload comments

        } catch (error) {
            console.error('Error submitting comment:', error);
            showToast('Không thể gửi bình luận. Vui lòng thử lại.', 'error');
        }
    }

    async trackView() {
        try {
            await fetch(`${API_BASE_URL}/api/articles/${this.article.id}/view`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
        } catch (error) {
            console.error('Error tracking view:', error);
        }
    }

    shareArticle(platform) {
        const url = window.location.href;
        const title = this.article.title;
        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(title);
        
        let shareUrl = '';
        
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
                break;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
        }
    }

    formatContent(content) {
        // Basic content formatting
        return content
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }

    estimateReadingTime(content) {
        const wordsPerMinute = 200; // Average reading speed
        const words = content.split(/\s+/).length;
        return Math.ceil(words / wordsPerMinute);
    }

    updatePageTitle() {
        if (this.article) {
            document.title = `${this.article.title} - Du Lịch Hoàng Minh`;
        }
    }

    showLoading() {
        if (this.loadingContainer) {
            this.loadingContainer.style.display = 'flex';
        }
    }

    hideLoading() {
        if (this.loadingContainer) {
            this.loadingContainer.style.display = 'none';
        }
    }

    showError(message) {
        this.hideLoading();
        
        if (this.errorContainer) {
            this.errorContainer.style.display = 'block';
            const errorMessage = this.errorContainer.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.textContent = message;
            }
        } else {
            // Create error container if it doesn't exist
            const main = document.querySelector('main');
            if (main) {
                main.innerHTML = `
                    <div class="error-container">
                        <div class="error-icon">
                            <ion-icon name="alert-circle-outline"></ion-icon>
                        </div>
                        <h2 class="error-title">Đã xảy ra lỗi</h2>
                        <p class="error-message">${message}</p>
                        <a href="articles.html" class="back-btn">
                            <ion-icon name="arrow-back-outline"></ion-icon>
                            Quay lại danh sách bài viết
                        </a>
                    </div>
                `;
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for API_BASE_URL to be available
    if (typeof API_BASE_URL === 'undefined') {
        console.error('API_BASE_URL is not defined');
        return;
    }
    
    window.articleDetailManager = new ArticleDetailManager();
});

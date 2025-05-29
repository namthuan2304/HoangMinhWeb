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
    
    estimateReadingTime(content) {
        if (!content) return 1;
        
        // Remove HTML tags
        const text = content.replace(/<[^>]*>/g, '');
        
        // Count words (average reading speed is 200-250 words per minute)
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        
        return minutes > 0 ? minutes : 1;
    }    initializeElements() {
        // Main content elements
        this.breadcrumbNav = document.querySelector('.breadcrumb-nav');
        this.articleHeader = document.querySelector('.article-header');
        this.articleContent = document.querySelector('.article-content');
        this.authorInfo = document.querySelector('.author-info');
        this.relatedArticles = document.querySelector('.related-grid');
        
        // Individual elements from HTML
        this.articleTitle = document.getElementById('articleTitle');
        this.articleSummary = document.getElementById('articleSummary');
        this.articleTags = document.getElementById('articleTags');
        this.articleBody = document.getElementById('articleBody');
        this.authorName = document.getElementById('authorName');
        this.authorAvatar = document.getElementById('authorAvatar');
        this.publishDate = document.getElementById('publishDate');
        this.viewCount = document.getElementById('viewCount');
        this.featuredImage = document.getElementById('featuredImage');
        this.featuredImageSection = document.getElementById('featuredImageSection');
        this.breadcrumbTitle = document.getElementById('breadcrumbTitle');
        
        // Container elements
        this.articleContainer = document.getElementById('articleContainer');
        
        // Loading and error states
        this.loadingContainer = document.getElementById('loadingContainer');
        this.errorContainer = document.getElementById('errorContainer');
        
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
            // Use expand=author parameter to ensure author details are included
            const response = await fetch(`${API_BASE_URL}/api/articles/${this.articleSlug}?expand=author`, {
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
            console.log('Article data loaded:', this.article); // Log for debugging
            
            // Ensure author object exists
            if (!this.article.author) {
                this.article.author = {
                    username: 'Admin',
                    fullName: 'Admin',
                    avatarUrl: null,
                    bio: 'Tác giả bài viết tại Du Lịch Hoàng Minh'
                };
            }
            
            this.renderArticle();
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
    }    renderArticle() {
        if (!this.article) return;

        // Show article container
        this.articleContainer.style.display = 'block';
        
        // Update breadcrumb
        this.updateBreadcrumb();
        
        // Render article data
        this.renderArticleData();
        
        // Render author info
        this.renderAuthorInfo();
    }

    updateBreadcrumb() {
        if (this.breadcrumbTitle) {
            this.breadcrumbTitle.textContent = this.article.title;
        }
    }

    renderArticleData() {
        const publishedDate = new Date(this.article.publishedAt || this.article.createdAt).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Update title
        if (this.articleTitle) {
            this.articleTitle.textContent = this.article.title;
        }

        // Update summary
        if (this.articleSummary && this.article.summary) {
            this.articleSummary.textContent = this.article.summary;
        } else if (this.articleSummary) {
            this.articleSummary.style.display = 'none';
        }

        // Update tags
        if (this.articleTags && this.article.tags && this.article.tags.length > 0) {
            this.articleTags.innerHTML = this.article.tags.map(tag => 
                `<a href="articles.html?tag=${encodeURIComponent(tag)}" class="tag">${tag}</a>`
            ).join('');
        } else if (this.articleTags) {
            this.articleTags.style.display = 'none';
        }

        // Update content
        if (this.articleBody) {
            this.articleBody.innerHTML = this.formatContent(this.article.content || '');
        }

        // Update author info
        if (this.authorName) {
            const authorName = this.article.author?.fullName || this.article.author?.username || 'Admin';
            this.authorName.textContent = authorName;
            console.log('Setting author name:', authorName); // Debug log
        }
        
        if (this.authorAvatar) {
            if (this.article.author?.avatarUrl) {
                this.authorAvatar.src = `http://localhost:8080${this.article.author.avatarUrl}`;
            } else {
                this.authorAvatar.src = './assets/images/default-avatar.png';
            }
        }

        if (this.publishDate) {
            this.publishDate.textContent = publishedDate;
        }

        if (this.viewCount) {
            this.viewCount.textContent = `${this.article.viewCount || 0} lượt xem`;
        }
        
        // Update reading time
        const readTimeElement = document.getElementById('readTime');
        if (readTimeElement) {
            const minutes = this.estimateReadingTime(this.article.content);
            readTimeElement.textContent = `${minutes} phút đọc`;
        }

        // Update featured image
        if (this.featuredImage && this.featuredImageSection) {
            if (this.article.featuredImageUrl) {
                const imageUrl = `http://localhost:8080${this.article.featuredImageUrl}`;
                this.featuredImage.src = imageUrl;
                this.featuredImage.alt = this.article.title;
                this.featuredImageSection.style.display = 'block';
            } else {
                this.featuredImageSection.style.display = 'none';
            }
        }

        // Update page title
        document.title = `${this.article.title} - Du Lịch Hoàng Minh`;
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
        if (!this.article || !this.article.author) return;
        
        // Update sidebar author info
        const sidebarAuthorName = document.getElementById('sidebarAuthorName');
        const sidebarAuthorAvatar = document.getElementById('sidebarAuthorAvatar');
        const sidebarAuthorBio = document.getElementById('sidebarAuthorBio');
        
        if (sidebarAuthorName) {
            sidebarAuthorName.textContent = this.article.author.fullName || this.article.author.username || 'Admin';
        }
        
        if (sidebarAuthorAvatar) {
            if (this.article.author.avatarUrl) {
                sidebarAuthorAvatar.src = `http://localhost:8080${this.article.author.avatarUrl}`;
            } else {
                sidebarAuthorAvatar.src = './assets/images/default-avatar.png';
            }
            sidebarAuthorAvatar.alt = this.article.author.fullName || this.article.author.username || 'Admin';
        }
        
        if (sidebarAuthorBio) {
            sidebarAuthorBio.textContent = this.article.author.bio || 'Tác giả bài viết tại Du Lịch Hoàng Minh';
        }
        
        // Update author info in article header if not already done in renderArticleData
        if (this.authorAvatar) {
            if (this.article.author.avatarUrl) {
                this.authorAvatar.src = `http://localhost:8080${this.article.author.avatarUrl}`;
            } else {
                this.authorAvatar.src = './assets/images/default-avatar.png';
            }
            this.authorAvatar.alt = this.article.author.fullName || this.article.author.username || 'Admin';
        }
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

    estimateReadingTime(content) {
        if (!content) return 1;
        const wordsPerMinute = 200;
        const wordCount = content.split(' ').length;
        return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    }

    formatContent(content) {
        if (!content) return '';
        
        // Basic HTML formatting for line breaks
        return content
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }

    updatePageTitle() {
        if (this.article && this.article.title) {
            document.title = `${this.article.title} - Du Lịch Hoàng Minh`;
        }
    }

    showLoading() {
        if (this.loadingContainer) {
            this.loadingContainer.style.display = 'flex';
        }
        if (this.articleContainer) {
            this.articleContainer.style.display = 'none';
        }
        if (this.errorContainer) {
            this.errorContainer.style.display = 'none';
        }
    }

    hideLoading() {
        if (this.loadingContainer) {
            this.loadingContainer.style.display = 'none';
        }
    }

    showError(message) {
        if (this.errorContainer) {
            this.errorContainer.style.display = 'block';
            const errorMessage = this.errorContainer.querySelector('p');
            if (errorMessage) {
                errorMessage.textContent = message;
            }
        }
        if (this.loadingContainer) {
            this.loadingContainer.style.display = 'none';
        }
        if (this.articleContainer) {
            this.articleContainer.style.display = 'none';
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

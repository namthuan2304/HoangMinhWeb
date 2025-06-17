/**
 * Articles Page JavaScript
 * Handles article listing, filtering, search, and pagination
 */

class ArticlesManager {    constructor() {
        this.currentPage = 1;
        this.pageSize = 9;
        this.currentTag = '';
        this.currentSearch = '';
        this.currentSort = 'createdAt:desc';
        this.isLoading = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadArticles();
        this.loadTags();
        this.loadPopularArticles();
        this.loadLatestArticles();
    }    initializeElements() {
        // Main elements
        this.articlesGrid = document.getElementById('articlesGrid');
        this.loadingContainer = document.getElementById('loadingContainer');
        this.emptyState = document.getElementById('emptyState');
        this.articlesCount = document.getElementById('articlesCount');
        this.pagination = document.getElementById('pagination');
        
        // Filter elements
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearch');
        this.tagSelect = document.getElementById('tagSelect');
        this.sortSelect = document.getElementById('sortSelect');
        
        // Sidebar elements
        this.popularArticles = document.getElementById('popularArticles');
        this.latestArticles = document.getElementById('latestArticles');
    }   
     bindEvents() {
        // Search functionality
        let searchTimeout;
        this.searchInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            this.clearSearchBtn.classList.toggle('show', value.length > 0);
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.currentSearch = value;
                this.currentPage = 1;
                this.loadArticles();
            }, 300);
        });

        this.clearSearchBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.clearSearchBtn.classList.remove('show');
            this.currentSearch = '';
            this.currentPage = 1;
            this.loadArticles();
        });

        // Sort functionality
        this.sortSelect.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.currentPage = 1;
            this.loadArticles();
        });

        // Tag filter functionality
        this.tagSelect.addEventListener('change', (e) => {
            this.currentTag = e.target.value;
            this.currentPage = 1;
            this.loadArticles();
        });
    }
    async loadArticles() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();

        try {
            let url;
            const params = new URLSearchParams({
                page: this.currentPage - 1, // API uses 0-based pagination
                size: this.pageSize,
                sortBy: this.currentSort.split(':')[0],
                sortDir: this.currentSort.split(':')[1]
            });

            if (this.currentSearch) {
                params.append('keyword', this.currentSearch);
            }

            // Use different endpoints based on whether we're filtering by tag
            if (this.currentTag) {
                url = `${API_BASE_URL}/api/articles/tag/${encodeURIComponent(this.currentTag)}?${params}`;
            } else {
                url = `${API_BASE_URL}/api/articles?${params}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load articles');
            }

            const data = await response.json();
            this.renderArticles(data);
            this.updateArticlesCount(data.totalElements);
            this.renderPagination(data);

        } catch (error) {
            console.error('Error loading articles:', error);
            this.showError('Không thể tải danh sách bài viết. Vui lòng thử lại.');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    async loadTags() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/articles/tags`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load tags');
            }            const tags = await response.json();
            this.renderTagOptions(tags);

        } catch (error) {
            console.error('Error loading tags:', error);
        }
    }    async loadPopularArticles() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/articles/popular?limit=5`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load popular articles');
            }

            const articles = await response.json();
            this.renderSidebarArticles(articles, this.popularArticles);

        } catch (error) {
            console.error('Error loading popular articles:', error);
        }
    }

    async loadLatestArticles() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/articles/latest?limit=5`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load latest articles');
            }

            const articles = await response.json();
            this.renderSidebarArticles(articles, this.latestArticles);

        } catch (error) {
            console.error('Error loading latest articles:', error);
        }
    }

    renderArticles(data) {
        const articles = data.content || [];
        
        if (articles.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();
        this.articlesGrid.innerHTML = articles.map(article => this.createArticleCard(article)).join('');
        
        // Add fade-in animation
        this.articlesGrid.classList.add('fade-in');
        setTimeout(() => this.articlesGrid.classList.remove('fade-in'), 500);
    }    
    createArticleCard(article) {
        const publishedDate = new Date(article.publishedAt || article.createdAt).toLocaleDateString('vi-VN');
        const defaultImage = './assets/images/img8.jpg';
        const articleImage = article.featuredImageUrl ? `http://localhost:8080${article.featuredImageUrl}` : defaultImage;

        return `
            <div class="article-card" onclick="window.location.href='article-detail.html?slug=${article.slug}'">
                <figure class="card-banner">
                    <img src="${articleImage}" alt="${article.title}" loading="lazy" 
                         onerror="this.src='${defaultImage}'">
                    ${article.isFeatured ? '<div class="card-badge">Nổi bật</div>' : ''}
                </figure>
                
                <div class="card-content">
                    <div class="card-meta">
                        <div class="meta-item">
                            <ion-icon name="calendar-outline"></ion-icon>
                            <span>${publishedDate}</span>
                        </div>
                        <div class="meta-item">
                            <ion-icon name="person-outline"></ion-icon>
                            <span>${article.author?.fullName || article.author?.username || 'Admin'}</span>
                        </div>
                    </div>
                    
                    <h3 class="h3 card-title">
                        <a href="article-detail.html?slug=${article.slug}">${article.title}</a>
                    </h3>
                    
                    <p class="card-text">${article.summary || article.content?.substring(0, 150) + '...' || ''}</p>
                    
                    <div class="card-footer">
                        <a href="article-detail.html?slug=${article.slug}" class="read-more-btn">
                            Đọc thêm
                        </a>
                        <div class="view-count">
                            <ion-icon name="eye-outline"></ion-icon>
                            <span>${article.viewCount || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }    
    renderTagOptions(tags) {
        // Clear existing options except the first "All" option
        const defaultOption = this.tagSelect.querySelector('option[value=""]');
        this.tagSelect.innerHTML = '';
        this.tagSelect.appendChild(defaultOption);
        
        // Add tag options
        tags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            this.tagSelect.appendChild(option);
        });
    }renderSidebarArticles(articles, container) {
        if (!articles || articles.length === 0) {
            container.innerHTML = '<p>Không có bài viết nào.</p>';
            return;
        }

        container.innerHTML = articles.map(article => {
            const publishedDate = new Date(article.publishedAt || article.createdAt).toLocaleDateString('vi-VN');
            const defaultImage = './assets/images/img8.jpg';
            const articleImage = article.featuredImageUrl ? `http://localhost:8080${article.featuredImageUrl}` : defaultImage;

            return `
                <div class="sidebar-article-item">
                    <div class="article-thumb">
                        <img src="${articleImage}" alt="${article.title}" loading="lazy"
                             onerror="this.src='${defaultImage}'">
                    </div>
                    <div class="article-info">
                        <h4 class="article-title">
                            <a href="article-detail.html?slug=${article.slug}">${article.title}</a>
                        </h4>
                        <div class="article-meta">
                            <div class="meta-item">
                                <ion-icon name="calendar-outline"></ion-icon>
                                <span>${publishedDate}</span>
                            </div>
                            <div class="meta-item">
                                <ion-icon name="eye-outline"></ion-icon>
                                <span>${article.viewCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderPagination(data) {
        const totalPages = data.totalPages || 1;
        const currentPage = data.number + 1; // API uses 0-based pagination
        
        if (totalPages <= 1) {
            this.pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} 
                    onclick="articlesManager.goToPage(${currentPage - 1})">
                <ion-icon name="chevron-back-outline"></ion-icon>
            </button>
        `;
        
        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="articlesManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="articlesManager.goToPage(${i})">${i}</button>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="articlesManager.goToPage(${totalPages})">${totalPages}</button>`;
        }
        
        // Next button
        paginationHTML += `
            <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="articlesManager.goToPage(${currentPage + 1})">
                <ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
        `;
        
        this.pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadArticles();
        
        // Scroll to top of articles section
        document.querySelector('.articles-section').scrollIntoView({
            behavior: 'smooth'
        });
    }

    updateArticlesCount(total) {
        const start = (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, total);
        
        if (total === 0) {
            this.articlesCount.textContent = 'Không tìm thấy bài viết nào';
        } else {
            this.articlesCount.textContent = `Hiển thị ${start}-${end} trong tổng số ${total} bài viết`;
        }
    }

    showLoading() {
        this.loadingContainer.style.display = 'flex';
        this.articlesGrid.style.display = 'none';
        this.emptyState.style.display = 'none';
    }

    hideLoading() {
        this.loadingContainer.style.display = 'none';
        this.articlesGrid.style.display = 'grid';
    }

    showEmptyState() {
        this.emptyState.style.display = 'block';
        this.articlesGrid.style.display = 'none';
    }

    hideEmptyState() {
        this.emptyState.style.display = 'none';
    }

    showError(message) {
        showToast(message, 'error');
        this.hideLoading();
        this.showEmptyState();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for API_BASE_URL to be available
    if (typeof API_BASE_URL === 'undefined') {
        console.error('API_BASE_URL is not defined');
        return;
    }
    
    window.articlesManager = new ArticlesManager();
});

// Utility functions for articles
function shareArticle(platform, url, title) {
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

// Search functionality for mobile
function toggleMobileSearch() {
    const searchBox = document.querySelector('.search-box');
    searchBox.classList.toggle('mobile-active');
}

// Filter toggle for mobile
function toggleMobileFilter() {
    const filterWrapper = document.querySelector('.filter-wrapper');
    filterWrapper.classList.toggle('mobile-active');
}

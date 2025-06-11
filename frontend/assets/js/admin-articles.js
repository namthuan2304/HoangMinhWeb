// Admin Articles Management JavaScript

class AdminArticles {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 0;
        this.totalItems = 0;
        this.currentSort = 'createdAt,desc';
        this.currentFilters = {};
        this.selectedArticles = new Set();
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadArticles();
        this.loadStats();
    }

    bindEvents() {
        // Filter events
        document.getElementById('searchInput').addEventListener('input', 
            this.debounce(() => this.handleSearch(), 500));
        
        document.getElementById('statusFilter').addEventListener('change', 
            () => this.handleFilterChange());
        
        document.getElementById('sortSelect').addEventListener('change', 
            () => this.handleSortChange());

        // Action buttons
        document.getElementById('refreshBtn').addEventListener('click', 
            () => this.refreshData());
        
        document.getElementById('createArticleBtn').addEventListener('click', 
            () => this.goToCreateArticle());

        // Select all checkbox
        document.getElementById('selectAllCheckbox').addEventListener('change', 
            (e) => this.handleSelectAll(e.target.checked));

        // Bulk actions
        document.getElementById('bulkDeleteBtn').addEventListener('click', 
            () => this.showBulkDeleteModal());

        // Modal events
        this.bindModalEvents();
    }

    bindModalEvents() {
        // Delete modal
        const deleteModal = document.getElementById('deleteModal');
        const deleteModalClose = document.getElementById('deleteModalClose');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        deleteModalClose.addEventListener('click', () => this.hideModal('deleteModal'));
        cancelDeleteBtn.addEventListener('click', () => this.hideModal('deleteModal'));
        confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());

        // Bulk delete modal
        const bulkDeleteModal = document.getElementById('bulkDeleteModal');
        const bulkDeleteModalClose = document.getElementById('bulkDeleteModalClose');
        const cancelBulkDeleteBtn = document.getElementById('cancelBulkDeleteBtn');
        const confirmBulkDeleteBtn = document.getElementById('confirmBulkDeleteBtn');

        bulkDeleteModalClose.addEventListener('click', () => this.hideModal('bulkDeleteModal'));
        cancelBulkDeleteBtn.addEventListener('click', () => this.hideModal('bulkDeleteModal'));
        confirmBulkDeleteBtn.addEventListener('click', () => this.confirmBulkDelete());

        // Article detail modal
        const articleDetailModal = document.getElementById('articleDetailModal');
        const articleDetailModalClose = document.getElementById('articleDetailModalClose');
        const closeDetailBtn = document.getElementById('closeDetailBtn');
        const editFromDetailBtn = document.getElementById('editFromDetailBtn');

        articleDetailModalClose.addEventListener('click', () => this.hideModal('articleDetailModal'));
        closeDetailBtn.addEventListener('click', () => this.hideModal('articleDetailModal'));
        editFromDetailBtn.addEventListener('click', () => this.editFromDetail());
    }    async loadArticles() {
        try {
            this.showLoading();
            
            const params = {
                page: this.currentPage - 1,
                size: this.itemsPerPage,
                sort: this.currentSort,
                ...this.currentFilters
            };

            const response = await window.apiClient.getAdminArticles(params);
            console.log('Articles response:', response); // Debug log
            
            // Handle different response structures
            let articlesData;
            if (response.success && response.data) {
                articlesData = response.data;
            } else if (response.content) {
                // Direct Spring Boot PageResponse
                articlesData = response;
            } else if (Array.isArray(response)) {
                // Direct array response
                articlesData = {
                    content: response,
                    totalElements: response.length,
                    totalPages: Math.ceil(response.length / this.itemsPerPage),
                    number: this.currentPage - 1,
                    size: this.itemsPerPage
                };
            } else {
                throw new Error('Invalid response format');
            }

            this.renderArticles(articlesData.content || []);
            this.updatePagination(articlesData);
            
        } catch (error) {
            console.error('Error loading articles:', error);
            this.showToast('Có lỗi xảy ra khi tải danh sách bài viết: ' + error.message, 'error');
            // Show empty state on error
            this.renderArticles([]);
        } finally {
            this.hideLoading();
        }
    }    async loadStats() {
        try {
            const response = await window.apiClient.getAdminArticles({ size: 1000 });
            console.log('Stats response:', response); // Debug log
            
            let articles = [];
            if (response.success && response.data && response.data.content) {
                articles = response.data.content;
            } else if (response.content) {
                articles = response.content;
            } else if (Array.isArray(response)) {
                articles = response;
            }          
            const published = articles.filter(a => a.isPublished).length;
            const drafts = articles.filter(a => !a.isPublished).length;
            const totalViews = articles.reduce((sum, a) => sum + (a.viewCount || 0), 0);

            document.getElementById('publishedCount').textContent = published;
            document.getElementById('draftCount').textContent = drafts;
            document.getElementById('totalCount').textContent = articles.length;
            document.getElementById('totalViews').textContent = this.formatNumber(totalViews);
        } catch (error) {
            console.error('Error loading stats:', error);
            // Set default values on error
            document.getElementById('publishedCount').textContent = '0';
            document.getElementById('draftCount').textContent = '0';
            document.getElementById('totalCount').textContent = '0';
            document.getElementById('totalViews').textContent = '0';
        }
    }

    renderArticles(articles) {
        const tbody = document.getElementById('articlesTableBody');
        
        if (!articles || articles.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="8">
                        <div class="empty-state">
                            <ion-icon name="document-text-outline"></ion-icon>
                            <h3>Chưa có bài viết nào</h3>
                            <p>Hãy tạo bài viết đầu tiên của bạn</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = articles.map(article => `
            <tr data-id="${article.id}">
                <td class="checkbox-col">
                    <label class="checkbox-wrapper">
                        <input type="checkbox" class="article-checkbox" value="${article.id}">
                        <span class="checkmark"></span>
                    </label>
                </td>
                <td>
                    <div class="article-cell">
                        <img src="${this.getArticleImage(article)}" alt="${article.title}" class="article-thumbnail">
                        <div class="article-info">
                            <h4 class="article-title" onclick="adminArticles.showArticleDetail(${article.id})">${article.title}</h4>
                            <p class="article-summary">${article.summary || 'Không có tóm tắt'}</p>
                            ${this.renderTags(article.tags)}
                        </div>
                    </div>
                </td>                <td>
                    <div class="author-cell">
                        <div class="author-avatar">
                            ${this.getAuthorInitials(article.author?.fullName || article.author?.username)}
                        </div>
                        <div class="author-info">
                            <p class="author-name">${article.author?.fullName || article.author?.username || 'Unknown'}</p>
                            <p class="author-role">Tác giả</p>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${article.isPublished ? 'published' : 'draft'}">
                        <ion-icon name="${article.isPublished ? 'checkmark-circle-outline' : 'document-outline'}"></ion-icon>
                        ${article.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                </td>
                <td>
                    <div class="view-count">
                        <ion-icon name="eye-outline"></ion-icon>
                        <span>${this.formatNumber(article.viewCount || 0)}</span>
                    </div>
                </td>
                <td class="date-cell">${this.formatDate(article.createdAt)}</td>
                <td class="date-cell">${this.formatDate(article.updatedAt)}</td>
                <td class="actions-col">
                    <div class="action-buttons">
                        <button class="btn-icon btn-view" onclick="adminArticles.showArticleDetail(${article.id})" title="Xem chi tiết">
                            <ion-icon name="eye-outline"></ion-icon>
                        </button>                        <button class="btn-icon btn-edit" onclick="adminArticles.editArticle(${article.id})" title="Chỉnh sửa">
                            <ion-icon name="create-outline"></ion-icon>
                        </button>
                        ${!article.isPublished ? 
                            `<button class="btn-icon btn-publish" onclick="adminArticles.publishArticle(${article.id})" title="Xuất bản">
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                            </button>` : ''
                        }
                        <button class="btn-icon btn-delete" onclick="adminArticles.deleteArticle(${article.id})" title="Xóa">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Bind checkbox events
        this.bindCheckboxEvents();
    }

    bindCheckboxEvents() {
        const checkboxes = document.querySelectorAll('.article-checkbox');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                const articleId = parseInt(e.target.value);
                if (e.target.checked) {
                    this.selectedArticles.add(articleId);
                } else {
                    this.selectedArticles.delete(articleId);
                }
                this.updateBulkActions();
            });
        });
    }

    updateBulkActions() {
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        
        if (this.selectedArticles.size > 0) {
            bulkDeleteBtn.style.display = 'inline-flex';
            bulkDeleteBtn.querySelector('span').textContent = `Xóa đã chọn (${this.selectedArticles.size})`;
        } else {
            bulkDeleteBtn.style.display = 'none';
        }

        // Update select all checkbox state
        const allCheckboxes = document.querySelectorAll('.article-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.article-checkbox:checked');
        
        if (checkedCheckboxes.length === 0) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = false;
        } else if (checkedCheckboxes.length === allCheckboxes.length) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = true;
        } else {
            selectAllCheckbox.indeterminate = true;
        }
    }

    handleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.article-checkbox');
        this.selectedArticles.clear();
        
        checkboxes.forEach(cb => {
            cb.checked = checked;
            if (checked) {
                this.selectedArticles.add(parseInt(cb.value));
            }
        });
        
        this.updateBulkActions();
    }

    renderTags(tags) {
        if (!tags || tags.length === 0) return '';
        
        const tagArray = Array.isArray(tags) ? tags : tags.split(',');
        return `
            <div class="article-tags">
                ${tagArray.slice(0, 3).map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
                ${tagArray.length > 3 ? `<span class="tag">+${tagArray.length - 3}</span>` : ''}
            </div>
        `;
    }    getArticleImage(article) {
        if (article.featuredImageUrl) {
            return window.apiClient.getFullImageUrl(article.featuredImageUrl);
        }
        
        // Use a placeholder service instead of local image
        return `https://via.placeholder.com/200x120/f3f4f6/6b7280?text=${encodeURIComponent(article.title || 'Article')}`;
    }

    getAuthorInitials(name) {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    updatePagination(pageData) {
        this.totalPages = pageData.totalPages;
        this.totalItems = pageData.totalElements;
        this.currentPage = pageData.number + 1;

        // Update pagination info
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
        document.getElementById('paginationInfo').textContent = 
            `Hiển thị ${start} - ${end} của ${this.totalItems} bài viết`;

        // Update pagination buttons
        this.renderPagination();
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        let html = '';

        // Previous button
        html += `
            <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="adminArticles.goToPage(${this.currentPage - 1})">
                <ion-icon name="chevron-back-outline"></ion-icon>
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="adminArticles.goToPage(1)">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="adminArticles.goToPage(${i})">${i}</button>
            `;
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
            html += `<button class="pagination-btn" onclick="adminArticles.goToPage(${this.totalPages})">${this.totalPages}</button>`;
        }

        // Next button
        html += `
            <button class="pagination-btn ${this.currentPage === this.totalPages ? 'disabled' : ''}" 
                    ${this.currentPage === this.totalPages ? 'disabled' : ''} 
                    onclick="adminArticles.goToPage(${this.currentPage + 1})">
                <ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
        `;

        pagination.innerHTML = html;
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.currentPage = page;
            this.loadArticles();
        }
    }

    handleSearch() {
        const searchTerm = document.getElementById('searchInput').value.trim();
        if (searchTerm) {
            this.currentFilters.search = searchTerm;
        } else {
            delete this.currentFilters.search;
        }
        this.currentPage = 1;
        this.loadArticles();
    }    handleFilterChange() {
        const status = document.getElementById('statusFilter').value;
        if (status) {
            // Convert string to boolean for backend
            if (status === 'true') {
                this.currentFilters.published = true;
            } else if (status === 'false') {
                this.currentFilters.published = false;
            }
        } else {
            delete this.currentFilters.published;
        }
        this.currentPage = 1;
        this.loadArticles();
    }

    handleSortChange() {
        this.currentSort = document.getElementById('sortSelect').value;
        this.currentPage = 1;
        this.loadArticles();
    }

    async refreshData() {
        await this.loadArticles();
        await this.loadStats();
        this.showToast('Dữ liệu đã được làm mới', 'success');
    }

    goToCreateArticle() {
        window.location.href = 'article-create.html';
    }

    editArticle(id) {
        window.location.href = `article-edit.html?id=${id}`;
    }    async showArticleDetail(id) {
        try {
            this.showLoading();
            const response = await window.apiClient.getArticleById(id);
            console.log('Article detail response:', response); // Debug log
            
            let article;
            if (response.success && response.data) {
                article = response.data;
            } else if (response.id) {
                // Direct article object
                article = response;
            } else {
                throw new Error('Article not found');
            }

            this.renderArticleDetail(article);
            this.showModal('articleDetailModal');
            this.currentDetailArticleId = id;
        } catch (error) {
            console.error('Error loading article detail:', error);
            this.showToast('Có lỗi xảy ra khi tải chi tiết bài viết: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderArticleDetail(article) {
        const content = document.getElementById('articleDetailContent');
        content.innerHTML = `
            <div class="article-detail">
                <div class="article-detail-header">
                    <h2 class="article-detail-title">${article.title}</h2>                    <div class="article-detail-meta">
                        <span><ion-icon name="person-outline"></ion-icon> ${article.author?.fullName || article.author?.username || 'Unknown'}</span>
                        <span><ion-icon name="calendar-outline"></ion-icon> ${this.formatDate(article.createdAt)}</span>
                        <span><ion-icon name="eye-outline"></ion-icon> ${this.formatNumber(article.viewCount || 0)} lượt xem</span>
                        <span class="status-badge ${article.isPublished ? 'published' : 'draft'}">
                            <ion-icon name="${article.isPublished ? 'checkmark-circle-outline' : 'document-outline'}"></ion-icon>
                            ${article.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                        </span>
                    </div>
                </div>
                
                ${article.featuredImage ? `
                    <img src="${this.getArticleImage(article)}" alt="${article.title}" class="article-detail-image">
                ` : ''}
                
                ${article.summary ? `
                    <div class="article-summary">
                        <strong>Tóm tắt:</strong> ${article.summary}
                    </div>
                ` : ''}
                
                <div class="article-detail-content">
                    ${article.content || 'Không có nội dung'}
                </div>
                
                ${article.tags && article.tags.length > 0 ? `
                    <div class="article-detail-tags">
                        <strong>Tags:</strong>
                        ${this.renderTags(article.tags)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    editFromDetail() {
        if (this.currentDetailArticleId) {
            this.hideModal('articleDetailModal');
            this.editArticle(this.currentDetailArticleId);
        }
    }

    async publishArticle(id) {
        try {
            this.showLoading();
            const response = await window.apiClient.publishArticle(id);
            
            // Handle different success response formats
            if (response === true || (response && (response.success === true || response.success === undefined))) {
                this.showToast('Bài viết đã được xuất bản', 'success');
                await this.loadArticles();
                await this.loadStats();
            } else {
                throw new Error(response.message || 'Không thể xuất bản bài viết');
            }
        } catch (error) {
            console.error('Error publishing article:', error);
            this.showToast('Có lỗi xảy ra khi xuất bản bài viết: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    deleteArticle(id) {
        this.articleToDelete = id;
        this.showModal('deleteModal');
    }

    async confirmDelete() {
        try {
            this.hideModal('deleteModal');
            this.showLoading();
            
            const response = await window.apiClient.deleteArticle(this.articleToDelete);
            
            // Handle different success response formats
            if (response === true || (response && (response.success === true || response.success === undefined))) {
                this.showToast('Bài viết đã được xóa', 'success');
                await this.loadArticles();
                await this.loadStats();
            } else {
                throw new Error(response.message || 'Không thể xóa bài viết');
            }
        } catch (error) {
            console.error('Error deleting article:', error);
            this.showToast('Có lỗi xảy ra khi xóa bài viết: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    showBulkDeleteModal() {
        document.getElementById('selectedCount').textContent = this.selectedArticles.size;
        this.showModal('bulkDeleteModal');
    }

    async confirmBulkDelete() {
        try {
            this.hideModal('bulkDeleteModal');
            this.showLoading();
            
            const deletePromises = Array.from(this.selectedArticles).map(async id => {
                try {
                    return await window.apiClient.deleteArticle(id);
                } catch (error) {
                    console.error(`Error deleting article ${id}:`, error);
                    return false;
                }
            });
            
            await Promise.all(deletePromises);
            
            this.selectedArticles.clear();
            this.showToast('Các bài viết đã được xóa', 'success');
            await this.loadArticles();
            await this.loadStats();
            this.updateBulkActions();
        } catch (error) {
            console.error('Error bulk deleting articles:', error);
            this.showToast('Có lỗi xảy ra khi xóa bài viết: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Utility methods
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type} show`;
        toast.innerHTML = `
            <div class="toast-icon">
                <ion-icon name="${this.getToastIcon(type)}"></ion-icon>
            </div>
            <div class="toast-content">
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close">
                <ion-icon name="close-outline"></ion-icon>
            </button>
        `;

        const container = document.getElementById('toastContainer');
        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }

    getToastIcon(type) {
        const icons = {
            success: 'checkmark-circle-outline',
            error: 'alert-circle-outline',
            warning: 'warning-outline',
            info: 'information-circle-outline'
        };
        return icons[type] || icons.info;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatNumber(num) {
        return new Intl.NumberFormat('vi-VN').format(num);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminArticles = new AdminArticles();
});

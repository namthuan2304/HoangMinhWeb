/**
 * Admin Articles Management
 */
class AdminArticles {
    constructor() {
        this.currentPage = 0;
        this.pageSize = 10;
        this.totalPages = 0;
        this.totalElements = 0;
        this.currentFilters = {
            keyword: '',
            published: '',
            sortBy: 'createdAt',
            sortDir: 'desc'
        };
        this.selectedArticles = new Set();
        this.articles = [];
        this.stats = {
            published: 0,
            draft: 0,
            total: 0,
            totalViews: 0
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadArticles();
        this.loadStats();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.currentFilters.keyword = e.target.value.trim();
                this.currentPage = 0;
                this.loadArticles();
            }, 500);
        });

        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        statusFilter?.addEventListener('change', (e) => {
            this.currentFilters.published = e.target.value;
            this.currentPage = 0;
            this.loadArticles();
        });

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        sortSelect?.addEventListener('change', (e) => {
            const [sortBy, sortDir] = e.target.value.split(',');
            this.currentFilters.sortBy = sortBy;
            this.currentFilters.sortDir = sortDir;
            this.currentPage = 0;
            this.loadArticles();
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn?.addEventListener('click', () => {
            this.refreshData();
        });

        // Create article button
        const createArticleBtn = document.getElementById('createArticleBtn');
        createArticleBtn?.addEventListener('click', () => {
            this.navigateToCreate();
        });

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        selectAllCheckbox?.addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });

        // Bulk delete button
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        bulkDeleteBtn?.addEventListener('click', () => {
            this.showBulkDeleteModal();
        });

        // Modal event listeners
        this.setupModalEventListeners();
    }

    setupModalEventListeners() {
        // Delete modal
        const deleteModal = document.getElementById('deleteModal');
        const deleteModalClose = document.getElementById('deleteModalClose');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        [deleteModalClose, cancelDeleteBtn]?.forEach(btn => {
            btn?.addEventListener('click', () => {
                this.hideModal('deleteModal');
            });
        });

        confirmDeleteBtn?.addEventListener('click', () => {
            this.confirmDelete();
        });

        // Bulk delete modal
        const bulkDeleteModal = document.getElementById('bulkDeleteModal');
        const bulkDeleteModalClose = document.getElementById('bulkDeleteModalClose');
        const cancelBulkDeleteBtn = document.getElementById('cancelBulkDeleteBtn');
        const confirmBulkDeleteBtn = document.getElementById('confirmBulkDeleteBtn');

        [bulkDeleteModalClose, cancelBulkDeleteBtn]?.forEach(btn => {
            btn?.addEventListener('click', () => {
                this.hideModal('bulkDeleteModal');
            });
        });

        confirmBulkDeleteBtn?.addEventListener('click', () => {
            this.confirmBulkDelete();
        });

        // Article detail modal
        const articleDetailModal = document.getElementById('articleDetailModal');
        const articleDetailModalClose = document.getElementById('articleDetailModalClose');
        const closeDetailBtn = document.getElementById('closeDetailBtn');
        const editFromDetailBtn = document.getElementById('editFromDetailBtn');

        [articleDetailModalClose, closeDetailBtn]?.forEach(btn => {
            btn?.addEventListener('click', () => {
                this.hideModal('articleDetailModal');
            });
        });

        editFromDetailBtn?.addEventListener('click', () => {
            const articleId = this.currentDetailArticle?.id;
            if (articleId) {
                this.navigateToEdit(articleId);
            }
        });

        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });
    }

    async loadArticles() {
        try {
            this.showLoading();
            
            const params = {
                page: this.currentPage,
                size: this.pageSize,
                sortBy: this.currentFilters.sortBy,
                sortDir: this.currentFilters.sortDir
            };

            if (this.currentFilters.keyword) {
                params.keyword = this.currentFilters.keyword;
            }

            if (this.currentFilters.published !== '') {
                params.published = this.currentFilters.published === 'true';
            }

            const response = await apiClient.getAllArticles(params);
            
            if (response.success) {
                this.articles = response.data.content || [];
                this.totalPages = response.data.totalPages || 0;
                this.totalElements = response.data.totalElements || 0;
                
                this.renderArticles();
                this.renderPagination();
                this.updateSelectAllCheckbox();
            } else {
                throw new Error(response.message || 'Không thể tải danh sách bài viết');
            }
        } catch (error) {
            console.error('Error loading articles:', error);
            this.showToast('Lỗi khi tải danh sách bài viết', 'error');
            this.renderError();
        } finally {
            this.hideLoading();
        }
    }

    async loadStats() {
        try {            // Load all articles to calculate stats
            const response = await apiClient.getAllArticles({ 
                page: 0, size: 1000 
            });
            
            if (response.success) {
                const allArticles = response.data.content || [];
                this.calculateStats(allArticles);
                this.renderStats();
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    calculateStats(articles) {
        this.stats = {
            published: articles.filter(a => a.isPublished).length,
            draft: articles.filter(a => !a.isPublished).length,
            total: articles.length,
            totalViews: articles.reduce((sum, a) => sum + (a.viewCount || 0), 0)
        };
    }

    renderStats() {
        const publishedCount = document.getElementById('publishedCount');
        const draftCount = document.getElementById('draftCount');
        const totalCount = document.getElementById('totalCount');
        const totalViews = document.getElementById('totalViews');

        if (publishedCount) publishedCount.textContent = this.stats.published.toLocaleString();
        if (draftCount) draftCount.textContent = this.stats.draft.toLocaleString();
        if (totalCount) totalCount.textContent = this.stats.total.toLocaleString();
        if (totalViews) totalViews.textContent = this.stats.totalViews.toLocaleString();
    }

    renderArticles() {
        const tbody = document.getElementById('articlesTableBody');
        if (!tbody) return;

        if (this.articles.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <ion-icon name="document-outline"></ion-icon>
                        <h3>Không có bài viết nào</h3>
                        <p>Chưa có bài viết nào được tạo hoặc không tìm thấy bài viết phù hợp với bộ lọc.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.articles.map(article => this.createArticleRow(article)).join('');
        
        // Add event listeners for action buttons
        this.setupRowEventListeners();
    }

    createArticleRow(article) {
        const isSelected = this.selectedArticles.has(article.id);
        const thumbnailUrl = article.featuredImageUrl 
            ? `http://localhost:8080${article.featuredImageUrl}` 
            : '../assets/images/default-tour.jpg';
        
        const authorInitial = article.author?.fullName?.charAt(0).toUpperCase() || 
                             article.author?.username?.charAt(0).toUpperCase() || 'A';
        
        const tags = article.tags?.slice(0, 3) || [];
        const tagsHtml = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        
        const createdDate = new Date(article.createdAt).toLocaleDateString('vi-VN');
        const updatedDate = new Date(article.updatedAt).toLocaleDateString('vi-VN');

        return `
            <tr data-article-id="${article.id}">
                <td class="checkbox-col">
                    <label class="checkbox-wrapper">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} 
                               onchange="adminArticles.toggleSelectArticle(${article.id}, this.checked)">
                        <span class="checkmark"></span>
                    </label>
                </td>
                <td>
                    <div class="article-cell">
                        <img src="${thumbnailUrl}" alt="${article.title}" class="article-thumbnail"
                             onerror="this.src='../assets/images/default-tour.jpg'">
                        <div class="article-info">
                            <h4 class="article-title" onclick="adminArticles.showArticleDetail(${article.id})">
                                ${article.title}
                            </h4>
                            <p class="article-summary">${article.summary || 'Không có tóm tắt'}</p>
                            <div class="article-tags">${tagsHtml}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="author-cell">
                        <div class="author-avatar">${authorInitial}</div>
                        <div class="author-info">
                            <p class="author-name">${article.author?.fullName || article.author?.username || 'Admin'}</p>
                            <p class="author-role">Tác giả</p>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${article.isPublished ? 'published' : 'draft'}">
                        <ion-icon name="${article.isPublished ? 'checkmark-circle' : 'document'}-outline"></ion-icon>
                        ${article.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                </td>
                <td>
                    <div class="view-count">
                        <ion-icon name="eye-outline"></ion-icon>
                        <span>${(article.viewCount || 0).toLocaleString()}</span>
                    </div>
                </td>
                <td class="date-cell">${createdDate}</td>
                <td class="date-cell">${updatedDate}</td>
                <td class="actions-col">
                    <div class="action-buttons">
                        <button class="btn-icon btn-view" onclick="adminArticles.showArticleDetail(${article.id})" 
                                title="Xem chi tiết">
                            <ion-icon name="eye-outline"></ion-icon>
                        </button>
                        <button class="btn-icon btn-edit" onclick="adminArticles.navigateToEdit(${article.id})" 
                                title="Chỉnh sửa">
                            <ion-icon name="create-outline"></ion-icon>
                        </button>
                        ${article.isPublished 
                            ? `<button class="btn-icon btn-publish" onclick="adminArticles.togglePublishStatus(${article.id}, false)" 
                                       title="Gỡ xuất bản">
                                   <ion-icon name="close-circle-outline"></ion-icon>
                               </button>`
                            : `<button class="btn-icon btn-publish" onclick="adminArticles.togglePublishStatus(${article.id}, true)" 
                                       title="Xuất bản">
                                   <ion-icon name="checkmark-circle-outline"></ion-icon>
                               </button>`
                        }
                        <button class="btn-icon btn-delete" onclick="adminArticles.showDeleteModal(${article.id})" 
                                title="Xóa">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    setupRowEventListeners() {
        // Event listeners are handled via onclick attributes in the HTML
        // This method can be used for additional row-level event handling if needed
    }

    renderPagination() {
        const paginationInfo = document.getElementById('paginationInfo');
        const pagination = document.getElementById('pagination');

        if (!paginationInfo || !pagination) return;

        // Update pagination info
        const start = this.currentPage * this.pageSize + 1;
        const end = Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
        paginationInfo.textContent = `Hiển thị ${start} - ${end} của ${this.totalElements} bài viết`;

        // Generate pagination buttons
        let paginationHtml = '';

        // Previous button
        paginationHtml += `
            <button class="pagination-btn ${this.currentPage === 0 ? 'disabled' : ''}" 
                    onclick="adminArticles.goToPage(${this.currentPage - 1})" 
                    ${this.currentPage === 0 ? 'disabled' : ''}>
                <ion-icon name="chevron-back-outline"></ion-icon>
            </button>
        `;

        // Page numbers
        const startPage = Math.max(0, this.currentPage - 2);
        const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);

        if (startPage > 0) {
            paginationHtml += `<button class="pagination-btn" onclick="adminArticles.goToPage(0)">1</button>`;
            if (startPage > 1) {
                paginationHtml += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="adminArticles.goToPage(${i})">
                    ${i + 1}
                </button>
            `;
        }

        if (endPage < this.totalPages - 1) {
            if (endPage < this.totalPages - 2) {
                paginationHtml += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHtml += `<button class="pagination-btn" onclick="adminArticles.goToPage(${this.totalPages - 1})">${this.totalPages}</button>`;
        }

        // Next button
        paginationHtml += `
            <button class="pagination-btn ${this.currentPage >= this.totalPages - 1 ? 'disabled' : ''}" 
                    onclick="adminArticles.goToPage(${this.currentPage + 1})" 
                    ${this.currentPage >= this.totalPages - 1 ? 'disabled' : ''}>
                <ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
        `;

        pagination.innerHTML = paginationHtml;
    }

    goToPage(page) {
        if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
            this.currentPage = page;
            this.loadArticles();
        }
    }

    toggleSelectArticle(articleId, selected) {
        if (selected) {
            this.selectedArticles.add(articleId);
        } else {
            this.selectedArticles.delete(articleId);
        }
        
        this.updateSelectAllCheckbox();
        this.updateBulkDeleteButton();
    }

    toggleSelectAll(selectAll) {
        this.selectedArticles.clear();
        
        if (selectAll) {
            this.articles.forEach(article => {
                this.selectedArticles.add(article.id);
            });
        }
        
        // Update checkboxes in table
        const checkboxes = document.querySelectorAll('#articlesTableBody input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll;
        });
        
        this.updateBulkDeleteButton();
    }

    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (!selectAllCheckbox) return;

        const totalArticles = this.articles.length;
        const selectedCount = this.selectedArticles.size;

        if (selectedCount === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (selectedCount === totalArticles) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }

    updateBulkDeleteButton() {
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        if (!bulkDeleteBtn) return;

        if (this.selectedArticles.size > 0) {
            bulkDeleteBtn.style.display = 'flex';
        } else {
            bulkDeleteBtn.style.display = 'none';
        }
    }

    async showArticleDetail(articleId) {
        try {
            const article = this.articles.find(a => a.id === articleId);
            if (!article) return;            // Get full article details
            const response = await apiClient.getArticleById(articleId);
            
            if (response.success) {
                this.currentDetailArticle = response.data;
                this.renderArticleDetail(response.data);
                this.showModal('articleDetailModal');
            } else {
                throw new Error(response.message || 'Không thể tải chi tiết bài viết');
            }
        } catch (error) {
            console.error('Error loading article detail:', error);
            this.showToast('Lỗi khi tải chi tiết bài viết', 'error');
        }
    }

    renderArticleDetail(article) {
        const content = document.getElementById('articleDetailContent');
        if (!content) return;

        const thumbnailUrl = article.featuredImageUrl 
            ? `http://localhost:8080${article.featuredImageUrl}` 
            : '../assets/images/default-tour.jpg';

        const tags = article.tags || [];
        const tagsHtml = tags.map(tag => `<span class="tag">${tag}</span>`).join('');

        const createdDate = new Date(article.createdAt).toLocaleDateString('vi-VN', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        content.innerHTML = `
            <div class="article-detail">
                <div class="article-detail-header">
                    <h1 class="article-detail-title">${article.title}</h1>
                    <div class="article-detail-meta">
                        <span><ion-icon name="person-outline"></ion-icon> ${article.author?.fullName || article.author?.username || 'Admin'}</span>
                        <span><ion-icon name="calendar-outline"></ion-icon> ${createdDate}</span>
                        <span><ion-icon name="eye-outline"></ion-icon> ${(article.viewCount || 0).toLocaleString()} lượt xem</span>
                        <span class="status-badge ${article.isPublished ? 'published' : 'draft'}">
                            <ion-icon name="${article.isPublished ? 'checkmark-circle' : 'document'}-outline"></ion-icon>
                            ${article.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                        </span>
                    </div>
                </div>
                
                ${article.featuredImageUrl ? `<img src="${thumbnailUrl}" alt="${article.title}" class="article-detail-image">` : ''}
                
                ${article.summary ? `<div class="article-summary"><strong>Tóm tắt:</strong> ${article.summary}</div>` : ''}
                
                <div class="article-detail-content">
                    ${article.content || 'Không có nội dung'}
                </div>
                
                ${tags.length > 0 ? `
                    <div class="article-detail-tags">
                        <strong>Tags:</strong> ${tagsHtml}
                    </div>
                ` : ''}
            </div>
        `;
    }

    showDeleteModal(articleId) {
        this.articleToDelete = articleId;
        this.showModal('deleteModal');
    }

    async confirmDelete() {
        if (!this.articleToDelete) return;        try {
            const response = await apiClient.deleteArticle(this.articleToDelete);
            
            if (response.success) {
                this.showToast('Xóa bài viết thành công', 'success');
                this.hideModal('deleteModal');
                this.refreshData();
            } else {
                throw new Error(response.message || 'Không thể xóa bài viết');
            }
        } catch (error) {
            console.error('Error deleting article:', error);
            this.showToast('Lỗi khi xóa bài viết', 'error');
        }
    }

    showBulkDeleteModal() {
        const selectedCount = document.getElementById('selectedCount');
        if (selectedCount) {
            selectedCount.textContent = this.selectedArticles.size;
        }
        this.showModal('bulkDeleteModal');
    }

    async confirmBulkDelete() {
        const selectedIds = Array.from(this.selectedArticles);
          try {
            const promises = selectedIds.map(id => apiClient.deleteArticle(id));
            await Promise.all(promises);
            
            this.showToast(`Đã xóa ${selectedIds.length} bài viết thành công`, 'success');
            this.hideModal('bulkDeleteModal');
            this.selectedArticles.clear();
            this.refreshData();
        } catch (error) {
            console.error('Error bulk deleting articles:', error);
            this.showToast('Lỗi khi xóa bài viết', 'error');
        }
    }

    async togglePublishStatus(articleId, publish) {        try {
            const endpoint = publish ? 'publishArticle' : 'unpublishArticle';
            const response = await apiClient[endpoint](articleId);
            
            if (response.success) {
                const action = publish ? 'xuất bản' : 'gỡ xuất bản';
                this.showToast(`${action.charAt(0).toUpperCase() + action.slice(1)} bài viết thành công`, 'success');
                this.refreshData();
            } else {
                throw new Error(response.message || 'Không thể thay đổi trạng thái bài viết');
            }
        } catch (error) {
            console.error('Error toggling publish status:', error);
            this.showToast('Lỗi khi thay đổi trạng thái bài viết', 'error');
        }
    }

    navigateToCreate() {
        window.location.href = 'article-create.html';
    }

    navigateToEdit(articleId) {
        window.location.href = `article-edit.html?id=${articleId}`;
    }

    refreshData() {
        this.selectedArticles.clear();
        this.currentPage = 0;
        this.loadArticles();
        this.loadStats();
    }

    // Modal helpers
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Loading states
    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    renderError() {
        const tbody = document.getElementById('articlesTableBody');
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <h3>Lỗi khi tải dữ liệu</h3>
                    <p>Không thể tải danh sách bài viết. Vui lòng thử lại sau.</p>
                </td>
            </tr>
        `;
    }

    // Toast notifications
    showToast(message, type = 'info', title = '') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconName = {
            success: 'checkmark-circle-outline',
            error: 'alert-circle-outline',
            warning: 'warning-outline',
            info: 'information-circle-outline'
        }[type] || 'information-circle-outline';

        toast.innerHTML = `
            <ion-icon name="${iconName}" class="toast-icon"></ion-icon>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <ion-icon name="close-outline"></ion-icon>
            </button>
        `;

        container.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove after 5 seconds
        const autoRemove = setTimeout(() => {
            this.removeToast(toast);
        }, 5000);

        // Manual close
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.removeToast(toast);
        });
    }

    removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminArticles = new AdminArticles();
});

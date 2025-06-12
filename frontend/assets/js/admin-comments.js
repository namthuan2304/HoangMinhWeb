// Admin Comments Management
class AdminComments {
    constructor() {
        this.currentPage = 0;
        this.pageSize = 10;
        this.totalPages = 0;
        this.totalElements = 0;
        this.currentSort = 'createdAt,desc';
        this.currentFilters = {
            status: '',
            rating: '',
            search: ''
        };
        
        this.selectedComments = new Set();
        this.comments = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStats();
        this.loadComments();
    }

    bindEvents() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.search = e.target.value;
                    this.currentPage = 0;
                    this.loadComments();
                }, 500);
            });
        }

        // Filter selects
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.currentPage = 0;
                this.loadComments();
            });
        }

        const ratingFilter = document.getElementById('ratingFilter');
        if (ratingFilter) {
            ratingFilter.addEventListener('change', (e) => {
                this.currentFilters.rating = e.target.value;
                this.currentPage = 0;
                this.loadComments();
            });
        }

        const sortFilter = document.getElementById('sortFilter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.currentPage = 0;
                this.loadComments();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportComments());
        }

        // Select all checkbox
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        // Bulk action buttons
        const bulkApproveBtn = document.getElementById('bulkApproveBtn');
        if (bulkApproveBtn) {
            bulkApproveBtn.addEventListener('click', () => this.bulkApprove());
        }

        const bulkRejectBtn = document.getElementById('bulkRejectBtn');
        if (bulkRejectBtn) {
            bulkRejectBtn.addEventListener('click', () => this.bulkReject());
        }

        // Pagination
        const prevPageBtn = document.getElementById('prevPageBtn');
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        }

        const nextPageBtn = document.getElementById('nextPageBtn');
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        }

        // Modal events
        this.bindModalEvents();
    }

    bindModalEvents() {
        // Comment detail modal
        const commentDetailModal = document.getElementById('commentDetailModal');
        const commentDetailModalClose = document.getElementById('commentDetailModalClose');
        const closeDetailBtn = document.getElementById('closeDetailBtn');

        if (commentDetailModalClose) {
            commentDetailModalClose.addEventListener('click', () => this.hideModal('commentDetailModal'));
        }
        if (closeDetailBtn) {
            closeDetailBtn.addEventListener('click', () => this.hideModal('commentDetailModal'));
        }

        // Approve modal
        const approveModalClose = document.getElementById('approveModalClose');
        const cancelApproveBtn = document.getElementById('cancelApproveBtn');
        const confirmApproveBtn = document.getElementById('confirmApproveBtn');

        if (approveModalClose) {
            approveModalClose.addEventListener('click', () => this.hideModal('approveModal'));
        }
        if (cancelApproveBtn) {
            cancelApproveBtn.addEventListener('click', () => this.hideModal('approveModal'));
        }
        if (confirmApproveBtn) {
            confirmApproveBtn.addEventListener('click', () => this.confirmApprove());
        }

        // Reject modal
        const rejectModalClose = document.getElementById('rejectModalClose');
        const cancelRejectBtn = document.getElementById('cancelRejectBtn');
        const confirmRejectBtn = document.getElementById('confirmRejectBtn');

        if (rejectModalClose) {
            rejectModalClose.addEventListener('click', () => this.hideModal('rejectModal'));
        }
        if (cancelRejectBtn) {
            cancelRejectBtn.addEventListener('click', () => this.hideModal('rejectModal'));
        }
        if (confirmRejectBtn) {
            confirmRejectBtn.addEventListener('click', () => this.confirmReject());
        }

        // Delete modal
        const deleteModalClose = document.getElementById('deleteModalClose');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        if (deleteModalClose) {
            deleteModalClose.addEventListener('click', () => this.hideModal('deleteModal'));
        }
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => this.hideModal('deleteModal'));
        }
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
        }

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.hideModal(e.target.id);
            }
        });
    }

    async loadStats() {        try {
            // Load total comments
            const totalResponse = await window.apiClient.get('/comments/admin?size=1');
            const totalComments = totalResponse.totalElements || 0;
            document.getElementById('totalComments').textContent = totalComments;

            // Load pending comments
            const pendingResponse = await window.apiClient.get('/comments/admin?isApproved=false&size=1');
            const pendingComments = pendingResponse.totalElements || 0;
            document.getElementById('pendingComments').textContent = pendingComments;

            // Load approved comments
            const approvedResponse = await window.apiClient.get('/comments/admin?isApproved=true&size=1');
            const approvedComments = approvedResponse.totalElements || 0;
            document.getElementById('approvedComments').textContent = approvedComments;

            // Calculate average rating (this would need a separate API endpoint)
            document.getElementById('averageRating').textContent = '4.2';

        } catch (error) {
            console.error('Error loading stats:', error);
            this.showToast('Không thể tải thống kê', 'error');
        }
    }

    async loadComments() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page: this.currentPage,
                size: this.pageSize,
                sortBy: this.currentSort.split(',')[0],
                sortDir: this.currentSort.split(',')[1]
            });

            if (this.currentFilters.status) {
                params.append('isApproved', this.currentFilters.status);
            }

            if (this.currentFilters.search) {
                params.append('search', this.currentFilters.search);
            }

            const response = await window.apiClient.get(`/comments/admin?${params}`);
            
            this.comments = response.content || [];
            this.totalPages = response.totalPages || 0;
            this.totalElements = response.totalElements || 0;
            
            this.renderComments();
            this.renderPagination();
            this.updateSelectionState();

        } catch (error) {
            console.error('Error loading comments:', error);
            this.showToast('Không thể tải danh sách bình luận', 'error');
            this.renderEmptyState();
        } finally {
            this.hideLoading();
        }
    }

    renderComments() {
        const tbody = document.querySelector('#commentsTable tbody');
        if (!tbody) return;

        if (this.comments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading-cell">
                        <ion-icon name="chatbubbles-outline" style="font-size: 2rem; color: #dee2e6; margin-bottom: 0.5rem;"></ion-icon>
                        <p>Không có bình luận nào</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.comments.map(comment => `
            <tr ${this.selectedComments.has(comment.id) ? 'class="selected"' : ''}>
                <td>
                    <input type="checkbox" ${this.selectedComments.has(comment.id) ? 'checked' : ''} 
                           onchange="adminComments.toggleCommentSelection(${comment.id}, this.checked)">
                </td>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">
                            ${comment.user.avatarUrl ? 
                                `<img src="${comment.user.avatarUrl}" alt="${comment.user.fullName}">` : 
                                `<ion-icon name="person-outline"></ion-icon>`
                            }
                        </div>
                        <div class="user-info">
                            <h4>${comment.user.fullName || comment.user.username}</h4>
                            <p>@${comment.user.username}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="comment-tour">
                        <strong>${comment.tour.name}</strong>
                        <div style="font-size: 0.75rem; color: #6c757d; margin-top: 0.25rem;">
                            ${comment.tour.destination}
                        </div>
                    </div>
                </td>
                <td>
                    <div class="comment-cell">
                        <div class="comment-content">${comment.content}</div>
                    </div>
                </td>
                <td>
                    <div class="rating-display">
                        <div class="rating-stars">
                            ${this.renderStars(comment.rating)}
                        </div>
                        <span class="rating-number">${comment.rating}</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${comment.isApproved ? 'approved' : 'pending'}">
                        ${comment.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                    </span>
                </td>
                <td>${this.formatDateTime(comment.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-view" onclick="adminComments.viewComment(${comment.id})" title="Xem chi tiết">
                            <ion-icon name="eye-outline"></ion-icon>
                        </button>
                        ${!comment.isApproved ? `
                            <button class="btn-icon btn-approve" onclick="adminComments.showApproveModal(${comment.id})" title="Phê duyệt">
                                <ion-icon name="checkmark-outline"></ion-icon>
                            </button>
                            <button class="btn-icon btn-reject" onclick="adminComments.showRejectModal(${comment.id})" title="Từ chối">
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        ` : ''}
                        <button class="btn-icon btn-delete" onclick="adminComments.showDeleteModal(${comment.id})" title="Xóa">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderStars(rating) {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars.push('<ion-icon name="star"></ion-icon>');
            } else {
                stars.push('<ion-icon name="star-outline"></ion-icon>');
            }
        }
        return stars.join('');
    }

    renderPagination() {
        const paginationInfo = document.getElementById('paginationInfo');
        const pageNumbers = document.getElementById('pageNumbers');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');

        if (!paginationInfo || !pageNumbers) return;

        // Update pagination info
        const start = this.currentPage * this.pageSize + 1;
        const end = Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
        paginationInfo.textContent = `Hiển thị ${start} - ${end} của ${this.totalElements} bình luận`;

        // Update navigation buttons
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages - 1;
        }

        // Render page numbers
        pageNumbers.innerHTML = this.generatePageNumbers();
    }

    generatePageNumbers() {
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(0, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(this.totalPages - 1, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(0, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button class="page-number ${i === this.currentPage ? 'active' : ''}" 
                        onclick="adminComments.goToPage(${i})">
                    ${i + 1}
                </button>
            `);
        }

        return pages.join('');
    }

    goToPage(page) {
        if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
            this.currentPage = page;
            this.loadComments();
        }
    }

    toggleCommentSelection(commentId, checked) {
        if (checked) {
            this.selectedComments.add(commentId);
        } else {
            this.selectedComments.delete(commentId);
        }
        this.updateSelectionState();
    }

    toggleSelectAll(checked) {
        if (checked) {
            this.comments.forEach(comment => {
                this.selectedComments.add(comment.id);
            });
        } else {
            this.selectedComments.clear();
        }
        this.renderComments();
        this.updateSelectionState();
    }

    updateSelectionState() {
        const selectAll = document.getElementById('selectAll');
        const bulkApproveBtn = document.getElementById('bulkApproveBtn');
        const bulkRejectBtn = document.getElementById('bulkRejectBtn');

        const hasSelection = this.selectedComments.size > 0;
        const allSelected = this.comments.length > 0 && this.selectedComments.size === this.comments.length;

        if (selectAll) {
            selectAll.checked = allSelected;
            selectAll.indeterminate = hasSelection && !allSelected;
        }

        if (bulkApproveBtn) {
            bulkApproveBtn.style.display = hasSelection ? 'flex' : 'none';
        }
        if (bulkRejectBtn) {
            bulkRejectBtn.style.display = hasSelection ? 'flex' : 'none';
        }
    }

    async viewComment(commentId) {
        const comment = this.comments.find(c => c.id === commentId);
        if (!comment) return;

        const content = document.getElementById('commentDetailContent');
        const actions = document.getElementById('commentActions');

        if (!content || !actions) return;

        content.innerHTML = `
            <div class="comment-detail">
                <div class="comment-header-detail">
                    <div class="user-avatar">
                        ${comment.user.avatarUrl ? 
                            `<img src="${comment.user.avatarUrl}" alt="${comment.user.fullName}">` : 
                            `<ion-icon name="person-outline"></ion-icon>`
                        }
                    </div>
                    <div class="user-info">
                        <h4>${comment.user.fullName || comment.user.username}</h4>
                        <p>@${comment.user.username}</p>
                    </div>
                    <div class="rating-display">
                        <div class="rating-stars">
                            ${this.renderStars(comment.rating)}
                        </div>
                        <span class="rating-number">${comment.rating}/5</span>
                    </div>
                </div>

                <div class="comment-meta">
                    <div class="meta-item">
                        <span><strong>Tour:</strong></span>
                        <span>${comment.tour.name}</span>
                    </div>
                    <div class="meta-item">
                        <span><strong>Điểm đến:</strong></span>
                        <span>${comment.tour.destination}</span>
                    </div>
                    <div class="meta-item">
                        <span><strong>Trạng thái:</strong></span>
                        <span class="status-badge ${comment.isApproved ? 'approved' : 'pending'}">
                            ${comment.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                        </span>
                    </div>
                    <div class="meta-item">
                        <span><strong>Ngày tạo:</strong></span>
                        <span>${this.formatDateTime(comment.createdAt)}</span>
                    </div>
                </div>

                <div class="comment-text">
                    ${comment.content}
                </div>
            </div>
        `;

        actions.innerHTML = `
            ${!comment.isApproved ? `
                <button class="btn btn-success" onclick="adminComments.approveComment(${comment.id})">
                    <ion-icon name="checkmark-outline"></ion-icon>
                    Phê duyệt
                </button>
                <button class="btn btn-outline" onclick="adminComments.showRejectModal(${comment.id})">
                    <ion-icon name="close-outline"></ion-icon>
                    Từ chối
                </button>
            ` : ''}
            <button class="btn btn-danger" onclick="adminComments.showDeleteModal(${comment.id})">
                <ion-icon name="trash-outline"></ion-icon>
                Xóa
            </button>
        `;

        this.showModal('commentDetailModal');
    }

    showApproveModal(commentId) {
        this.selectedCommentId = commentId;
        this.showModal('approveModal');
    }

    showRejectModal(commentId) {
        this.selectedCommentId = commentId;
        this.showModal('rejectModal');
    }

    showDeleteModal(commentId) {
        this.selectedCommentId = commentId;
        this.showModal('deleteModal');
    }

    async confirmApprove() {
        if (!this.selectedCommentId) return;

        try {
            this.hideModal('approveModal');
            this.showLoading();

            await window.apiClient.post(`/api/comments/${this.selectedCommentId}/approve`);
            
            this.showToast('Bình luận đã được phê duyệt', 'success');
            this.loadComments();
            this.loadStats();

        } catch (error) {
            console.error('Error approving comment:', error);
            this.showToast('Không thể phê duyệt bình luận', 'error');
        } finally {
            this.hideLoading();
            this.selectedCommentId = null;
        }
    }

    async confirmReject() {
        if (!this.selectedCommentId) return;

        try {
            this.hideModal('rejectModal');
            this.showLoading();

            await window.apiClient.post(`/api/comments/${this.selectedCommentId}/reject`);
            
            this.showToast('Bình luận đã được từ chối', 'success');
            this.loadComments();
            this.loadStats();

        } catch (error) {
            console.error('Error rejecting comment:', error);
            this.showToast('Không thể từ chối bình luận', 'error');
        } finally {
            this.hideLoading();
            this.selectedCommentId = null;
        }
    }

    async confirmDelete() {
        if (!this.selectedCommentId) return;

        try {
            this.hideModal('deleteModal');
            this.showLoading();

            await window.apiClient.delete(`/api/comments/${this.selectedCommentId}`);
            
            this.showToast('Bình luận đã được xóa', 'success');
            this.loadComments();
            this.loadStats();

        } catch (error) {
            console.error('Error deleting comment:', error);
            this.showToast('Không thể xóa bình luận', 'error');
        } finally {
            this.hideLoading();
            this.selectedCommentId = null;
        }
    }

    async approveComment(commentId) {
        try {
            this.hideModal('commentDetailModal');
            this.showLoading();

            await window.apiClient.post(`/api/comments/${commentId}/approve`);
            
            this.showToast('Bình luận đã được phê duyệt', 'success');
            this.loadComments();
            this.loadStats();

        } catch (error) {
            console.error('Error approving comment:', error);
            this.showToast('Không thể phê duyệt bình luận', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async bulkApprove() {
        if (this.selectedComments.size === 0) return;

        try {
            this.showLoading();
            
            const promises = Array.from(this.selectedComments).map(commentId =>
                window.apiClient.post(`/api/comments/${commentId}/approve`)
            );

            await Promise.all(promises);
            
            this.showToast(`Đã phê duyệt ${this.selectedComments.size} bình luận`, 'success');
            this.selectedComments.clear();
            this.loadComments();
            this.loadStats();

        } catch (error) {
            console.error('Error bulk approving comments:', error);
            this.showToast('Không thể phê duyệt các bình luận đã chọn', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async bulkReject() {
        if (this.selectedComments.size === 0) return;

        try {
            this.showLoading();
            
            const promises = Array.from(this.selectedComments).map(commentId =>
                window.apiClient.post(`/api/comments/${commentId}/reject`)
            );

            await Promise.all(promises);
            
            this.showToast(`Đã từ chối ${this.selectedComments.size} bình luận`, 'success');
            this.selectedComments.clear();
            this.loadComments();
            this.loadStats();

        } catch (error) {
            console.error('Error bulk rejecting comments:', error);
            this.showToast('Không thể từ chối các bình luận đã chọn', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async exportComments() {
        try {
            this.showLoading();
            
            // This would typically generate and download a CSV/Excel file
            this.showToast('Tính năng xuất báo cáo đang được phát triển', 'info');

        } catch (error) {
            console.error('Error exporting comments:', error);
            this.showToast('Không thể xuất báo cáo', 'error');
        } finally {
            this.hideLoading();
        }
    }

    refresh() {
        this.selectedComments.clear();
        this.currentPage = 0;
        this.loadStats();
        this.loadComments();
    }

    // Utility methods
    formatDateTime(dateString) {
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

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <ion-icon name="${this.getToastIcon(type)}"></ion-icon>
                <span>${message}</span>
            </div>
        `;

        // Add toast styles if not already added
        if (!document.getElementById('toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 9999;
                    animation: slideInRight 0.3s ease;
                }
                .toast-success { border-left: 4px solid #28a745; }
                .toast-error { border-left: 4px solid #dc3545; }
                .toast-warning { border-left: 4px solid #ffc107; }
                .toast-info { border-left: 4px solid #007bff; }
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
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

    renderEmptyState() {
        const tbody = document.querySelector('#commentsTable tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading-cell">
                        <ion-icon name="chatbubbles-outline" style="font-size: 3rem; color: #dee2e6; margin-bottom: 1rem;"></ion-icon>
                        <h4>Không có bình luận nào</h4>
                        <p>Chưa có bình luận nào trong hệ thống.</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.adminComments = new AdminComments();
});

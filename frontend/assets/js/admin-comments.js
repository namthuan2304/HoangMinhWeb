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
        this.currentCommentId = null;
        
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

    // Updated loadStats method to handle new status system
    async loadStats() {
        try {
            // Load total comments
            const totalResponse = await window.apiClient.get('/comments/admin?size=1');
            const totalComments = totalResponse.totalElements || 0;
            document.getElementById('totalComments').textContent = totalComments;

            // Load pending comments using new status system
            const pendingResponse = await window.apiClient.get('/comments/admin?status=PENDING&size=1');
            const pendingComments = pendingResponse.totalElements || 0;
            document.getElementById('pendingComments').textContent = pendingComments;

            // Load approved comments using new status system
            const approvedResponse = await window.apiClient.get('/comments/admin?status=APPROVED&size=1');
            const approvedComments = approvedResponse.totalElements || 0;
            document.getElementById('approvedComments').textContent = approvedComments;

            // Load rejected comments for new status
            const rejectedResponse = await window.apiClient.get('/comments/admin?status=REJECTED&size=1');
            const rejectedComments = rejectedResponse.totalElements || 0;
            
            // Update rejected count in UI if element exists
            const rejectedElement = document.getElementById('rejectedComments');
            if (rejectedElement) {
                rejectedElement.textContent = rejectedComments;
            }

            // Calculate average rating (this would need a separate API endpoint)
            document.getElementById('averageRating').textContent = '4.2';

        } catch (error) {
            console.error('Error loading stats:', error);
            this.showToast('Không thể tải thống kê', 'error');
        }
    }

    // Updated loadComments method to use new status system
    async loadComments() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page: this.currentPage,
                size: this.pageSize,
                sortBy: this.currentSort.split(',')[0],
                sortDir: this.currentSort.split(',')[1]
            });

            // Updated to use status instead of isApproved
            if (this.currentFilters.status) {
                params.append('status', this.currentFilters.status);
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

        tbody.innerHTML = this.comments.map(comment => `                <tr ${this.selectedComments.has(comment.id) ? 'class="selected"' : ''}>
                <td>
                    <input type="checkbox" ${this.selectedComments.has(comment.id) ? 'checked' : ''} 
                           onchange="adminCommentsToggleCommentSelection(${comment.id}, this.checked)">
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
                    <span class="status-badge ${this.getStatusClass(comment)}">
                        ${this.getStatusText(comment)}
                    </span>
                </td>
                <td>${this.formatDateTime(comment.createdAt)}</td>                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-view" onclick="adminCommentsViewComment(${comment.id})" title="Xem chi tiết">
                            <ion-icon name="eye-outline"></ion-icon>
                        </button>
                        ${this.getActionButtons(comment)}
                        <button class="btn-icon btn-delete" onclick="adminCommentsShowDeleteModal(${comment.id})" title="Xóa">
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
    }    // Utility methods for status handling
    getStatusClass(comment) {
        if (comment.status) {
            return comment.status.toLowerCase();
        }
        // Default to pending if status is missing
        return 'pending';
    }

    getStatusText(comment) {
        if (comment.status) {
            switch (comment.status) {
                case 'APPROVED': return 'Đã duyệt';
                case 'PENDING': return 'Chờ duyệt';
                case 'REJECTED': return 'Đã từ chối';
                default: return comment.status;
            }
        }        // Default to pending if status is missing
        return 'Chờ duyệt';
    }

    getActionButtons(comment) {
        const status = comment.status || 'PENDING';
        
        if (status === 'PENDING') {
            return `
                <button class="btn-icon btn-approve" onclick="adminCommentsShowApproveModal(${comment.id})" title="Phê duyệt">
                    <ion-icon name="checkmark-outline"></ion-icon>
                </button>
                <button class="btn-icon btn-reject" onclick="adminCommentsShowRejectModal(${comment.id})" title="Từ chối">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            `;
        }
        return '';
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
        }        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button class="page-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="adminCommentsGoToPage(${i})">
                    ${i + 1}
                </button>
            `);
        }

        return pages.join('');
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
    }    // Updated confirmReject method to send reject reason
    async confirmReject() {
        if (this.currentCommentId) {
            try {
                const rejectReason = document.getElementById('rejectReason')?.value || '';
                
                // Call the backend with reject reason as query parameter
                const url = `/comments/${this.currentCommentId}/reject${rejectReason ? `?reason=${encodeURIComponent(rejectReason)}` : ''}`;
                await window.apiClient.post(url);
                
                this.showToast('Từ chối bình luận thành công', 'success');
                this.hideModal('rejectModal');
                this.loadComments();
                this.loadStats();
                
                // Clear the reject reason field
                if (document.getElementById('rejectReason')) {
                    document.getElementById('rejectReason').value = '';
                }
            } catch (error) {
                console.error('Error rejecting comment:', error);
                this.showToast('Không thể từ chối bình luận', 'error');
            }
        }
    }

    // Updated viewComment method to show reject reason
    async viewComment(commentId) {
        console.log('viewComment called with ID:', commentId);
        try {
            const comment = this.comments.find(c => c.id === commentId);
            console.log('Found comment:', comment);
            if (!comment) {
                console.log('Comment not found!');
                return;
            }

            // Update modal content with comment details
            document.getElementById('modalUserName').textContent = comment.user.fullName || comment.user.username;
            document.getElementById('modalUserEmail').textContent = comment.user.email;
            document.getElementById('modalTourName').textContent = comment.tour.name;
            document.getElementById('modalDestination').textContent = comment.tour.destination;
            document.getElementById('modalRating').innerHTML = this.renderStars(comment.rating);
            document.getElementById('modalContent').textContent = comment.content;
            document.getElementById('modalCreatedAt').textContent = this.formatDateTime(comment.createdAt);
            document.getElementById('modalStatus').textContent = this.getStatusText(comment);
            
            // Update status class
            const statusElement = document.getElementById('modalStatus');
            statusElement.className = `status-badge ${this.getStatusClass(comment)}`;
            
            // Show/hide reject reason section
            const rejectReasonSection = document.getElementById('modalRejectReasonSection');
            const rejectReasonText = document.getElementById('modalRejectReason');
            
            if (comment.status === 'REJECTED' && comment.rejectReason) {
                rejectReasonSection.style.display = 'block';
                rejectReasonText.textContent = comment.rejectReason;
            } else {
                rejectReasonSection.style.display = 'none';
            }

            this.showModal('commentDetailModal');
        } catch (error) {
            console.error('Error viewing comment:', error);
            this.showToast('Không thể xem chi tiết bình luận', 'error');
        }
    }    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    }

    showModal(modalId) {
        console.log('showModal called with ID:', modalId);
        const modal = document.getElementById(modalId);
        console.log('Found modal element:', modal);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('Modal should now be visible');        } else {
            console.error('Modal element not found:', modalId);
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    showToast(message, type = 'info') {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        switch (type) {
            case 'success':
                toast.style.backgroundColor = '#28a745';
                break;
            case 'error':
                toast.style.backgroundColor = '#dc3545';
                break;
            default:
                toast.style.backgroundColor = '#007bff';
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    goToPage(page) {
        if (page >= 0 && page < this.totalPages) {
            this.currentPage = page;
            this.loadComments();
        }
    }

    refresh() {
        this.loadComments();
        this.loadStats();
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
            this.comments.forEach(comment => this.selectedComments.add(comment.id));
        } else {
            this.selectedComments.clear();
        }
        this.updateSelectionState();
        this.renderComments();
    }

    updateSelectionState() {
        const selectAllCheckbox = document.getElementById('selectAll');
        const bulkActions = document.querySelector('.bulk-actions');
        
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = this.comments.length > 0 && 
                this.comments.every(comment => this.selectedComments.has(comment.id));
        }
        
        if (bulkActions) {            bulkActions.style.display = this.selectedComments.size > 0 ? 'flex' : 'none';
        }
    }

    showApproveModal(commentId) {
        console.log('showApproveModal called with ID:', commentId);
        this.currentCommentId = commentId;
        this.showModal('approveModal');
    }

    showRejectModal(commentId) {
        console.log('showRejectModal called with ID:', commentId);
        this.currentCommentId = commentId;
        this.showModal('rejectModal');
    }

    showDeleteModal(commentId) {
        console.log('showDeleteModal called with ID:', commentId);
        this.currentCommentId = commentId;
        this.showModal('deleteModal');
    }

    async confirmApprove() {
        if (this.currentCommentId) {
            try {
                await window.apiClient.post(`/comments/${this.currentCommentId}/approve`);
                this.showToast('Phê duyệt bình luận thành công', 'success');
                this.hideModal('approveModal');
                this.loadComments();
                this.loadStats();
            } catch (error) {
                console.error('Error approving comment:', error);
                this.showToast('Không thể phê duyệt bình luận', 'error');
            }
        }
    }

    async confirmDelete() {
        if (this.currentCommentId) {
            try {
                await window.apiClient.delete(`/comments/${this.currentCommentId}`);
                this.showToast('Xóa bình luận thành công', 'success');
                this.hideModal('deleteModal');
                this.loadComments();
                this.loadStats();
            } catch (error) {
                console.error('Error deleting comment:', error);
                this.showToast('Không thể xóa bình luận', 'error');
            }
        }
    }

    async bulkApprove() {
        if (this.selectedComments.size === 0) return;
        
        try {
            const promises = Array.from(this.selectedComments).map(commentId =>
                window.apiClient.post(`/comments/${commentId}/approve`)
            );
            
            await Promise.all(promises);
            this.showToast('Phê duyệt hàng loạt thành công', 'success');
            this.selectedComments.clear();
            this.updateSelectionState();
            this.loadComments();
            this.loadStats();
        } catch (error) {
            console.error('Error bulk approving comments:', error);
            this.showToast('Không thể phê duyệt hàng loạt', 'error');
        }
    }

    async bulkReject() {
        if (this.selectedComments.size === 0) return;
        
        try {
            const promises = Array.from(this.selectedComments).map(commentId =>
                window.apiClient.post(`/comments/${commentId}/reject`)
            );
            
            await Promise.all(promises);
            this.showToast('Từ chối hàng loạt thành công', 'success');
            this.selectedComments.clear();
            this.updateSelectionState();
            this.loadComments();
            this.loadStats();
        } catch (error) {
            console.error('Error bulk rejecting comments:', error);
            this.showToast('Không thể từ chối hàng loạt', 'error');
        }
    }

    async exportComments() {
        try {
            const response = await window.apiClient.get('/comments/admin/export');
            // Handle export response
            this.showToast('Xuất dữ liệu thành công', 'success');
        } catch (error) {
            console.error('Error exporting comments:', error);
            this.showToast('Không thể xuất dữ liệu', 'error');
        }
    }
}

// Helper function to ensure adminComments is available
function ensureAdminComments() {
    if (!window.adminComments) {
        console.log('AdminComments not found, creating new instance...');
        window.adminComments = new AdminComments();
    }
    return window.adminComments;
}

// Global functions that can be called from HTML onclick
window.adminCommentsViewComment = function(commentId) {
    console.log('Global viewComment called with ID:', commentId);
    ensureAdminComments().viewComment(commentId);
};

window.adminCommentsShowApproveModal = function(commentId) {
    console.log('Global showApproveModal called with ID:', commentId);
    ensureAdminComments().showApproveModal(commentId);
};

window.adminCommentsShowRejectModal = function(commentId) {
    console.log('Global showRejectModal called with ID:', commentId);
    ensureAdminComments().showRejectModal(commentId);
};

window.adminCommentsShowDeleteModal = function(commentId) {
    console.log('Global showDeleteModal called with ID:', commentId);
    ensureAdminComments().showDeleteModal(commentId);
};

window.adminCommentsGoToPage = function(page) {
    console.log('Global goToPage called with page:', page);
    ensureAdminComments().goToPage(page);
};

window.adminCommentsToggleCommentSelection = function(commentId, checked) {
    console.log('Global toggleCommentSelection called with ID:', commentId, 'checked:', checked);
    ensureAdminComments().toggleCommentSelection(commentId, checked);
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing AdminComments...');
    window.adminComments = new AdminComments();
    console.log('AdminComments initialized:', window.adminComments);
});

// Also make it available globally immediately
window.adminComments = null;
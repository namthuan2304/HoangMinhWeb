// Admin Bookings Management
class AdminBookings {
    constructor() {
        this.bookings = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalItems = 0;
        this.totalPages = 0;
        this.filters = {
            status: '',
            keyword: '',
            dateFrom: '',
            dateTo: ''
        };
        this.stats = {
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0
        };
        
        this.init();
    }

    async init() {
        console.log('Initializing Admin Bookings...');
        
        // Check admin authentication
        if (!this.checkAdminAuth()) {
            return;
        }

        // Initialize elements
        this.initializeElements();
        this.bindEvents();
        
        // Load initial data
        await this.loadBookings();
        await this.loadStats();
        
        console.log('Admin Bookings initialized successfully');
    }

    checkAdminAuth() {
        if (!apiClient.isAuthenticated()) {
            window.location.href = '../login.html';
            return false;
        }

        const user = apiClient.getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            alert('Bạn không có quyền truy cập trang này!');
            window.location.href = '../index.html';
            return false;
        }

        return true;
    }

    initializeElements() {
        // Filter elements
        this.statusFilter = document.getElementById('statusFilter');
        this.searchInput = document.getElementById('searchInput');
        this.dateFromFilter = document.getElementById('dateFromFilter');
        this.dateToFilter = document.getElementById('dateToFilter');
        this.clearFiltersBtn = document.getElementById('clearFiltersBtn');
        
        // Table elements
        this.tableWrapper = document.getElementById('bookingsTableWrapper');
        this.paginationWrapper = document.getElementById('paginationWrapper');
        this.itemsPerPageSelect = document.getElementById('itemsPerPage');
        
        // Stats elements
        this.pendingCount = document.getElementById('pendingCount');
        this.confirmedCount = document.getElementById('confirmedCount');
        this.completedCount = document.getElementById('completedCount');
        this.cancelledCount = document.getElementById('cancelledCount');
        
        // Action buttons
        this.refreshBtn = document.getElementById('refreshBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        // Filter events
        this.statusFilter.addEventListener('change', () => this.applyFilters());
        this.searchInput.addEventListener('input', this.debounce(() => this.applyFilters(), 500));
        this.dateFromFilter.addEventListener('change', () => this.applyFilters());
        this.dateToFilter.addEventListener('change', () => this.applyFilters());
        this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        
        // Table events
        this.itemsPerPageSelect.addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.loadBookings();
        });
        
        // Action button events
        this.refreshBtn.addEventListener('click', () => this.refresh());
        this.exportBtn.addEventListener('click', () => this.exportReport());
    }

    async loadBookings() {
        this.showLoading(true);
        
        try {
            const params = {
                page: this.currentPage - 1,
                size: this.itemsPerPage,
                sortBy: 'createdAt',
                sortDir: 'desc',
                ...this.filters
            };

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            const response = await apiClient.getBookings(params);
            this.bookings = response.content || [];
            this.totalItems = response.totalElements || 0;
            this.totalPages = response.totalPages || 0;

            this.renderBookingsTable();
            this.renderPagination();

        } catch (error) {
            console.error('Error loading bookings:', error);
            this.showError('Có lỗi khi tải danh sách đặt tour');
        } finally {
            this.showLoading(false);
        }
    }

    async loadStats() {
        try {
            // Load booking statistics by status
            const statsResponse = await apiClient.request('/bookings/statistics/by-status');
            
            // Reset stats
            this.stats = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
            
            // Update stats from response
            if (Array.isArray(statsResponse)) {
                statsResponse.forEach(([status, count]) => {
                    switch (status) {
                        case 'PENDING':
                            this.stats.pending = count;
                            break;
                        case 'CONFIRMED':
                            this.stats.confirmed = count;
                            break;
                        case 'COMPLETED':
                            this.stats.completed = count;
                            break;
                        case 'CANCELLED':
                            this.stats.cancelled = count;
                            break;
                    }
                });
            }
            
            this.updateStatsDisplay();

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateStatsDisplay() {
        if (this.pendingCount) this.pendingCount.textContent = this.formatNumber(this.stats.pending);
        if (this.confirmedCount) this.confirmedCount.textContent = this.formatNumber(this.stats.confirmed);
        if (this.completedCount) this.completedCount.textContent = this.formatNumber(this.stats.completed);
        if (this.cancelledCount) this.cancelledCount.textContent = this.formatNumber(this.stats.cancelled);
    }

    renderBookingsTable() {
        if (!this.tableWrapper) return;

        if (this.bookings.length === 0) {
            this.tableWrapper.innerHTML = `
                <div class="empty-state">
                    <ion-icon name="calendar-outline"></ion-icon>
                    <h3>Không có đặt tour nào</h3>
                    <p>Không tìm thấy đặt tour nào với điều kiện lọc hiện tại.</p>
                </div>
            `;
            return;
        }

        const html = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Mã đơn</th>
                            <th>Khách hàng</th>
                            <th>Tour</th>
                            <th>Số người</th>
                            <th>Tổng tiền</th>
                            <th>Ngày đặt</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.bookings.map(booking => this.renderBookingRow(booking)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        this.tableWrapper.innerHTML = html;
    }

    renderBookingRow(booking) {
        return `
            <tr>
                <td>
                    <code class="invoice-code">${booking.invoiceNumber || booking.id}</code>
                </td>
                <td>
                    <div class="customer-info">
                        <strong>${booking.contactName || 'N/A'}</strong>
                        <small>${booking.contactEmail || 'N/A'}</small>
                    </div>
                </td>
                <td>
                    <div class="tour-info">
                        <strong>${booking.tourName || 'N/A'}</strong>
                        <small>${booking.tourDestination || ''}</small>
                    </div>
                </td>
                <td>
                    <span class="participant-count">${booking.participantsCount} người</span>
                </td>
                <td>
                    <span class="amount">${this.formatCurrency(booking.totalAmount)}</span>
                </td>
                <td>
                    <span class="booking-date">${this.formatDate(booking.createdAt)}</span>
                </td>
                <td>
                    <span class="badge badge-${this.getStatusColor(booking.status)}">
                        ${this.getStatusText(booking.status)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline" onclick="adminBookings.viewBooking(${booking.id})" title="Xem chi tiết">
                            <ion-icon name="eye-outline"></ion-icon>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="adminBookings.updateStatus(${booking.id})" title="Cập nhật trạng thái">
                            <ion-icon name="create-outline"></ion-icon>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="adminBookings.printInvoice(${booking.id})" title="In hóa đơn">
                            <ion-icon name="print-outline"></ion-icon>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderPagination() {
        if (!this.paginationWrapper || this.totalPages <= 1) {
            this.paginationWrapper.innerHTML = '';
            return;
        }

        const html = `
            <div class="pagination">
                <div class="pagination-info">
                    Hiển thị ${(this.currentPage - 1) * this.itemsPerPage + 1} - 
                    ${Math.min(this.currentPage * this.itemsPerPage, this.totalItems)} 
                    trong tổng số ${this.totalItems} kết quả
                </div>
                <div class="pagination-controls">
                    <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                            onclick="adminBookings.goToPage(${this.currentPage - 1})">
                        <ion-icon name="chevron-back-outline"></ion-icon>
                        Trước
                    </button>
                    
                    ${this.generatePageNumbers()}
                    
                    <button class="pagination-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''} 
                            onclick="adminBookings.goToPage(${this.currentPage + 1})">
                        Sau
                        <ion-icon name="chevron-forward-outline"></ion-icon>
                    </button>
                </div>
            </div>
        `;

        this.paginationWrapper.innerHTML = html;
    }

    generatePageNumbers() {
        const maxVisible = 5;
        let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(this.totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        let html = '';
        for (let i = start; i <= end; i++) {
            html += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="adminBookings.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        return html;
    }

    applyFilters() {
        this.filters.status = this.statusFilter.value;
        this.filters.keyword = this.searchInput.value.trim();
        this.filters.dateFrom = this.dateFromFilter.value;
        this.filters.dateTo = this.dateToFilter.value;
        
        this.currentPage = 1;
        this.loadBookings();
    }

    clearFilters() {
        this.statusFilter.value = '';
        this.searchInput.value = '';
        this.dateFromFilter.value = '';
        this.dateToFilter.value = '';
        
        this.filters = { status: '', keyword: '', dateFrom: '', dateTo: '' };
        this.currentPage = 1;
        this.loadBookings();
    }

    async refresh() {
        await Promise.all([
            this.loadBookings(),
            this.loadStats()
        ]);
        this.showToast('Dữ liệu đã được làm mới', 'success');
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        this.loadBookings();
    
    }    viewBooking(bookingId) {
        if (bookingId) {
            window.location.href = `booking-detail.html?id=${bookingId}`;
        }
    }

    async updateStatus(bookingId) {
        try {
            const booking = this.bookings.find(b => b.id === bookingId);
            if (!booking) return;

            const availableStatuses = this.getAvailableStatuses(booking.status);
            
            if (availableStatuses.length === 0) {
                this.showToast('Không thể thay đổi trạng thái của đặt tour này', 'warning');
                return;
            }

            // Show quick status update buttons
            const statusOptions = availableStatuses.map(status => 
                `<button class="btn btn-sm btn-outline status-option" data-status="${status}">
                    ${this.getStatusText(status)}
                </button>`
            ).join('');

            const modalHtml = `
                <div class="modal-overlay" id="statusModal">
                    <div class="modal">
                        <div class="modal-header">
                            <h3>Cập nhật trạng thái</h3>
                            <button class="modal-close" onclick="adminBookings.closeModal()">
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p>Chọn trạng thái mới cho đặt tour <strong>#${booking.invoiceNumber || booking.id}</strong>:</p>
                            <div class="status-options">
                                ${statusOptions}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Bind status option events
            document.querySelectorAll('.status-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.confirmStatusUpdate(bookingId, btn.dataset.status);
                });
            });

        } catch (error) {
            console.error('Error updating status:', error);
            this.showToast('Có lỗi khi cập nhật trạng thái', 'error');
        }
    }

    async confirmStatusUpdate(bookingId, newStatus) {
        try {
            this.showLoading(true);
            
            await apiClient.updateBookingStatus(bookingId, newStatus);
            
            this.showToast('Cập nhật trạng thái thành công!', 'success');
            this.closeModal();
            
            // Refresh data
            await Promise.all([
                this.loadBookings(),
                this.loadStats()
            ]);
            
        } catch (error) {
            console.error('Error updating booking status:', error);
            this.showToast('Có lỗi khi cập nhật trạng thái', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async printInvoice(bookingId) {
        try {
            this.showLoading(true);
            const blob = await apiClient.getAdminInvoicePDF(bookingId);
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${bookingId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showToast('Tải hóa đơn thành công!', 'success');
        } catch (error) {
            console.error('Error printing invoice:', error);
            this.showToast('Có lỗi khi tải hóa đơn', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async exportReport() {
        try {
            this.showLoading(true);
            
            const currentDate = new Date();
            const blob = await apiClient.getMonthlyRevenuePDF(currentDate.getFullYear(), currentDate.getMonth() + 1);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bao-cao-dat-tour-${currentDate.getFullYear()}-${currentDate.getMonth() + 1}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showToast('Xuất báo cáo thành công!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Có lỗi khi xuất báo cáo', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    closeModal() {
        const modal = document.getElementById('statusModal');
        if (modal) {
            modal.remove();
        }
    }

    getAvailableStatuses(currentStatus) {
        const statusTransitions = {
            'PENDING': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['COMPLETED', 'CANCELLED'],
            'COMPLETED': [],
            'CANCELLED': []
        };
        
        return statusTransitions[currentStatus] || [];
    }

    // Utility methods
    getStatusColor(status) {
        const colors = {
            'PENDING': 'warning',
            'CONFIRMED': 'success',
            'CANCELLED': 'danger',
            'COMPLETED': 'info'
        };
        return colors[status] || 'secondary';
    }

    getStatusText(status) {
        const texts = {
            'PENDING': 'Chờ xác nhận',
            'CONFIRMED': 'Đã xác nhận',
            'CANCELLED': 'Đã hủy',
            'COMPLETED': 'Hoàn thành'
        };
        return texts[status] || status;
    }

    formatNumber(num) {
        return new Intl.NumberFormat('vi-VN').format(num);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
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

    showError(message) {
        if (this.tableWrapper) {
            this.tableWrapper.innerHTML = `
                <div class="error-state">
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <h3>Có lỗi xảy ra</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="adminBookings.loadBookings()">
                        <ion-icon name="refresh-outline"></ion-icon>
                        <span>Thử lại</span>
                    </button>
                </div>
            `;
        }
    }

    showLoading(show) {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <ion-icon name="${type === 'success' ? 'checkmark-circle-outline' : type === 'error' ? 'alert-circle-outline' : 'information-circle-outline'}"></ion-icon>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for API client to be available
    const initBookings = () => {
        if (typeof apiClient !== 'undefined' && apiClient) {
            window.adminBookings = new AdminBookings();
        } else {
            setTimeout(initBookings, 100);
        }
    };
    
    initBookings();
});

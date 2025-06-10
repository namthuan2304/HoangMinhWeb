// Admin Booking Detail Management
class AdminBookingDetail {
    constructor() {
        this.bookingId = null;
        this.booking = null;
        
        this.init();
    }

    async init() {
        console.log('Initializing Admin Booking Detail...');
        
        // Check admin authentication
        if (!this.checkAdminAuth()) {
            return;
        }

        // Get booking ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.bookingId = urlParams.get('id');
        
        if (!this.bookingId) {
            this.showError('Không tìm thấy thông tin đặt tour');
            return;
        }

        // Initialize elements
        this.initializeElements();
        this.bindEvents();
        
        // Load booking data
        await this.loadBookingDetail();
        
        console.log('Admin Booking Detail initialized successfully');
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
        this.wrapper = document.getElementById('bookingDetailWrapper');
        this.printBtn = document.getElementById('printInvoiceBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        // Print invoice button
        if (this.printBtn) {
            this.printBtn.addEventListener('click', () => {
                this.printInvoice();
            });
        }
    }

    async loadBookingDetail() {
        this.showLoading(true);
        
        try {
            this.booking = await apiClient.getBooking(this.bookingId);
            this.renderBookingDetail();
        } catch (error) {
            console.error('Error loading booking detail:', error);
            this.showError('Có lỗi khi tải thông tin đặt tour');
        } finally {
            this.showLoading(false);
        }
    }

    renderBookingDetail() {
        if (!this.booking) {
            this.showError('Không tìm thấy thông tin đặt tour');
            return;
        }

        const html = `
            <div class="booking-detail-container">
                <!-- Booking Header -->
                <div class="booking-header-card">
                    <div class="booking-header-content">
                        <div class="booking-main-info">
                            <h2>Đặt Tour #${this.booking.invoiceNumber || this.booking.id}</h2>
                            <div class="booking-meta">
                                <span class="booking-date">
                                    <ion-icon name="calendar-outline"></ion-icon>
                                    Đặt ngày: ${this.formatDate(this.booking.createdAt)}
                                </span>
                                <span class="badge badge-${this.getStatusColor(this.booking.status)}">
                                    ${this.getStatusText(this.booking.status)}
                                </span>
                            </div>
                        </div>
                        <div class="booking-actions">
                            <button class="btn btn-outline" onclick="adminBookingDetail.updateStatus()">
                                <ion-icon name="create-outline"></ion-icon>
                                Cập nhật trạng thái
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Booking Content -->
                <div class="booking-content-grid">
                    <!-- Customer Information -->
                    <div class="detail-card">
                        <div class="card-header">
                            <h3>
                                <ion-icon name="person-outline"></ion-icon>
                                Thông tin khách hàng
                            </h3>
                        </div>
                        <div class="card-content">
                            <div class="detail-row">
                                <span class="detail-label">Tên liên hệ:</span>
                                <span class="detail-value">${this.booking.contactName || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Email:</span>
                                <span class="detail-value">${this.booking.contactEmail || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Số điện thoại:</span>
                                <span class="detail-value">${this.booking.contactPhone || 'N/A'}</span>
                            </div>
                            ${this.booking.userName ? `
                            <div class="detail-row">
                                <span class="detail-label">Tài khoản:</span>
                                <span class="detail-value">${this.booking.userName}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Tour Information -->
                    <div class="detail-card">
                        <div class="card-header">
                            <h3>
                                <ion-icon name="map-outline"></ion-icon>
                                Thông tin tour
                            </h3>
                        </div>
                        <div class="card-content">
                            <div class="detail-row">
                                <span class="detail-label">Tên tour:</span>
                                <span class="detail-value">${this.booking.tourName || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Điểm đến:</span>
                                <span class="detail-value">${this.booking.tourDestination || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Số người:</span>
                                <span class="detail-value">${this.booking.participantsCount} người</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Tổng tiền:</span>
                                <span class="detail-value total-amount">${this.formatCurrency(this.booking.totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Booking Details -->
                    <div class="detail-card full-width">
                        <div class="card-header">
                            <h3>
                                <ion-icon name="document-text-outline"></ion-icon>
                                Chi tiết đặt tour
                            </h3>
                        </div>
                        <div class="card-content">
                            <div class="detail-grid">
                                <div class="detail-row">
                                    <span class="detail-label">Ngày đặt:</span>
                                    <span class="detail-value">${this.formatDateTime(this.booking.bookingDate || this.booking.createdAt)}</span>
                                </div>
                                ${this.booking.confirmedAt ? `
                                <div class="detail-row">
                                    <span class="detail-label">Ngày xác nhận:</span>
                                    <span class="detail-value">${this.formatDateTime(this.booking.confirmedAt)}</span>
                                </div>
                                ` : ''}
                                ${this.booking.cancelledAt ? `
                                <div class="detail-row">
                                    <span class="detail-label">Ngày hủy:</span>
                                    <span class="detail-value">${this.formatDateTime(this.booking.cancelledAt)}</span>
                                </div>
                                ` : ''}
                            </div>
                            
                            ${this.booking.specialRequests ? `
                            <div class="special-requests">
                                <div class="detail-label">Yêu cầu đặc biệt:</div>
                                <div class="special-requests-content">${this.booking.specialRequests}</div>
                            </div>
                            ` : ''}
                            
                            ${this.booking.notes ? `
                            <div class="admin-notes">
                                <div class="detail-label">Ghi chú admin:</div>
                                <div class="admin-notes-content">${this.booking.notes}</div>
                            </div>
                            ` : ''}
                            
                            ${this.booking.cancellationReason ? `
                            <div class="cancellation-reason">
                                <div class="detail-label">Lý do hủy:</div>
                                <div class="cancellation-reason-content">${this.booking.cancellationReason}</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.wrapper.innerHTML = html;
    }

    async updateStatus() {
        const currentStatus = this.booking.status;
        const availableStatuses = this.getAvailableStatuses(currentStatus);
        
        if (availableStatuses.length === 0) {
            this.showToast('Không thể thay đổi trạng thái của đặt tour này', 'warning');
            return;
        }

        // Show status selection modal
        const statusOptions = availableStatuses.map(status => 
            `<option value="${status}">${this.getStatusText(status)}</option>`
        ).join('');

        const modalHtml = `
            <div class="modal-overlay" id="statusModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Cập nhật trạng thái đặt tour</h3>
                        <button class="modal-close" onclick="adminBookingDetail.closeModal()">
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="newStatus">Trạng thái mới:</label>
                            <select id="newStatus" class="form-select">
                                ${statusOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="statusNotes">Ghi chú (tùy chọn):</label>
                            <textarea id="statusNotes" class="form-textarea" rows="3" 
                                     placeholder="Nhập ghi chú về việc thay đổi trạng thái..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="adminBookingDetail.closeModal()">
                            Hủy
                        </button>
                        <button class="btn btn-primary" onclick="adminBookingDetail.confirmUpdateStatus()">
                            Cập nhật
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    async confirmUpdateStatus() {
        const newStatus = document.getElementById('newStatus').value;
        const notes = document.getElementById('statusNotes').value;

        if (!newStatus) {
            this.showToast('Vui lòng chọn trạng thái mới', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            await apiClient.updateBookingStatus(this.bookingId, newStatus);
            
            // Update local booking data
            this.booking.status = newStatus;
            if (notes) {
                this.booking.notes = notes;
            }
            
            this.showToast('Cập nhật trạng thái thành công!', 'success');
            this.closeModal();
            this.renderBookingDetail(); // Re-render to show updated status
            
        } catch (error) {
            console.error('Error updating booking status:', error);
            this.showToast('Có lỗi khi cập nhật trạng thái', 'error');
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

    async printInvoice() {
        try {
            this.showLoading(true);
            const blob = await apiClient.getAdminInvoicePDF(this.bookingId);
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${this.booking.invoiceNumber || this.bookingId}.pdf`;
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

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    }

    showError(message) {
        if (this.wrapper) {
            this.wrapper.innerHTML = `
                <div class="error-state">
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <h3>Có lỗi xảy ra</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="history.back()">
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Quay lại</span>
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
    const initBookingDetail = () => {
        if (typeof apiClient !== 'undefined' && apiClient) {
            window.adminBookingDetail = new AdminBookingDetail();
        } else {
            setTimeout(initBookingDetail, 100);
        }
    };
    
    initBookingDetail();
});

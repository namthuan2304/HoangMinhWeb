// Bookings Page JavaScript
class BookingsManager {
    constructor() {
        this.bookings = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalItems = 0;
        this.init();
    }

    init() {
        // Check if user is authenticated
        if (!apiClient.isAuthenticated()) {
            this.showToast('Vui lòng đăng nhập để xem lịch sử đặt tour', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }

        this.initializeAuth();
        this.loadBookings();
    }

    initializeAuth() {
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const logoutBtn = document.getElementById('logoutBtn');

        if (apiClient.isAuthenticated()) {
            const user = apiClient.getCurrentUser();
            if (user && authButtons && userMenu) {
                authButtons.style.display = 'none';
                userMenu.style.display = 'block';
                
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = user.fullName || user.username;
                }
            }
        }

        // User menu toggle
        const userTrigger = document.getElementById('userTrigger');
        const userDropdown = document.querySelector('.user-dropdown');
        
        if (userTrigger && userDropdown) {
            userTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('active');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (userDropdown && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });

        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await authManager.logout();
                    window.location.href = 'index.html';
                } catch (error) {
                    console.error('Logout error:', error);
                    this.showToast('Có lỗi xảy ra khi đăng xuất', 'error');
                }
            });
        }
    }

    async loadBookings() {
        const wrapper = document.getElementById('bookingsWrapper');
        if (!wrapper) return;

        try {
            // Show loading
            wrapper.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p data-translate="loading">Đang tải lịch sử đặt tour...</p>
                </div>
            `;

            // Fetch bookings data
            const params = {
                page: this.currentPage - 1,
                size: this.itemsPerPage,
                sortBy: 'createdAt',
                sortDir: 'desc'
            };

            const response = await apiClient.getUserBookings(params);
            this.bookings = response.content || [];
            this.totalItems = response.totalElements || 0;

            // Render bookings
            this.renderBookings();
            this.renderPagination();

        } catch (error) {
            console.error('Error loading bookings:', error);
            this.renderError();
        }
    }

    renderBookings() {
        const wrapper = document.getElementById('bookingsWrapper');
        if (!wrapper) return;

        if (this.bookings.length === 0) {
            this.renderEmptyState();
            return;
        }

        const html = `
            <div class="bookings-grid">
                ${this.bookings.map(booking => this.renderBookingCard(booking)).join('')}
            </div>
        `;

        wrapper.innerHTML = html;
    }    renderBookingCard(booking) {
        const statusClass = this.getStatusClass(booking.status);
        const statusText = this.getStatusText(booking.status);
        const formattedPrice = this.formatPrice(booking.totalAmount);
        // Sử dụng mainImageUrl từ tour hoặc ảnh mặc định
        const tourImage = './assets/images/packege-1.jpg'; // Ảnh mặc định

        return `
            <div class="booking-card">
                <div class="booking-card-header">
                    <img src="${tourImage}" alt="${booking.tourName || 'Tour'}" class="booking-tour-image">
                    
                    <div class="booking-tour-info">
                        <h3>${booking.tourName || 'Tên tour không có sẵn'}</h3>
                        <div class="booking-tour-meta">
                            <div class="booking-meta-item">
                                <ion-icon name="calendar-outline"></ion-icon>
                                <span>Đặt ngày: ${this.formatDate(booking.createdAt || booking.bookingDate)}</span>
                            </div>
                            <div class="booking-meta-item">
                                <ion-icon name="people-outline"></ion-icon>
                                <span>${booking.participantsCount} người</span>
                            </div>
                            <div class="booking-meta-item">
                                <ion-icon name="location-outline"></ion-icon>
                                <span>${booking.tourDestination || 'Chưa xác định'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="booking-status">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                        <div class="booking-price">${formattedPrice}₫</div>
                    </div>
                </div>
                
                <div class="booking-card-body">
                    <div class="booking-details">
                        <div class="detail-group">
                            <span class="detail-label">Mã đặt tour</span>
                            <span class="detail-value">${booking.invoiceNumber || 'N/A'}</span>
                        </div>
                        <div class="detail-group">
                            <span class="detail-label">Tên liên hệ</span>
                            <span class="detail-value">${booking.contactName}</span>
                        </div>
                        <div class="detail-group">
                            <span class="detail-label">Email</span>
                            <span class="detail-value">${booking.contactEmail}</span>
                        </div>
                        <div class="detail-group">
                            <span class="detail-label">Số điện thoại</span>
                            <span class="detail-value">${booking.contactPhone}</span>
                        </div>
                        ${booking.specialRequests ? `
                        <div class="detail-group">
                            <span class="detail-label">Yêu cầu đặc biệt</span>
                            <span class="detail-value">${booking.specialRequests}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="booking-actions">
                        <button class="btn btn-sm btn-view" onclick="bookingsManager.viewTourDetail(${booking.tourId})">
                            <ion-icon name="eye-outline"></ion-icon>
                            <span>Xem tour</span>
                        </button>
                        ${this.canCancelBooking(booking) ? `
                        <button class="btn btn-sm btn-cancel" onclick="bookingsManager.cancelBooking(${booking.id})">
                            <ion-icon name="close-outline"></ion-icon>
                            <span>Hủy đặt</span>
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        const wrapper = document.getElementById('bookingsWrapper');
        if (!wrapper) return;        wrapper.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <ion-icon name="calendar-outline"></ion-icon>
                </div>
                <div class="empty-state-content">
                    <h3>Chưa có lịch sử đặt tour</h3>
                    <p>Bạn chưa đặt tour nào. Hãy khám phá các tour du lịch hấp dẫn của chúng tôi và bắt đầu cuộc phiêu lưu của bạn!</p>
                    <a href="tours.html" class="btn btn-primary">
                        <ion-icon name="search-outline"></ion-icon>
                        <span>Khám phá tour</span>
                    </a>
                </div>
            </div>
        `;
    }

    renderError() {
        const wrapper = document.getElementById('bookingsWrapper');
        if (!wrapper) return;

        wrapper.innerHTML = `
            <div class="error-state">
                <ion-icon name="alert-circle-outline"></ion-icon>
                <h3>Có lỗi xảy ra</h3>
                <p>Không thể tải lịch sử đặt tour. Vui lòng thử lại sau.</p>
                <button class="btn btn-primary" onclick="bookingsManager.loadBookings()">
                    <ion-icon name="refresh-outline"></ion-icon>
                    <span>Thử lại</span>
                </button>
            </div>
        `;
    }

    renderPagination() {
        if (this.totalItems <= this.itemsPerPage) return;

        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        const wrapper = document.getElementById('bookingsWrapper');
        
        if (!wrapper) return;

        const paginationHtml = `
            <div class="pagination">
                <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                        onclick="bookingsManager.goToPage(${this.currentPage - 1})">
                    <ion-icon name="chevron-back-outline"></ion-icon>
                </button>
                
                ${this.generatePageNumbers(totalPages)}
                
                <span class="pagination-info">
                    Trang ${this.currentPage} / ${totalPages} (${this.totalItems} kết quả)
                </span>
                
                <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                        onclick="bookingsManager.goToPage(${this.currentPage + 1})">
                    <ion-icon name="chevron-forward-outline"></ion-icon>
                </button>
            </div>
        `;

        wrapper.innerHTML += paginationHtml;
    }

    generatePageNumbers(totalPages) {
        let pages = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="bookingsManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        return pages;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        if (page < 1 || page > totalPages || page === this.currentPage) return;

        this.currentPage = page;
        this.loadBookings();
    }

    viewTourDetail(tourId) {
        if (tourId) {
            window.location.href = `tour-detail.html?id=${tourId}`;
        }
    }    async cancelBooking(bookingId) {
        // Show cancellation reason modal
        this.showCancellationModal(bookingId);
    }

    showCancellationModal(bookingId) {
        const modalHtml = `
            <div class="modal-overlay" id="cancellationModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Hủy đặt tour</h3>
                        <button class="modal-close" onclick="bookingsManager.closeCancellationModal()">
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>Bạn có chắc chắn muốn hủy đặt tour này?</p>
                        <div class="form-group">
                            <label for="cancellationReason">Lý do hủy (tùy chọn):</label>
                            <textarea id="cancellationReason" class="form-textarea" rows="3" 
                                     placeholder="Nhập lý do hủy đặt tour..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="bookingsManager.closeCancellationModal()">
                            Không
                        </button>
                        <button class="btn btn-danger" onclick="bookingsManager.confirmCancelBooking(${bookingId})">
                            Có, hủy đặt tour
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal with animation
        setTimeout(() => {
            const modal = document.getElementById('cancellationModal');
            if (modal) {
                modal.classList.add('show');
            }
        }, 10);
    }

    async confirmCancelBooking(bookingId) {
        const reasonInput = document.getElementById('cancellationReason');
        const reason = reasonInput ? reasonInput.value.trim() : '';

        try {
            await apiClient.cancelBooking(bookingId, reason);
            this.showToast('Hủy đặt tour thành công', 'success');
            this.closeCancellationModal();
            this.loadBookings(); // Reload bookings
        } catch (error) {
            console.error('Error cancelling booking:', error);
            let errorMessage = 'Có lỗi xảy ra khi hủy đặt tour';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 400) {
                errorMessage = 'Không thể hủy đặt tour này';
            }
            
            this.showToast(errorMessage, 'error');
        }
    }

    closeCancellationModal() {
        const modal = document.getElementById('cancellationModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    canCancelBooking(booking) {
        // Only allow cancellation for PENDING and CONFIRMED bookings
        return ['PENDING', 'CONFIRMED'].includes(booking.status);
    }

    getStatusClass(status) {
        const statusMap = {
            'PENDING': 'pending',
            'CONFIRMED': 'confirmed',
            'COMPLETED': 'completed',
            'CANCELLED': 'cancelled'
        };
        return statusMap[status] || 'pending';
    }

    getStatusText(status) {
        const statusMap = {
            'PENDING': 'Chờ xác nhận',
            'CONFIRMED': 'Đã xác nhận',
            'COMPLETED': 'Hoàn thành',
            'CANCELLED': 'Đã hủy'
        };
        return statusMap[status] || 'Không xác định';
    }

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN').format(price);
    }

    formatDate(dateString) {
        if (!dateString) return 'Chưa xác định';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `toast ${type}`;
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => toast.classList.remove('show'), 4000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bookingsManager = new BookingsManager();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingsManager;
}

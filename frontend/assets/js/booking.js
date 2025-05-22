// Booking Page JavaScript
class BookingManager {
    constructor() {
        this.tourId = null;
        this.currentTour = null;
        this.participants = 1;
        this.totalPrice = 0;
        this.init();
    }

    init() {
        // Get tour ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.tourId = urlParams.get('tourId');
        
        if (!this.tourId) {
            this.showError('Không tìm thấy thông tin tour');
            return;
        }

        // Check if user is authenticated
        if (!apiClient.isAuthenticated()) {
            this.showToast('Vui lòng đăng nhập để đặt tour', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }

        this.initializeAuth();
        this.loadTourDetail();
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

    async loadTourDetail() {
        const wrapper = document.getElementById('bookingWrapper');
        if (!wrapper) return;

        try {
            // Show loading
            wrapper.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p data-translate="loading">Đang tải thông tin tour...</p>
                </div>
            `;

            // Fetch tour data
            const tour = await apiClient.getTour(this.tourId);
            this.currentTour = tour;

            // Check if tour is available
            const availableSlots = tour.maxParticipants - (tour.currentParticipants || 0);
            if (tour.status !== 'ACTIVE' || availableSlots <= 0) {
                this.showError('Tour này hiện không khả dụng để đặt');
                return;
            }

            // Update breadcrumb
            const breadcrumb = document.getElementById('tourNameBreadcrumb');
            if (breadcrumb) {
                breadcrumb.textContent = `Đặt tour: ${tour.name}`;
            }

            // Update page title
            document.title = `Đặt tour: ${tour.name} - Du Lịch Hoàng Minh`;

            // Render booking form
            this.renderBookingForm(tour);

        } catch (error) {
            console.error('Error loading tour detail:', error);
            let errorMessage = 'Không thể tải thông tin tour';
            
            if (error.response?.status === 404) {
                errorMessage = 'Tour không tồn tại hoặc đã bị xóa';
            } else if (error.response?.status >= 500) {
                errorMessage = 'Lỗi server, vui lòng thử lại sau';
            }
            
            this.showError(errorMessage);
        }
    }

    renderBookingForm(tour) {
        const wrapper = document.getElementById('bookingWrapper');
        if (!wrapper) return;

        const formattedPrice = this.formatPrice(tour.price);
        const mainImage = tour.mainImageUrl || tour.imageUrls?.[0] || './assets/images/packege-1.jpg';
        const availableSlots = tour.maxParticipants - (tour.currentParticipants || 0);

        this.totalPrice = tour.price * this.participants;

        const html = `
            <div class="booking-container">
                <div class="booking-form-section">
                    <div class="booking-header">
                        <h1>Đặt tour</h1>
                        <div class="booking-step">
                            <span class="step-indicator">1</span>
                            <span>Thông tin đặt tour</span>
                        </div>
                    </div>

                    <form class="booking-form" id="bookingForm">
                        <div class="form-section">
                            <h3 class="form-section-title">
                                <ion-icon name="person-outline"></ion-icon>
                                Thông tin liên hệ
                            </h3>
                            
                            <div class="form-group">
                                <label for="customerName">
                                    <ion-icon name="person-outline"></ion-icon>
                                    Họ và tên <span class="required">*</span>
                                </label>
                                <input type="text" id="customerName" name="customerName" class="form-input" 
                                       placeholder="Nhập họ và tên đầy đủ" required>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customerEmail">
                                        <ion-icon name="mail-outline"></ion-icon>
                                        Email <span class="required">*</span>
                                    </label>
                                    <input type="email" id="customerEmail" name="customerEmail" class="form-input" 
                                           placeholder="example@email.com" required>
                                </div>
                                <div class="form-group">
                                    <label for="customerPhone">
                                        <ion-icon name="call-outline"></ion-icon>
                                        Số điện thoại <span class="required">*</span>
                                    </label>
                                    <input type="tel" id="customerPhone" name="customerPhone" class="form-input" 
                                           placeholder="0xxx xxx xxx" required>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="customerAddress">
                                    <ion-icon name="location-outline"></ion-icon>
                                    Địa chỉ
                                </label>
                                <input type="text" id="customerAddress" name="customerAddress" class="form-input" 
                                       placeholder="Nhập địa chỉ của bạn">
                            </div>
                        </div>

                        <div class="participant-section">
                            <div class="participant-header">
                                <h3>
                                    <ion-icon name="people-outline"></ion-icon>
                                    Số lượng khách
                                </h3>
                                <div class="participant-controls">
                                    <div class="participant-counter">
                                        <button type="button" class="counter-btn" id="decreaseBtn" onclick="bookingManager.changeParticipants(-1)">
                                            <ion-icon name="remove-outline"></ion-icon>
                                        </button>
                                        <span class="counter-value" id="participantCount">${this.participants}</span>
                                        <button type="button" class="counter-btn" id="increaseBtn" onclick="bookingManager.changeParticipants(1)">
                                            <ion-icon name="add-outline"></ion-icon>
                                        </button>
                                    </div>
                                    <div class="total-price-display">
                                        <span id="totalPrice">${this.formatPrice(this.totalPrice)}₫</span>
                                    </div>
                                </div>
                            </div>
                            <div class="availability-info">
                                <ion-icon name="information-circle-outline"></ion-icon>
                                <span>Còn lại ${availableSlots} chỗ trống cho tour này</span>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3 class="form-section-title">
                                <ion-icon name="chatbubble-outline"></ion-icon>
                                Yêu cầu bổ sung
                            </h3>
                            
                            <div class="form-group">
                                <label for="specialRequests">
                                    <ion-icon name="create-outline"></ion-icon>
                                    Yêu cầu đặc biệt
                                </label>
                                <textarea id="specialRequests" name="specialRequests" class="form-textarea" 
                                        placeholder="Nhập yêu cầu đặc biệt của bạn như: ăn chay, dị ứng thực phẩm, yêu cầu phòng riêng..."></textarea>
                            </div>
                        </div>

                        <div class="booking-actions">
                            <button type="button" class="btn btn-back" onclick="history.back()">
                                <ion-icon name="arrow-back-outline"></ion-icon>
                                <span>Quay lại</span>
                            </button>
                            <button type="submit" class="btn btn-primary btn-submit">
                                <ion-icon name="card-outline"></ion-icon>
                                <span>Đặt tour ngay</span>
                            </button>
                        </div>
                    </form>
                </div>

                <div class="booking-summary">
                    <div class="tour-summary-card">
                        <img src="${mainImage}" alt="${tour.name}" class="tour-image">
                        <div class="tour-details">
                            <h3 class="tour-title">${tour.name}</h3>
                            <div class="tour-meta">
                                <div class="meta-item">
                                    <ion-icon name="time-outline"></ion-icon>
                                    <span>${tour.durationDays ? tour.durationDays + ' ngày' : 'Chưa xác định'}</span>
                                </div>
                                <div class="meta-item">
                                    <ion-icon name="location-outline"></ion-icon>
                                    <span>${tour.destination || 'Chưa xác định'}</span>
                                </div>
                                <div class="meta-item">
                                    <ion-icon name="calendar-outline"></ion-icon>
                                    <span>Khởi hành: ${this.formatDate(tour.departureDate)}</span>
                                </div>
                                <div class="meta-item">
                                    <ion-icon name="people-outline"></ion-icon>
                                    <span>Tối đa ${tour.maxParticipants} người</span>
                                </div>
                            </div>
                            <div class="tour-price">${formattedPrice}₫ / người</div>
                        </div>
                    </div>

                    <div class="price-breakdown">
                        <h4 class="breakdown-title">Chi tiết giá</h4>
                        <div class="breakdown-item">
                            <span>Giá tour (${this.participants} người)</span>
                            <span id="subtotalPrice">${this.formatPrice(this.totalPrice)}₫</span>
                        </div>
                        <div class="breakdown-item">
                            <span>Phí dịch vụ</span>
                            <span>Miễn phí</span>
                        </div>
                        <div class="breakdown-item">
                            <span>Tổng cộng</span>
                            <span id="finalPrice">${this.formatPrice(this.totalPrice)}₫</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        wrapper.innerHTML = html;

        // Initialize form
        this.initializeForm();
        this.prefillUserInfo();
    }

    initializeForm() {
        const form = document.getElementById('bookingForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitBooking();
        });

        // Update participant counter buttons state
        this.updateCounterButtons();
    }

    prefillUserInfo() {
        const user = apiClient.getCurrentUser();
        if (!user) return;

        const customerName = document.getElementById('customerName');
        const customerEmail = document.getElementById('customerEmail');
        const customerPhone = document.getElementById('customerPhone');

        if (customerName && user.fullName) {
            customerName.value = user.fullName;
        }
        if (customerEmail && user.email) {
            customerEmail.value = user.email;
        }
        if (customerPhone && user.phoneNumber) {
            customerPhone.value = user.phoneNumber;
        }
    }

    changeParticipants(delta) {
        const newCount = this.participants + delta;
        const availableSlots = this.currentTour.maxParticipants - (this.currentTour.currentParticipants || 0);

        if (newCount < 1 || newCount > availableSlots) {
            return;
        }

        this.participants = newCount;
        this.totalPrice = this.currentTour.price * this.participants;

        // Update display
        const participantCount = document.getElementById('participantCount');
        const totalPrice = document.getElementById('totalPrice');
        const subtotalPrice = document.getElementById('subtotalPrice');
        const finalPrice = document.getElementById('finalPrice');

        if (participantCount) participantCount.textContent = this.participants;
        if (totalPrice) totalPrice.textContent = this.formatPrice(this.totalPrice) + '₫';
        if (subtotalPrice) subtotalPrice.textContent = this.formatPrice(this.totalPrice) + '₫';
        if (finalPrice) finalPrice.textContent = this.formatPrice(this.totalPrice) + '₫';

        // Update breakdown text
        const breakdownItem = document.querySelector('.breakdown-item span');
        if (breakdownItem) {
            breakdownItem.textContent = `Giá tour (${this.participants} người)`;
        }

        this.updateCounterButtons();
    }

    updateCounterButtons() {
        const decreaseBtn = document.getElementById('decreaseBtn');
        const increaseBtn = document.getElementById('increaseBtn');
        const availableSlots = this.currentTour.maxParticipants - (this.currentTour.currentParticipants || 0);

        if (decreaseBtn) {
            decreaseBtn.disabled = this.participants <= 1;
        }
        if (increaseBtn) {
            increaseBtn.disabled = this.participants >= availableSlots;
        }
    }

    async submitBooking() {
        const form = document.getElementById('bookingForm');
        if (!form) return;        const formData = new FormData(form);
        const bookingData = {
            tourId: parseInt(this.tourId),
            participantsCount: this.participants,
            contactName: formData.get('customerName'),
            contactEmail: formData.get('customerEmail'),
            contactPhone: formData.get('customerPhone'),
            specialRequests: formData.get('specialRequests') || ''
        };        // Validate required fields
        if (!bookingData.contactName || !bookingData.contactEmail || !bookingData.contactPhone) {
            this.showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(bookingData.contactEmail)) {
            this.showToast('Email không hợp lệ', 'error');
            return;
        }

        // Validate phone format
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(bookingData.contactPhone.replace(/\D/g, ''))) {
            this.showToast('Số điện thoại không hợp lệ', 'error');
            return;
        }

        try {
            // Disable submit button
            const submitBtn = form.querySelector('.btn-submit');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; margin-right: 0.5rem;"></div>Đang xử lý...';
            }

            // Submit booking
            const result = await apiClient.createBooking(bookingData);

            this.showToast('Đặt tour thành công!', 'success');
            
            // Redirect to booking confirmation or user bookings page
            setTimeout(() => {
                window.location.href = `bookings.html`;
            }, 1500);

        } catch (error) {
            console.error('Booking error:', error);
            
            let errorMessage = 'Có lỗi xảy ra khi đặt tour';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 400) {
                errorMessage = 'Thông tin đặt tour không hợp lệ';
            } else if (error.response?.status === 409) {
                errorMessage = 'Tour đã hết chỗ trống';
            }
            
            this.showToast(errorMessage, 'error');

            // Re-enable submit button
            const submitBtn = form.querySelector('.btn-submit');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<ion-icon name="card-outline"></ion-icon><span>Đặt tour ngay</span>';
            }
        }
    }

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN').format(price);
    }

    formatDate(dateString) {
        if (!dateString) return 'Chưa xác định';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    }

    showError(message) {
        const wrapper = document.getElementById('bookingWrapper');
        if (wrapper) {
            wrapper.innerHTML = `
                <div class="error-state">
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <h3>Có lỗi xảy ra</h3>
                    <p>${message}</p>
                    <a href="tours.html" class="btn btn-primary">Về trang danh sách tour</a>
                </div>
            `;
        }
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
    window.bookingManager = new BookingManager();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingManager;
}

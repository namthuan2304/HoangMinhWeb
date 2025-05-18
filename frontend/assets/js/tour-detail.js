// Tour Detail Page JavaScript
class TourDetailManager {
    constructor() {
        this.tourId = null;
        this.currentTour = null;
        this.init();
    }

    init() {
        // Get tour ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.tourId = urlParams.get('id');
        
        if (!this.tourId) {
            this.showError('Không tìm thấy thông tin tour');
            return;
        }

        this.initializeAuth();
        this.loadTourDetail();
        this.loadRelatedTours();
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
                const userAvatarElement = document.getElementById('userAvatar');
                
                if (userNameElement) {
                    userNameElement.textContent = user.fullName || user.username;
                }
                
                if (userAvatarElement && user.avatar) {
                    userAvatarElement.src = user.avatar;
                }
            }
        }

        // User menu toggle
        const userBtn = document.getElementById('userBtn');
        const userDropdown = document.getElementById('userDropdown');
        
        if (userBtn && userDropdown) {
            userBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            if (userDropdown) {
                userDropdown.classList.remove('show');
            }
        });

        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await authManager.logout();
            });
        }
    }

    async loadTourDetail() {
        const wrapper = document.getElementById('tourDetailWrapper');
        if (!wrapper) return;

        try {
            // Show loading
            wrapper.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p data-translate="loading">Đang tải...</p>
                </div>
            `;

            // Fetch tour data
            const tour = await apiClient.getTour(this.tourId);
            this.currentTour = tour;

            // Update breadcrumb
            const breadcrumb = document.getElementById('tourNameBreadcrumb');
            if (breadcrumb) {
                breadcrumb.textContent = tour.name;
            }

            // Update page title
            document.title = `${tour.name} - Du Lịch Hoàng Minh`;

            // Render tour detail
            this.renderTourDetail(tour);

        } catch (error) {
            console.error('Error loading tour detail:', error);
            this.showError('Không thể tải thông tin tour');
        }
    }

    renderTourDetail(tour) {
        const wrapper = document.getElementById('tourDetailWrapper');
        if (!wrapper) return;

        const rating = tour.ratingAverage || 0;
        const reviewCount = tour.totalBookings || 0;
        const formattedPrice = this.formatPrice(tour.price);
        const images = tour.imageUrls || [];
        const mainImage = tour.mainImageUrl || images[0] || './assets/images/packege-1.jpg';
        
        // Generate star rating HTML
        const stars = this.generateStarRating(rating);

        const html = `
            <div class="tour-detail-content">
                <div class="tour-detail-header">
                    <div class="tour-images">
                        <div class="main-image">
                            <img src="${mainImage}" alt="${tour.name}" id="mainTourImage">
                        </div>
                        ${images.length > 1 ? `
                            <div class="image-gallery">
                                ${images.map((img, index) => `
                                    <img src="${img}" alt="${tour.name}" 
                                         class="gallery-thumb ${index === 0 ? 'active' : ''}"
                                         onclick="tourDetailManager.changeMainImage('${img}', this)">
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <div class="tour-info">
                        <div class="tour-badges">
                            ${tour.isFeatured ? '<span class="badge featured">Nổi bật</span>' : ''}
                            <span class="badge type">${tour.tourType === 'INTERNATIONAL' ? 'Tour quốc tế' : 'Tour trong nước'}</span>
                        </div>

                        <h1 class="tour-title">${tour.name}</h1>

                        <div class="tour-rating">
                            <div class="stars">${stars}</div>
                            <span class="rating-text">${rating.toFixed(1)} (${reviewCount} đánh giá)</span>
                        </div>

                        <div class="tour-meta">
                            <div class="meta-item">
                                <ion-icon name="time-outline"></ion-icon>
                                <span>${tour.durationDays || 1} ngày</span>
                            </div>
                            <div class="meta-item">
                                <ion-icon name="location-outline"></ion-icon>
                                <span>${tour.destination}</span>
                            </div>
                            <div class="meta-item">
                                <ion-icon name="people-outline"></ion-icon>
                                <span>Tối đa ${tour.maxParticipants} người</span>
                            </div>
                            <div class="meta-item">
                                <ion-icon name="calendar-outline"></ion-icon>
                                <span>Khởi hành: ${this.formatDate(tour.departureDate)}</span>
                            </div>
                        </div>

                        <div class="tour-price-section">
                            <div class="price">
                                <span class="current-price">${formattedPrice}₫</span>
                                <span class="price-unit">/ người</span>
                            </div>
                            <div class="availability">
                                <span class="available-slots">Còn ${tour.maxParticipants - (tour.currentParticipants || 0)} chỗ</span>
                            </div>
                        </div>

                        <div class="tour-actions">
                            <button class="btn btn-primary btn-large" onclick="tourDetailManager.showBookingModal()">
                                <ion-icon name="calendar-outline"></ion-icon>
                                <span data-translate="book_now">Đặt ngay</span>
                            </button>
                            <button class="btn btn-outline wishlist-btn" onclick="tourDetailManager.toggleWishlist()">
                                <ion-icon name="heart-outline"></ion-icon>
                                <span>Yêu thích</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="tour-detail-body">
                    <div class="tour-tabs">
                        <button class="tab-btn active" data-tab="overview">Tổng quan</button>
                        <button class="tab-btn" data-tab="itinerary">Lịch trình</button>
                        <button class="tab-btn" data-tab="includes">Bao gồm</button>
                        <button class="tab-btn" data-tab="terms">Điều khoản</button>
                        <button class="tab-btn" data-tab="reviews">Đánh giá</button>
                    </div>

                    <div class="tab-content">
                        <div class="tab-pane active" id="overview">
                            <h3>Mô tả tour</h3>
                            <p>${tour.description || 'Chưa có mô tả cho tour này.'}</p>
                        </div>

                        <div class="tab-pane" id="itinerary">
                            <h3>Lịch trình chi tiết</h3>
                            <div class="itinerary-content">
                                ${tour.itinerary ? tour.itinerary.split('\n').map(line => `<p>${line}</p>`).join('') : '<p>Lịch trình sẽ được cập nhật sớm.</p>'}
                            </div>
                        </div>

                        <div class="tab-pane" id="includes">
                            <div class="includes-excludes">
                                <div class="includes">
                                    <h3>Bao gồm</h3>
                                    ${tour.includes ? tour.includes.split('\n').map(item => `<p><ion-icon name="checkmark-outline"></ion-icon> ${item}</p>`).join('') : '<p>Chưa có thông tin.</p>'}
                                </div>
                                <div class="excludes">
                                    <h3>Không bao gồm</h3>
                                    ${tour.excludes ? tour.excludes.split('\n').map(item => `<p><ion-icon name="close-outline"></ion-icon> ${item}</p>`).join('') : '<p>Chưa có thông tin.</p>'}
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane" id="terms">
                            <h3>Điều khoản & Điều kiện</h3>
                            <div class="terms-content">
                                ${tour.termsConditions ? tour.termsConditions.split('\n').map(line => `<p>${line}</p>`).join('') : '<p>Điều khoản sẽ được cập nhật sớm.</p>'}
                            </div>
                        </div>

                        <div class="tab-pane" id="reviews">
                            <h3>Đánh giá từ khách hàng</h3>
                            <div class="reviews-summary">
                                <div class="rating-overview">
                                    <div class="rating-score">
                                        <span class="score">${rating.toFixed(1)}</span>
                                        <div class="stars">${stars}</div>
                                        <span class="review-count">Dựa trên ${reviewCount} đánh giá</span>
                                    </div>
                                </div>
                            </div>
                            <div class="reviews-list">
                                <p class="no-reviews">Chưa có đánh giá cho tour này.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        wrapper.innerHTML = html;

        // Initialize tabs
        this.initializeTabs();
    }

    initializeTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');

                // Remove active class from all tabs and panes
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));

                // Add active class to clicked tab and corresponding pane
                btn.classList.add('active');
                const targetPane = document.getElementById(tabId);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    }

    changeMainImage(src, thumbElement) {
        const mainImage = document.getElementById('mainTourImage');
        const allThumbs = document.querySelectorAll('.gallery-thumb');

        if (mainImage) {
            mainImage.src = src;
        }

        // Update active thumb
        allThumbs.forEach(thumb => thumb.classList.remove('active'));
        thumbElement.classList.add('active');
    }

    async showBookingModal() {
        if (!apiClient.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        // Here you would implement the booking modal
        // For now, just redirect to a booking page or show a simple modal
        alert('Chức năng đặt tour sẽ được triển khai sớm!');
    }

    async toggleWishlist() {
        if (!apiClient.isAuthenticated()) {
            this.showToast('Vui lòng đăng nhập để sử dụng tính năng này', 'warning');
            return;
        }

        // Implement wishlist functionality
        this.showToast('Tính năng yêu thích sẽ được triển khai sớm!', 'info');
    }

    async loadRelatedTours() {
        try {
            const relatedGrid = document.getElementById('relatedToursGrid');
            if (!relatedGrid || !this.currentTour) return;

            // For now, just get some tours from the same destination or type
            const response = await apiClient.getTours({
                page: 0,
                size: 4,
                destination: this.currentTour.destination
            });

            const tours = response.content || response.data || [];
            const filteredTours = tours.filter(tour => tour.id !== this.currentTour.id).slice(0, 3);

            if (filteredTours.length > 0) {
                this.renderRelatedTours(filteredTours);
            } else {
                relatedGrid.innerHTML = '<p>Không có tour liên quan.</p>';
            }

        } catch (error) {
            console.error('Error loading related tours:', error);
        }
    }

    renderRelatedTours(tours) {
        const relatedGrid = document.getElementById('relatedToursGrid');
        if (!relatedGrid) return;

        const html = tours.map(tour => `
            <div class="related-tour-card">
                <div class="tour-image">
                    <img src="${tour.mainImageUrl || tour.imageUrls?.[0] || './assets/images/packege-1.jpg'}" 
                         alt="${tour.name}">
                </div>
                <div class="tour-content">
                    <h4><a href="tour-detail.html?id=${tour.id}">${tour.name}</a></h4>
                    <div class="tour-rating">
                        ${this.generateStarRating(tour.ratingAverage || 0)}
                        <span>(${tour.totalBookings || 0})</span>
                    </div>
                    <div class="tour-price">${this.formatPrice(tour.price)}₫</div>
                </div>
            </div>
        `).join('');

        relatedGrid.innerHTML = html;
    }

    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let html = '';

        // Full stars
        for (let i = 0; i < fullStars; i++) {
            html += '<ion-icon name="star"></ion-icon>';
        }

        // Half star
        if (hasHalfStar) {
            html += '<ion-icon name="star-half"></ion-icon>';
        }

        // Empty stars
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            html += '<ion-icon name="star-outline"></ion-icon>';
        }

        return html;
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
        const wrapper = document.getElementById('tourDetailWrapper');
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
    window.tourDetailManager = new TourDetailManager();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TourDetailManager;
}

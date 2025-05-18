// Tours Page JavaScript
class ToursManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 9;
        this.totalItems = 0;
        this.currentFilters = {};
        this.currentView = 'grid';
        this.tours = [];
        
        this.init();
    }

    init() {
        this.initializeAuth();
        this.initializeFilters();
        this.initializeViewToggle();
        this.initializeWishlist();
        this.loadTours();
    }

    initializeAuth() {
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const logoutBtn = document.getElementById('logoutBtn');

        if (apiClient.isAuthenticated()) {
            const user = apiClient.getCurrentUser();
            if (user) {
                authButtons.style.display = 'none';
                userMenu.style.display = 'block';
                
                document.getElementById('userName').textContent = user.fullName || user.username;
                
                // Load user avatar if available
                if (user.avatar) {
                    document.getElementById('userAvatar').src = user.avatar;
                }
            }
        }

        // User menu toggle
        const userBtn = document.getElementById('userBtn');
        const userDropdown = document.getElementById('userDropdown');
        
        if (userBtn) {
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

    initializeFilters() {
        const filterForm = document.getElementById('tourFilterForm');
        
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.applyFilters();
        });

        filterForm.addEventListener('reset', () => {
            setTimeout(() => {
                this.currentFilters = {};
                this.currentPage = 1;
                this.loadTours();
            }, 100);
        });

        // Real-time filtering for some inputs
        const searchInputs = ['destination'];
        searchInputs.forEach(inputName => {
            const input = document.getElementById(inputName);
            if (input) {
                let timeout;
                input.addEventListener('input', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        this.applyFilters();
                    }, 500);
                });
            }
        });
    }

    initializeViewToggle() {
        const viewButtons = document.querySelectorAll('.view-btn');
        const toursGrid = document.getElementById('toursGrid');

        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.getAttribute('data-view');
                this.currentView = view;

                // Update active button
                viewButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update grid class
                toursGrid.classList.toggle('list-view', view === 'list');
                
                // Save preference
                localStorage.setItem('toursView', view);
            });
        });

        // Load saved view preference
        const savedView = localStorage.getItem('toursView');
        if (savedView) {
            const viewBtn = document.querySelector(`[data-view="${savedView}"]`);
            if (viewBtn) {
                viewBtn.click();
            }
        }
    }

    initializeWishlist() {
        document.addEventListener('click', async (e) => {
            if (e.target.closest('.tour-wishlist')) {
                e.preventDefault();
                const wishlistBtn = e.target.closest('.tour-wishlist');
                const tourId = wishlistBtn.getAttribute('data-tour-id');
                
                if (!apiClient.isAuthenticated()) {
                    this.showToast('Vui lòng đăng nhập để sử dụng tính năng này', 'warning');
                    return;
                }

                await this.toggleWishlist(tourId, wishlistBtn);
            }
        });
    }

    async toggleWishlist(tourId, btn) {
        try {
            const isActive = btn.classList.contains('active');
            
            if (isActive) {
                // Remove from wishlist
                // await apiClient.removeFromWishlist(tourId);
                btn.classList.remove('active');
                this.showToast('Đã xóa khỏi danh sách yêu thích', 'info');
            } else {
                // Add to wishlist
                // await apiClient.addToWishlist(tourId);
                btn.classList.add('active');
                this.showToast('Đã thêm vào danh sách yêu thích', 'success');
            }
        } catch (error) {
            console.error('Wishlist error:', error);
            this.showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
        }
    }

    applyFilters() {
        const formData = new FormData(document.getElementById('tourFilterForm'));
        this.currentFilters = {};
        
        for (let [key, value] of formData.entries()) {
            if (value.trim()) {
                this.currentFilters[key] = value;
            }
        }

        this.currentPage = 1;
        this.loadTours();
    }

    async loadTours() {
        const toursGrid = document.getElementById('toursGrid');
        const toursCount = document.getElementById('toursCount');
        
        try {
            // Show loading
            toursGrid.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p data-translate="loading">Đang tải...</p>
                </div>
            `;

            // Prepare API parameters
            const params = {
                page: this.currentPage - 1, // API uses 0-based indexing
                size: this.itemsPerPage,
                ...this.currentFilters
            };

            // Handle price range
            if (this.currentFilters.priceRange) {
                const [minPrice, maxPrice] = this.currentFilters.priceRange.split('-');
                params.minPrice = minPrice;
                params.maxPrice = maxPrice;
                delete params.priceRange;
            }

            // Handle duration
            if (this.currentFilters.duration) {
                const [minDays, maxDays] = this.currentFilters.duration.split('-');
                params.minDuration = minDays;
                params.maxDuration = maxDays;
                delete params.duration;
            }

            // API call - use search if there are filters, otherwise get all tours
            let response;
            if (Object.keys(this.currentFilters).length > 0) {
                response = await apiClient.searchTours(params);
            } else {
                response = await apiClient.getTours(params);
            }

            this.tours = response.content || response.data || [];
            this.totalItems = response.totalElements || this.tours.length;

            // Update tours count
            toursCount.textContent = `Tìm thấy ${this.totalItems} tour`;

            // Render tours
            this.renderTours();
            this.renderPagination();

        } catch (error) {
            console.error('Load tours error:', error);
            this.renderError();
        }
    }

    renderTours() {
        const toursGrid = document.getElementById('toursGrid');
        
        if (this.tours.length === 0) {
            toursGrid.innerHTML = this.renderEmptyState();
            return;
        }

        const toursHTML = this.tours.map(tour => this.renderTourCard(tour)).join('');
        toursGrid.innerHTML = toursHTML;

        // Re-translate if language manager is available
        if (window.languageManager) {
            window.languageManager.translatePage();
        }
    }    renderTourCard(tour) {
        const rating = tour.ratingAverage || 0;
        const reviewCount = tour.totalBookings || 0;
        const price = this.formatPrice(tour.price);
        const duration = tour.durationDays || 0;
        const maxGroupSize = tour.maxParticipants || 0;
        
        // Generate star rating
        const stars = Array.from({length: 5}, (_, i) => {
            const filled = i < Math.floor(rating);
            return `<ion-icon name="${filled ? 'star' : 'star-outline'}"></ion-icon>`;
        }).join('');

        // Tour type badge
        const tourTypeBadge = tour.tourType === 'INTERNATIONAL' ? 'Tour quốc tế' : 'Tour trong nước';
        
        // Tour features
        const features = [
            { icon: 'time-outline', text: `${duration} ngày` },
            { icon: 'people-outline', text: `${maxGroupSize} người` },
            { icon: 'location-outline', text: tour.destination || 'Đang cập nhật' }
        ];        return `
            <div class="tour-card">
                <div class="tour-card-banner">
                    <img src="${tour.mainImageUrl || tour.imageUrls?.[0] || './assets/images/packege-1.jpg'}" 
                         alt="${tour.name}" loading="lazy">
                    
                    ${tour.isFeatured ? '<div class="tour-badge featured">Nổi bật</div>' : ''}
                    ${tour.isNew ? '<div class="tour-badge new">Mới</div>' : ''}
                    
                    <button class="tour-wishlist" data-tour-id="${tour.id}" aria-label="Thêm vào yêu thích">
                        <ion-icon name="heart-outline"></ion-icon>
                    </button>
                </div>

                <div class="tour-card-content">
                    <div class="tour-meta">
                        <div class="tour-rating">
                            ${stars}
                            <span class="tour-rating-text">(${reviewCount} đánh giá)</span>
                        </div>
                        <div class="tour-type">${tourTypeBadge}</div>
                    </div>

                    <h3 class="tour-title">
                        <a href="tour-detail.html?id=${tour.id}">${tour.name}</a>
                    </h3>

                    <p class="tour-description">
                        ${tour.description || 'Mô tả tour sẽ được cập nhật sớm...'}
                    </p>

                    <div class="tour-features">
                        ${features.map(feature => `
                            <div class="tour-feature">
                                <ion-icon name="${feature.icon}"></ion-icon>
                                <span>${feature.text}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="tour-footer">
                        <div class="tour-price">
                            <span class="tour-price-current">${price}₫</span>
                            <span class="tour-price-per" data-translate="per_person">/ người</span>
                        </div>
                        <button class="btn btn-primary tour-book-btn" onclick="bookTour(${tour.id})">
                            <span data-translate="book_now">Đặt ngay</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <ion-icon name="search-outline"></ion-icon>
                <h3>Không tìm thấy tour</h3>
                <p>Không có tour nào phù hợp với tiêu chí tìm kiếm của bạn. Vui lòng thử lại với các bộ lọc khác.</p>
                <button class="btn btn-primary" onclick="document.getElementById('tourFilterForm').reset(); toursManager.applyFilters();">
                    Xóa bộ lọc
                </button>
            </div>
        `;
    }

    renderError() {
        const toursGrid = document.getElementById('toursGrid');
        toursGrid.innerHTML = `
            <div class="empty-state">
                <ion-icon name="alert-circle-outline"></ion-icon>
                <h3>Có lỗi xảy ra</h3>
                <p>Không thể tải danh sách tour. Vui lòng thử lại sau.</p>
                <button class="btn btn-primary" onclick="toursManager.loadTours()">
                    Thử lại
                </button>
            </div>
        `;
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="toursManager.goToPage(${this.currentPage - 1})">
                <ion-icon name="chevron-back-outline"></ion-icon>
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="toursManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="toursManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="toursManager.goToPage(${totalPages})">${totalPages}</button>`;
        }

        // Next button
        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="toursManager.goToPage(${this.currentPage + 1})">
                <ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
        `;

        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page < 1 || page > Math.ceil(this.totalItems / this.itemsPerPage)) return;
        
        this.currentPage = page;
        this.loadTours();
        
        // Scroll to top of tours section
        document.querySelector('.tours-section').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN').format(price);
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

// Global function for booking tours
window.bookTour = function(tourId) {
    if (!apiClient.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    window.location.href = `tour-detail.html?id=${tourId}#booking`;
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.toursManager = new ToursManager();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToursManager;
}

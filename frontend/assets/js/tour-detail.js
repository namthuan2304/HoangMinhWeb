// Tour Detail Page JavaScript
class TourDetailManager {
    constructor() {
        this.tourId = null;
        this.currentTour = null;
        this.reviews = [];
        this.currentPage = 0;
        this.totalPages = 0;
        this.reviewsPerPage = 10;
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
                
                if (userNameElement) {
                    userNameElement.textContent = user.fullName || user.username;
                }
            }
        }

        // User menu toggle
        const userTrigger = document.getElementById('userTrigger');
        const userDropdown = document.querySelector('.user-dropdown');
        const userDropdownMenu = document.getElementById('userDropdownMenu');
        
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

            // Debug log to check tour data
            console.log('Tour data received:', tour);
            console.log('Terms conditions:', tour.termsConditions);

            // Update breadcrumb
            const breadcrumb = document.getElementById('tourNameBreadcrumb');
            if (breadcrumb) {
                breadcrumb.textContent = tour.name;
            }

            // Update page title
            document.title = `${tour.name} - Du Lịch Hoàng Minh`;

            // Get actual comment count
            let actualCommentCount = 0;
            try {
                const ratingData = await apiClient.getTourRating(this.tourId);
                actualCommentCount = ratingData.totalComments || 0;
                console.log('Actual comment count:', actualCommentCount);
            } catch (error) {
                console.error('Error getting comment count:', error);
            }

            // Render tour detail with actual comment count
            this.renderTourDetail(tour, actualCommentCount);

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

    renderTourDetail(tour, actualCommentCount = 0) {
        const wrapper = document.getElementById('tourDetailWrapper');
        if (!wrapper) return;

        const rating = tour.ratingAverage || 0;
        const reviewCount = actualCommentCount; // Use actual comment count instead of totalBookings
        const formattedPrice = this.formatPrice(tour.price);
        const images = tour.imageUrls || [];
        const mainImage = apiClient.getFullImageUrl(tour.mainImageUrl) || apiClient.getFullImageUrl(images[0]) || './assets/images/packege-1.jpg';
        
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
                                    <img src="${apiClient.getFullImageUrl(img)}" alt="${tour.name}" class="gallery-thumb ${index === 0 ? 'active' : ''}" onclick="tourDetailManager.changeMainImage('${apiClient.getFullImageUrl(img)}', this)">
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <div class="tour-info">
                        <div class="tour-badges">
                            ${tour.isFeatured ? '<span class="badge featured">Nổi bật</span>' : ''}
                            <span class="badge type">${tour.tourType === 'INTERNATIONAL' ? 'Tour quốc tế' : 'Tour trong nước'}</span>
                            ${tour.status === 'ACTIVE' ? '<span class="badge active">Đang mở</span>' : 
                              tour.status === 'INACTIVE' ? '<span class="badge inactive">Tạm dừng</span>' :
                              tour.status === 'COMPLETED' ? '<span class="badge completed">Đã hoàn thành</span>' : ''}
                        </div>

                        <h1 class="tour-title">${tour.name}</h1>

                        <div class="tour-rating">
                            <div class="stars">${stars}</div>
                            <span class="rating-text">${rating > 0 ? rating.toFixed(1) : '0.0'} (${reviewCount} đánh giá)</span>
                        </div>

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
                                <ion-icon name="airplane-outline"></ion-icon>
                                <span>Từ: ${tour.departureLocation || 'Chưa xác định'}</span>
                            </div>
                            <div class="meta-item">
                                <ion-icon name="people-outline"></ion-icon>
                                <span>Tối đa ${tour.maxParticipants || 0} người</span>
                            </div>
                            <div class="meta-item">
                                <ion-icon name="calendar-outline"></ion-icon>
                                <span>Khởi hành: ${this.formatDate(tour.departureDate)}</span>
                            </div>
                            ${tour.returnDate ? `
                            <div class="meta-item">
                                <ion-icon name="calendar-outline"></ion-icon>
                                <span>Kết thúc: ${this.formatDate(tour.returnDate)}</span>
                            </div>
                            ` : ''}
                        </div>

                        <div class="tour-price-section">
                            <div class="price">
                                <span class="current-price">${formattedPrice}₫</span>
                                <span class="price-unit">/ người</span>
                            </div>
                            <div class="availability">
                                ${this.getAvailabilityInfo(tour)}
                            </div>
                        </div>

                        <div class="tour-actions">
                            ${this.renderBookingButton(tour)}
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
                        <button class="tab-btn" data-tab="reviews">Đánh giá (${reviewCount})</button>
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
                                ${tour.termsConditions ? this.formatTermsConditions(tour.termsConditions) : '<p>Điều khoản sẽ được cập nhật sớm.</p>'}
                            </div>
                        </div>

                        <div class="tab-pane" id="reviews">
                            ${this.renderReviewsSection(tour, rating, reviewCount)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        wrapper.innerHTML = html;

        // Initialize tabs
        this.initializeTabs();
    }

    renderReviewsSection(tour, rating, reviewCount) {
        return `
            <div class="reviews-section">
                <div class="reviews-container">
                    <!-- Reviews Header -->
                    <div class="reviews-header">
                        <h3 class="reviews-title">
                            <ion-icon name="chatbubbles-outline"></ion-icon>
                            Đánh giá từ khách hàng
                        </h3>
                        <p class="reviews-subtitle">
                            Khám phá những trải nghiệm thực tế từ các khách hàng đã tham gia tour này
                        </p>
                    </div>

                    <!-- Reviews Dashboard -->
                    <div class="reviews-dashboard">
                        <!-- Rating Overview -->
                        <div class="rating-overview-card">
                            <div class="rating-display">
                                <span class="rating-score-large">
                                    ${rating > 0 ? rating.toFixed(1) : '0.0'}
                                    <span class="rating-score-max">/5</span>
                                </span>
                                <div class="rating-stars-large">
                                    ${this.generateStarRating(rating)}
                                </div>
                                <p class="rating-summary" id="ratingSummary">
                                    Đang tải thông tin đánh giá...
                                </p>
                            </div>
                            
                            <div class="rating-stats-grid">
                                <div class="stat-card">
                                    <span class="stat-number" id="positivePercentage">0%</span>
                                    <span class="stat-label">Tích cực</span>
                                </div>
                                <div class="stat-card">
                                    <span class="stat-number" id="recommendPercentage">0%</span>
                                    <span class="stat-label">Giới thiệu</span>
                                </div>
                            </div>
                        </div>

                        <!-- Rating Breakdown -->
                        <div class="rating-breakdown-card">
                            <h4 class="breakdown-title">
                                <ion-icon name="bar-chart-outline"></ion-icon>
                                Phân tích đánh giá
                            </h4>
                            <div class="rating-bars" id="ratingBarsContainer">
                                <p class="empty-state-description">Đang tải phân tích đánh giá...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Review Actions -->
                    <div class="review-actions-section">
                        ${apiClient.isAuthenticated() ? `
                            <div class="review-cta-card">
                                <ion-icon name="create-outline" class="cta-icon"></ion-icon>
                                <h4 class="cta-title">Chia sẻ trải nghiệm của bạn</h4>
                                <p class="cta-description">
                                    Hãy để lại đánh giá về tour này để giúp những khách hàng khác có quyết định tốt hơn
                                </p>
                                <button class="cta-button" id="writeReviewBtn" onclick="tourDetailManager.showReviewForm()">
                                    <ion-icon name="star-outline"></ion-icon>
                                    Viết đánh giá
                                </button>
                            </div>
                        ` : `
                            <div class="login-prompt-card">
                                <ion-icon name="lock-closed-outline" class="login-prompt-icon"></ion-icon>
                                <p class="login-prompt-text">
                                    Bạn cần <a href="login.html" class="login-prompt-link">đăng nhập</a> 
                                    để có thể viết đánh giá và chia sẻ trải nghiệm của mình
                                </p>
                            </div>
                        `}
                    </div>

                    <!-- Reviews Filters -->
                    <div class="reviews-list-section">
                        <div class="reviews-filters">
                            <h4 class="filters-title">
                                <ion-icon name="filter-outline"></ion-icon>
                                Lọc đánh giá
                            </h4>
                            <div class="filter-buttons">
                                <button class="filter-chip active" data-filter="all">Tất cả</button>
                                <button class="filter-chip" data-filter="5">5 sao</button>
                                <button class="filter-chip" data-filter="4">4 sao</button>
                                <button class="filter-chip" data-filter="3">3 sao</button>
                                <button class="filter-chip" data-filter="2">2 sao</button>
                                <button class="filter-chip" data-filter="1">1 sao</button>
                            </div>
                        </div>

                        <!-- Reviews List -->
                        <div class="reviews-grid" id="reviewsGrid">
                            ${this.renderLoadingSkeleton()}
                        </div>

                        <!-- Pagination -->
                        <div class="reviews-pagination" id="reviewsPagination" style="display: none;">
                            <!-- Pagination will be rendered here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Review Form Modal -->
            <div class="review-form-overlay" id="reviewFormOverlay">
                <div class="review-form-modal">
                    <div class="form-header">
                        <h4 class="form-title">
                            <ion-icon name="star-outline"></ion-icon>
                            Viết đánh giá
                        </h4>
                        <p class="form-subtitle">Chia sẻ trải nghiệm của bạn về tour này</p>
                        <button class="form-close-btn" onclick="tourDetailManager.hideReviewForm()">
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    </div>
                    <div class="form-body">
                        <form id="reviewForm">
                            <div class="rating-input-section">
                                <label class="rating-input-label">Đánh giá của bạn</label>
                                <div class="star-rating-input" id="starRatingInput">
                                    <span class="star-input" data-rating="1">★</span>
                                    <span class="star-input" data-rating="2">★</span>
                                    <span class="star-input" data-rating="3">★</span>
                                    <span class="star-input" data-rating="4">★</span>
                                    <span class="star-input" data-rating="5">★</span>
                                </div>
                                <div class="rating-feedback" id="ratingFeedback">Chọn số sao</div>
                            </div>
                            
                            <div class="content-input-section">
                                <label class="content-input-label" for="reviewContent">
                                    Nội dung đánh giá
                                </label>
                                <textarea 
                                    id="reviewContent" 
                                    class="content-textarea" 
                                    placeholder="Chia sẻ chi tiết về trải nghiệm của bạn với tour này..."
                                    required
                                ></textarea>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="form-btn form-btn-cancel" onclick="tourDetailManager.hideReviewForm()">
                                    <ion-icon name="close-outline"></ion-icon>
                                    Hủy
                                </button>
                                <button type="submit" class="form-btn form-btn-submit">
                                    <ion-icon name="checkmark-outline"></ion-icon>
                                    Gửi đánh giá
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    renderLoadingSkeleton() {
        return Array(3).fill(0).map(() => `
            <div class="review-skeleton loading-skeleton">
                <div class="skeleton-header">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-info">
                        <div class="skeleton-line short"></div>
                        <div class="skeleton-line short"></div>
                    </div>
                </div>
                <div class="skeleton-content">
                    <div class="skeleton-line long"></div>
                    <div class="skeleton-line long"></div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>
        `).join('');
    }

    // Review Management Methods
    async loadReviews(page = 0) {
        try {
            const reviewsGrid = document.getElementById('reviewsGrid');
            if (!reviewsGrid) return;

            // Show loading
            reviewsGrid.innerHTML = '<div class="loading-placeholder"><p>Đang tải đánh giá...</p></div>';

            // Fetch reviews
            const response = await apiClient.getCommentsByTour(this.tourId, {
                page: page,
                size: this.reviewsPerPage,
                sortBy: 'createdAt',
                sortDir: 'desc'
            });

            this.reviews = response.content || [];
            this.currentPage = response.number || 0;
            this.totalPages = response.totalPages || 0;

            // Check if user has already reviewed this tour
            await this.checkUserReview();

            // Render reviews
            this.renderReviews();
            this.renderReviewsPagination();

            // Load rating breakdown
            await this.loadRatingBreakdown();

        } catch (error) {
            console.error('Error loading reviews:', error);
            const reviewsGrid = document.getElementById('reviewsGrid');
            if (reviewsGrid) {
                reviewsGrid.innerHTML = '<div class="error-message"><p>Không thể tải đánh giá. Vui lòng thử lại sau.</p></div>';
            }
        }
    }

    async checkUserReview() {
        if (!apiClient.isAuthenticated()) return;

        try {
            const currentUser = apiClient.getCurrentUser();
            if (!currentUser) return;

            // Check if user has already reviewed this tour
            const userHasReviewed = this.reviews.some(review => 
                review.user.username === currentUser.username
            );

            const writeReviewBtn = document.getElementById('writeReviewBtn');
            if (writeReviewBtn) {
                if (userHasReviewed) {
                    writeReviewBtn.textContent = 'Bạn đã đánh giá tour này';
                    writeReviewBtn.disabled = true;
                    writeReviewBtn.classList.add('disabled');
                } else {
                    writeReviewBtn.textContent = 'Viết đánh giá';
                    writeReviewBtn.disabled = false;
                    writeReviewBtn.classList.remove('disabled');
                }
            }
        } catch (error) {
            console.error('Error checking user review:', error);
        }
    }

    renderReviews() {
        const reviewsGrid = document.getElementById('reviewsGrid');
        if (!reviewsGrid) return;

        if (this.reviews.length === 0) {
            reviewsGrid.innerHTML = `
                <div class="empty-state">
                    <ion-icon name="chatbubbles-outline" class="empty-state-icon"></ion-icon>
                    <h4 class="empty-state-title">Chưa có đánh giá</h4>
                    <p class="empty-state-description">
                        Hãy là người đầu tiên chia sẻ trải nghiệm về tour này
                    </p>
                </div>
            `;
            return;
        }

        const html = this.reviews.map(review => this.renderEnhancedReviewCard(review)).join('');
        reviewsGrid.innerHTML = html;
        
        // Initialize review filters
        this.initializeReviewFilters();
    }

    renderEnhancedReviewCard(review) {
        const stars = this.generateStarRating(review.rating);
        const reviewDate = new Date(review.createdAt).toLocaleDateString('vi-VN');
        const currentUser = apiClient.getCurrentUser();
        const isOwner = currentUser && currentUser.username === review.user.username;
        const timeAgo = this.getTimeAgo(new Date(review.createdAt));

        return `
            <div class="review-card" data-review-id="${review.id}" data-rating="${review.rating}">
                <div class="review-header">
                    <div class="reviewer-avatar">
                        ${review.user.avatarUrl ? 
                            `<img src="${apiClient.getFullImageUrl(review.user.avatarUrl)}" alt="${review.user.fullName || review.user.username}">` :
                            `<div class="default-avatar">
                                <ion-icon name="person-outline"></ion-icon>
                            </div>`
                        }
                    </div>
                    <div class="reviewer-info">
                        <h5 class="reviewer-name">${review.user.fullName || review.user.username}</h5>
                        <div class="review-metadata">
                            <div class="rating-display">
                                <div class="rating-stars">${stars}</div>
                                <span class="rating-number">${review.rating}/5</span>
                            </div>
                            ${review.tourBookingId ? `
                                <div class="verified-indicator" title="Đã trải nghiệm tour">
                                    <ion-icon name="checkmark-circle"></ion-icon>
                                    <span>Đã trải nghiệm</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    ${isOwner ? `
                        <div class="review-actions">
                            <button class="action-btn edit-btn" onclick="tourDetailManager.editReview(${review.id})" title="Chỉnh sửa">
                                <ion-icon name="create-outline"></ion-icon>
                            </button>
                            <button class="action-btn delete-btn" onclick="tourDetailManager.deleteReview(${review.id})" title="Xóa">
                                <ion-icon name="trash-outline"></ion-icon>
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                <div class="review-content">
                    <p>${review.content}</p>
                </div>
                
                <div class="review-footer">
                    <span class="review-date">${reviewDate}</span>
                    <span class="review-time-ago">${timeAgo}</span>
                </div>
            </div>
        `;
    }

    async editReview(reviewId) {
        console.log('Editing review:', reviewId); // Debug log
        
        // Find the review
        const review = this.reviews.find(r => r.id === reviewId);
        if (!review) {
            console.error('Review not found:', reviewId);
            this.showToast('Không tìm thấy đánh giá', 'error');
            return;
        }

        console.log('Found review:', review); // Debug log

        // Show form with existing data
        this.showReviewForm();
        
        // Wait a bit for the form to be rendered and initialized
        setTimeout(() => {
            this.populateEditForm(review);
        }, 500); // Increased timeout further to ensure form is fully rendered
    }

    showReviewForm() {
        console.log('Showing review form...'); // Debug log
        
        const overlay = document.getElementById('reviewFormOverlay');
        const writeBtn = document.getElementById('writeReviewBtn');
        
        console.log('Overlay found:', !!overlay); // Debug log
        console.log('Write button:', writeBtn); // Debug log
        
        // Don't show form if button is disabled (but allow for editing)
        if (writeBtn && writeBtn.disabled && !writeBtn.classList.contains('edit-mode')) {
            console.log('Button is disabled, not showing form');
            return;
        }
        
        if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('Form overlay activated'); // Debug log
            
            // Force display style as well
            overlay.style.display = 'flex';
            
            // Initialize form after showing
            setTimeout(() => {
                this.initializeEnhancedReviewForm();
            }, 100);
        } else {
            console.error('Review form overlay not found!');
        }
    }

    populateEditForm(review) {
        console.log('Populating edit form with review:', review); // Debug log
        
        // Make sure the form is visible first
        const overlay = document.getElementById('reviewFormOverlay');
        if (!overlay || !overlay.classList.contains('active')) {
            console.error('Form overlay is not active!');
            // Try to show it again
            if (overlay) {
                overlay.classList.add('active');
                overlay.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        }
        
        // Populate form content
        const contentElement = document.getElementById('reviewContent');
        if (contentElement) {
            contentElement.value = review.content;
            console.log('Content populated:', review.content);
        } else {
            console.error('Review content element not found');
        }
        
        // Set rating stars
        const stars = document.querySelectorAll('.star-input');
        const starRatingInput = document.getElementById('starRatingInput');
        const ratingFeedback = document.getElementById('ratingFeedback');
        
        console.log('Stars found:', stars.length);
        console.log('Star rating input:', !!starRatingInput);
        console.log('Rating feedback:', !!ratingFeedback);
        
        if (stars && stars.length > 0) {
            // Clear all stars first
            stars.forEach(star => star.classList.remove('selected', 'hover'));
            
            // Set selected stars
            stars.forEach((star, index) => {
                if (index < review.rating) {
                    star.classList.add('selected');
                }
            });
            
            // Store the rating
            if (starRatingInput) {
                starRatingInput.setAttribute('data-selected-rating', review.rating.toString());
                console.log('Rating set to:', review.rating);
            }
            
            // Update feedback text
            const ratingTexts = ['Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'];
            if (ratingFeedback) {
                ratingFeedback.textContent = ratingTexts[review.rating - 1] || 'Chọn số sao';
                console.log('Rating feedback set to:', ratingTexts[review.rating - 1]);
            }
        }

        // Change form to edit mode
        const form = document.getElementById('reviewForm');
        if (form) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> Cập nhật đánh giá';
                console.log('Submit button updated for edit mode');
            }
            
            // Store editing state
            form.dataset.editing = review.id.toString();
            console.log('Form editing ID set to:', review.id);
            
            // Update form title
            const formTitle = document.querySelector('.form-title');
            if (formTitle) {
                formTitle.innerHTML = '<ion-icon name="create-outline"></ion-icon> Chỉnh sửa đánh giá';
                console.log('Form title updated for edit mode');
            }
        } else {
            console.error('Review form not found');
        }
        
        console.log('Edit form populated successfully'); // Debug log
    }

    resetReviewForm() {
        const form = document.getElementById('reviewForm');
        const stars = document.querySelectorAll('.star-input');
        const ratingFeedback = document.getElementById('ratingFeedback');
        const submitBtn = form?.querySelector('button[type="submit"]');
        const starRatingInput = document.getElementById('starRatingInput');
        const formTitle = document.querySelector('.form-title');
        
        if (form) {
            form.reset();
            delete form.dataset.editing;
        }
        if (stars) stars.forEach(star => star.classList.remove('selected', 'hover'));
        if (ratingFeedback) ratingFeedback.textContent = 'Chọn số sao';
        if (submitBtn) {
            submitBtn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> Gửi đánh giá';
        }
        if (starRatingInput) starRatingInput.setAttribute('data-selected-rating', '0');
        if (formTitle) {
            formTitle.innerHTML = '<ion-icon name="star-outline"></ion-icon> Viết đánh giá';
        }
        
        console.log('Form reset completed'); // Debug log
    }

    hideReviewForm() {
        console.log('Hiding review form...'); // Debug log
        
        const overlay = document.getElementById('reviewFormOverlay');
        
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.display = 'none'; // Force hide
            document.body.style.overflow = '';
            console.log('Form overlay hidden');
        }

        this.resetReviewForm();
    }

    async loadRelatedTours() {
        try {
            const relatedGrid = document.getElementById('relatedToursGrid');
            if (!relatedGrid || !this.currentTour) return;

            // Use the backend's related tours endpoint
            const relatedTours = await apiClient.getRelatedTours(this.currentTour.id, 3);

            if (relatedTours && relatedTours.length > 0) {
                this.renderRelatedTours(relatedTours);
            } else {
                relatedGrid.innerHTML = '<p>Không có tour liên quan.</p>';
            }

        } catch (error) {
            console.error('Error loading related tours:', error);
            const relatedGrid = document.getElementById('relatedToursGrid');
            if (relatedGrid) {
                relatedGrid.innerHTML = '<p>Không thể tải tour liên quan.</p>';
            }
        }
    }

    renderRelatedTours(tours) {
        const relatedGrid = document.getElementById('relatedToursGrid');
        if (!relatedGrid) return;        const html = tours.map(tour => `
            <div class="related-tour-card">
                <div class="tour-image">
                    <img src="${apiClient.getFullImageUrl(tour.mainImageUrl) || apiClient.getFullImageUrl(tour.imageUrls?.[0]) || './assets/images/packege-1.jpg'}" 
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
        const clampedRating = Math.max(0, Math.min(5, rating)); // Clamp between 0-5
        const fullStars = Math.floor(clampedRating);
        const hasHalfStar = clampedRating % 1 >= 0.5;
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
        const emptyStars = 5 - Math.ceil(clampedRating);
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

    formatTermsConditions(termsConditions) {
        if (!termsConditions) return '<p>Chưa có điều khoản.</p>';
        
        // Split by lines and format each line
        const lines = termsConditions.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) return '<p>Chưa có điều khoản.</p>';
        
        return lines.map(line => {
            const trimmedLine = line.trim();
            
            // Check if it's a header (all caps or starts with number)
            if (trimmedLine.match(/^\d+\./) || trimmedLine === trimmedLine.toUpperCase()) {
                return `<h4>${trimmedLine}</h4>`;
            }
            
            // Check if it's a list item
            if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
                return `<ul><li>${trimmedLine.substring(1).trim()}</li></ul>`;
            }
            
            // Regular paragraph
            return `<p>${trimmedLine}</p>`;
        }).join('');
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

    getAvailabilityInfo(tour) {
        const availableSlots = tour.maxParticipants - (tour.currentParticipants || 0);
        
        if (tour.status !== 'ACTIVE') {
            return '<span class="unavailable">Tour không khả dụng</span>';
        }
        
        if (availableSlots <= 0) {
            return '<span class="sold-out">Đã hết chỗ</span>';
        }
        
        if (availableSlots <= 5) {
            return `<span class="limited-slots">Chỉ còn ${availableSlots} chỗ</span>`;
        }
        
        return `<span class="available-slots">Còn ${availableSlots} chỗ</span>`;
    }

    renderBookingButton(tour) {
        const availableSlots = tour.maxParticipants - (tour.currentParticipants || 0);
        const isAvailable = tour.status === 'ACTIVE' && availableSlots > 0;
        
        if (!isAvailable) {
            return `
                <button class="btn btn-secondary btn-large" disabled>
                    <ion-icon name="close-outline"></ion-icon>
                    <span>Không khả dụng</span>
                </button>
            `;
        }
        
        return `
            <button class="btn btn-primary btn-large" onclick="tourDetailManager.showBookingModal()">
                <ion-icon name="calendar-outline"></ion-icon>
                <span data-translate="book_now">Đặt ngay</span>
            </button>
        `;
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

                // Load reviews when reviews tab is clicked
                if (tabId === 'reviews' && this.currentTour) {
                    this.loadReviews();
                    // Also load rating breakdown immediately
                    this.loadRatingBreakdown();
                }
            });
        });
    }

    // Add method to update reviews tab count after review actions
    updateReviewsTabCount(newCount) {
        const reviewsTab = document.querySelector('[data-tab="reviews"]');
        if (reviewsTab) {
            reviewsTab.textContent = `Đánh giá (${newCount})`;
        }
    }

    async submitReview(reviewData) {
        try {
            const submitBtn = document.querySelector('#reviewForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Đang gửi...';
            }

            await apiClient.createComment(reviewData);
            
            this.showToast('Đánh giá của bạn đã được gửi thành công!', 'success');
            this.hideReviewForm();
            
            // Reload reviews and update tab count
            await this.loadReviews();
            
            // Get updated comment count and refresh tab
            try {
                const ratingData = await apiClient.getTourRating(this.tourId);
                this.updateReviewsTabCount(ratingData.totalComments || 0);
            } catch (error) {
                console.error('Error updating review count:', error);
            }

        } catch (error) {
            console.error('Error submitting review:', error);
            let errorMessage = 'Có lỗi xảy ra khi gửi đánh giá';
            
            if (error.message.includes('đã bình luận')) {
                errorMessage = 'Bạn đã đánh giá tour này rồi';
            }
            
            this.showToast(errorMessage, 'error');
        } finally {
            const submitBtn = document.querySelector('#reviewForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Gửi đánh giá';
            }
        }
    }

    async updateReview(reviewId, reviewData) {
        try {
            const submitBtn = document.querySelector('#reviewForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Đang cập nhật...';
            }

            await apiClient.updateComment(reviewId, reviewData);
            
            this.showToast('Đánh giá của bạn đã được cập nhật thành công!', 'success');
            this.hideReviewForm();
            
            // Reload reviews and update tab count
            await this.loadReviews();
            
            // Get updated comment count and refresh tab
            try {
                const ratingData = await apiClient.getTourRating(this.tourId);
                this.updateReviewsTabCount(ratingData.totalComments || 0);
            } catch (error) {
                console.error('Error updating review count:', error);
            }

        } catch (error) {
            console.error('Error updating review:', error);
            this.showToast('Có lỗi xảy ra khi cập nhật đánh giá', 'error');
        } finally {
            const submitBtn = document.querySelector('#reviewForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Cập nhật đánh giá';
            }
        }
    }

    async deleteReview(reviewId) {
        if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

        try {
            await apiClient.deleteComment(reviewId);
            this.showToast('Đã xóa đánh giá thành công', 'success');
            
            // Reload reviews and update tab count
            await this.loadReviews();
            
            // Get updated comment count and refresh tab
            try {
                const ratingData = await apiClient.getTourRating(this.tourId);
                this.updateReviewsTabCount(ratingData.totalComments || 0);
            } catch (error) {
                console.error('Error updating review count:', error);
            }
            
        } catch (error) {
            console.error('Error deleting review:', error);
            this.showToast('Có lỗi xảy ra khi xóa đánh giá', 'error');
        }
    }

    renderReviewsPagination() {
        const pagination = document.getElementById('reviewsPagination');
        if (!pagination || this.totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'block';
        
        let html = '<div class="pagination-controls">';
        
        // Previous button
        if (this.currentPage > 0) {
            html += `<button class="btn btn-outline" onclick="tourDetailManager.loadReviews(${this.currentPage - 1})">
                        <ion-icon name="chevron-back-outline"></ion-icon> Trước
                     </button>`;
        }

        // Page numbers
        const startPage = Math.max(0, this.currentPage - 2);
        const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage;
            html += `<button class="btn ${isActive ? 'btn-primary' : 'btn-outline'}" 
                            onclick="tourDetailManager.loadReviews(${i})">${i + 1}</button>`;
        }

        // Next button
        if (this.currentPage < this.totalPages - 1) {
            html += `<button class="btn btn-outline" onclick="tourDetailManager.loadReviews(${this.currentPage + 1})">
                        Sau <ion-icon name="chevron-forward-outline"></ion-icon>
                     </button>`;
        }

        html += '</div>';
        pagination.innerHTML = html;
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Vừa xong';
        }
        
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} phút trước`;
        }
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} giờ trước`;
        }
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) {
            return `${diffInDays} ngày trước`;
        }
        
        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) {
            return `${diffInMonths} tháng trước`;
        }
        
        const diffInYears = Math.floor(diffInMonths / 12);
        return `${diffInYears} năm trước`;
    }

    initializeEnhancedReviewForm() {
        const stars = document.querySelectorAll('.star-input');
        const ratingFeedback = document.getElementById('ratingFeedback');
        const form = document.getElementById('reviewForm');
        const starRatingInput = document.getElementById('starRatingInput');
        
        if (!stars.length || !ratingFeedback || !form || !starRatingInput) {
            console.error('Review form elements not found');
            return;
        }
        
        let selectedRating = parseInt(starRatingInput.getAttribute('data-selected-rating') || '0');
        const ratingTexts = ['Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'];

        console.log('Initializing form with rating:', selectedRating); // Debug log

        // Remove existing event listeners by cloning nodes to avoid conflicts
        const formClone = form.cloneNode(true);
        form.parentNode.replaceChild(formClone, form);
        
        // Get references to the new elements
        const newForm = document.getElementById('reviewForm');
        const newStars = document.querySelectorAll('.star-input');
        const newRatingFeedback = document.getElementById('ratingFeedback');
        const newStarRatingInput = document.getElementById('starRatingInput');

        // Re-initialize rating from the cloned form
        selectedRating = parseInt(newStarRatingInput.getAttribute('data-selected-rating') || '0');

        // Initialize star interactions on new elements
        newStars.forEach((star, index) => {
            const rating = index + 1;
            
            star.addEventListener('mouseover', () => {
                newStars.forEach((s, i) => {
                    if (i <= index) {
                        s.classList.add('hover');
                    } else {
                        s.classList.remove('hover');
                    }
                });
                newRatingFeedback.textContent = ratingTexts[index];
            });

            star.addEventListener('mouseout', () => {
                newStars.forEach(s => s.classList.remove('hover'));
                const currentRating = parseInt(newStarRatingInput.getAttribute('data-selected-rating') || '0');
                if (currentRating > 0) {
                    newRatingFeedback.textContent = ratingTexts[currentRating - 1];
                } else {
                    newRatingFeedback.textContent = 'Chọn số sao';
                }
            });

            star.addEventListener('click', () => {
                selectedRating = rating;
                
                newStars.forEach((s, i) => {
                    if (i < selectedRating) {
                        s.classList.add('selected');
                    } else {
                        s.classList.remove('selected');
                    }
                });
                
                newRatingFeedback.textContent = ratingTexts[selectedRating - 1];
                newStarRatingInput.setAttribute('data-selected-rating', selectedRating.toString());
                
                console.log('Selected rating:', selectedRating); // Debug log
            });
        });

        // Handle form submission on new form
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentRating = parseInt(newStarRatingInput.getAttribute('data-selected-rating') || '0');
            
            console.log('Submitting form with rating:', currentRating); // Debug log
            
            if (currentRating === 0) {
                this.showToast('Vui lòng chọn số sao đánh giá', 'warning');
                return;
            }

            const content = document.getElementById('reviewContent').value.trim();
            if (!content) {
                this.showToast('Vui lòng nhập nội dung đánh giá', 'warning');
                return;
            }

            const reviewData = {
                tourId: this.tourId,
                rating: currentRating,
                content: content
            };

            const editingId = newForm.dataset.editing;
            console.log('Editing ID:', editingId); // Debug log
            
            if (editingId) {
                await this.updateReview(editingId, reviewData);
            } else {
                await this.submitReview(reviewData);
            }
        });

        // Handle overlay click to close
        const overlay = document.getElementById('reviewFormOverlay');
        if (overlay) {
            // Remove existing listeners
            const newOverlay = overlay.cloneNode(true);
            overlay.parentNode.replaceChild(newOverlay, overlay);
            
            newOverlay.addEventListener('click', (e) => {
                if (e.target === newOverlay) {
                    this.hideReviewForm();
                }
            });
        }
    }

    async loadRatingBreakdown() {
        try {
            console.log('Loading rating breakdown for tour:', this.tourId);
            const ratingData = await apiClient.getTourRating(this.tourId);
            console.log('Rating data received:', ratingData);
            this.renderEnhancedRatingBreakdown(ratingData);
        } catch (error) {
            console.error('Error loading rating breakdown:', error);
            // Show fallback breakdown
            this.renderEnhancedRatingBreakdown({
                totalComments: 0,
                averageRating: 0,
                fiveStarCount: 0,
                fourStarCount: 0,
                threeStarCount: 0,
                twoStarCount: 0,
                oneStarCount: 0
            });
        }
    }

    renderEnhancedRatingBreakdown(ratingData) {
        const container = document.getElementById('ratingBarsContainer');
        const positivePercentage = document.getElementById('positivePercentage');
        const recommendPercentage = document.getElementById('recommendPercentage');
        const ratingSummary = document.getElementById('ratingSummary');
        
        if (!container) {
            console.error('Rating bars container not found');
            return;
        }

        const totalComments = ratingData.totalComments || 0;
        
        // Update rating summary
        if (ratingSummary) {
            if (totalComments > 0) {
                ratingSummary.textContent = `Dựa trên ${totalComments} đánh giá`;
            } else {
                ratingSummary.textContent = 'Chưa có đánh giá nào';
            }
        }

        if (totalComments === 0) {
            container.innerHTML = '<p class="empty-state-description">Chưa có đánh giá nào</p>';
            if (positivePercentage) positivePercentage.textContent = '0%';
            if (recommendPercentage) recommendPercentage.textContent = '0%';
            return;
        }

        const starCounts = {
            5: ratingData.fiveStarCount || 0,
            4: ratingData.fourStarCount || 0,
            3: ratingData.threeStarCount || 0,
            2: ratingData.twoStarCount || 0,
            1: ratingData.oneStarCount || 0
        };
        
        console.log('Star counts:', starCounts);
        console.log('Total comments:', totalComments);
        
        // Calculate percentages
        const positiveCount = starCounts[4] + starCounts[5];
        const positivePercent = totalComments > 0 ? Math.round((positiveCount / totalComments) * 100) : 0;
        const recommendPercent = totalComments > 0 ? Math.round((starCounts[5] / totalComments) * 100) : 0;
        
        // Update stats
        if (positivePercentage) positivePercentage.textContent = `${positivePercent}%`;
        if (recommendPercentage) recommendPercentage.textContent = `${recommendPercent}%`;
        
        let html = '';
        
        for (let i = 5; i >= 1; i--) {
            const count = starCounts[i] || 0;
            const percentage = totalComments > 0 ? Math.round((count / totalComments) * 100) : 0;
            
            html += `
                <div class="rating-bar-item">
                    <div class="bar-label">
                        ${i} <ion-icon name="star"></ion-icon>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${percentage}%" data-target-width="${percentage}%"></div>
                    </div>
                    <div class="bar-count">${count}</div>
                    <div class="bar-percentage">${percentage}%</div>
                </div>
            `;
        }
        
        container.innerHTML = html;

        // Animate progress bars
        setTimeout(() => {
            const progressBars = container.querySelectorAll('.progress-fill');
            progressBars.forEach(bar => {
                const targetWidth = bar.getAttribute('data-target-width');
                bar.style.width = '0%';
                setTimeout(() => {
                    bar.style.width = targetWidth;
                }, 100);
            });
        }, 100);
    }

    initializeReviewFilters() {
        const filterChips = document.querySelectorAll('.filter-chip');
        if (!filterChips.length) return;
        
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                // Remove active class from all chips
                filterChips.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked chip
                chip.classList.add('active');
                
                // Get filter value
                const filterValue = chip.getAttribute('data-filter');
                
                // Filter reviews
                this.filterReviews(filterValue);
            });
        });
    }

    filterReviews(filterValue) {
        const reviewCards = document.querySelectorAll('.review-card');
        if (!reviewCards.length) return;
        
        let visibleCount = 0;
        
        reviewCards.forEach(card => {
            const rating = card.getAttribute('data-rating');
            
            if (filterValue === 'all' || rating === filterValue) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Show/hide empty state
        const reviewsGrid = document.getElementById('reviewsGrid');
        if (visibleCount === 0 && reviewsGrid) {
            const existingEmpty = reviewsGrid.querySelector('.filter-empty-state');
            if (!existingEmpty) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state filter-empty-state';
                emptyState.innerHTML = `
                    <ion-icon name="filter-outline" class="empty-state-icon"></ion-icon>
                    <h4 class="empty-state-title">Không có đánh giá ${filterValue} sao</h4>
                    <p class="empty-state-description">Thử chọn bộ lọc khác để xem thêm đánh giá</p>
                `;
                reviewsGrid.appendChild(emptyState);
            }
        } else {
            const existingEmpty = reviewsGrid.querySelector('.filter-empty-state');
            if (existingEmpty) {
                existingEmpty.remove();
            }
        }
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
            this.showToast('Vui lòng đăng nhập để đặt tour', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }

        // Check if tour is available
        if (!this.currentTour) {
            this.showToast('Thông tin tour không hợp lệ', 'error');
            return;
        }

        const availableSlots = this.currentTour.maxParticipants - (this.currentTour.currentParticipants || 0);
        if (availableSlots <= 0) {
            this.showToast('Tour đã hết chỗ', 'error');
            return;
        }

        // For now, redirect to a booking form with tour ID
        // In a full implementation, you would show a booking modal here
        this.showToast('Chuyển hướng đến trang đặt tour...', 'info');
        setTimeout(() => {
            window.location.href = `booking.html?tourId=${this.currentTour.id}`;
        }, 1000);
    }

    async toggleWishlist() {
        if (!apiClient.isAuthenticated()) {
            this.showToast('Vui lòng đăng nhập để sử dụng tính năng này', 'warning');
            return;
        }

        // Implement wishlist functionality
        this.showToast('Tính năng yêu thích sẽ được triển khai sớm!', 'info');
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

// Make sure all methods are properly bound to the class instance
window.addEventListener('DOMContentLoaded', () => {
    // Create a single global instance
    if (!window.tourDetailManager) {
        window.tourDetailManager = new TourDetailManager();
    }
    
    // Ensure all methods are bound to the instance
    const manager = window.tourDetailManager;
    
    // Bind methods to prevent scope issues
    window.editReview = (reviewId) => manager.editReview(reviewId);
    window.deleteReview = (reviewId) => manager.deleteReview(reviewId);
    window.showReviewForm = () => manager.showReviewForm();
    window.hideReviewForm = () => manager.hideReviewForm();
    window.changeMainImage = (src, thumbElement) => manager.changeMainImage(src, thumbElement);
    window.showBookingModal = () => manager.showBookingModal();
    window.toggleWishlist = () => manager.toggleWishlist();
});

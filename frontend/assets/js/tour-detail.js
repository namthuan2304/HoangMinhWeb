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

            // Render tour detail
            this.renderTourDetail(tour);

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

    renderTourDetail(tour) {
        const wrapper = document.getElementById('tourDetailWrapper');
        if (!wrapper) return;        const rating = tour.ratingAverage || 0;
        const reviewCount = tour.totalBookings || 0;
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
                        </div>                        ${images.length > 1 ? `
                            <div class="image-gallery">
                                ${images.map((img, index) => `
                                    <img src="${apiClient.getFullImageUrl(img)}" alt="${tour.name}" 
                                         class="gallery-thumb ${index === 0 ? 'active' : ''}"
                                         onclick="tourDetailManager.changeMainImage('${apiClient.getFullImageUrl(img)}', this)">
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
                                ${tour.termsConditions ? this.formatTermsConditions(tour.termsConditions) : '<p>Điều khoản sẽ được cập nhật sớm.</p>'}
                            </div>
                        </div>                        <div class="tab-pane" id="reviews">
                            <div class="reviews-section">
                                <div class="reviews-header">
                                    <h3>Đánh giá từ khách hàng</h3>
                                </div>
                                
                                <div class="reviews-summary-card">
                                    <div class="rating-overview">
                                        <div class="rating-score-card">
                                            <div class="score-circle">
                                                <span class="score">${rating > 0 ? rating.toFixed(1) : '0.0'}</span>
                                                <span class="score-max">/5</span>
                                            </div>
                                            <div class="stars">${stars}</div>
                                            <span class="review-count">${reviewCount} đánh giá</span>
                                        </div>
                                        
                                        <div class="rating-breakdown" id="ratingBreakdown">
                                            <!-- Rating breakdown will be loaded here -->
                                        </div>
                                    </div>
                                    
                                    <div class="review-action-card">
                                        ${apiClient.isAuthenticated() ? `
                                            <button class="btn btn-primary btn-large" id="writeReviewBtn" onclick="tourDetailManager.showReviewForm()">
                                                <ion-icon name="create-outline"></ion-icon>
                                                Viết đánh giá
                                            </button>
                                            <p class="review-tip">Chia sẻ trải nghiệm của bạn về tour này để giúp người khác có quyết định tốt hơn!</p>
                                        ` : `
                                            <div class="login-prompt-card">
                                                <ion-icon name="lock-closed-outline"></ion-icon>
                                                <p>Bạn cần <a href="login.html">đăng nhập</a> để viết đánh giá</p>
                                            </div>
                                        `}
                                    </div>
                                </div>

                                <!-- Review Form -->
                                <div class="review-form-container" id="reviewFormContainer" style="display: none;">
                                    <div class="review-form">
                                        <div class="form-header">
                                            <h4>Viết đánh giá của bạn</h4>
                                            <button type="button" class="close-btn" onclick="tourDetailManager.hideReviewForm()">
                                                <ion-icon name="close-outline"></ion-icon>
                                            </button>
                                        </div>
                                        <form id="reviewForm">
                                            <div class="rating-input">
                                                <label>Đánh giá của bạn:</label>
                                                <div class="star-rating" id="starRating">
                                                    <span class="star" data-rating="1">★</span>
                                                    <span class="star" data-rating="2">★</span>
                                                    <span class="star" data-rating="3">★</span>
                                                    <span class="star" data-rating="4">★</span>
                                                    <span class="star" data-rating="5">★</span>
                                                </div>
                                                <span class="rating-text" id="ratingText">Chọn số sao</span>
                                            </div>
                                            <div class="form-group">
                                                <label for="reviewContent">Nội dung đánh giá:</label>
                                                <textarea id="reviewContent" rows="4" placeholder="Chia sẻ trải nghiệm của bạn về tour này..." required></textarea>
                                            </div>
                                            <div class="form-actions">
                                                <button type="button" class="btn btn-outline" onclick="tourDetailManager.hideReviewForm()">Hủy</button>
                                                <button type="submit" class="btn btn-primary">Gửi đánh giá</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                <!-- Reviews List -->
                                <div class="reviews-filter">
                                    <div class="filter-label">Lọc đánh giá:</div>
                                    <div class="filter-options">
                                        <button class="filter-btn active" data-filter="all">Tất cả</button>
                                        <button class="filter-btn" data-filter="5">5 sao</button>
                                        <button class="filter-btn" data-filter="4">4 sao</button>
                                        <button class="filter-btn" data-filter="3">3 sao</button>
                                        <button class="filter-btn" data-filter="2">2 sao</button>
                                        <button class="filter-btn" data-filter="1">1 sao</button>
                                    </div>
                                </div>
                                
                                <div class="reviews-list" id="reviewsList">
                                    <div class="loading-placeholder">
                                        <p>Đang tải đánh giá...</p>
                                    </div>
                                </div>

                                <!-- Reviews Pagination -->
                                <div class="reviews-pagination" id="reviewsPagination" style="display: none;">
                                    <!-- Pagination will be rendered here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        wrapper.innerHTML = html;

        // Initialize tabs
        this.initializeTabs();
    }    initializeTabs() {
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
                }
            });
        });
    }

    // Review Management Methods
    async loadReviews(page = 0) {
        try {
            const reviewsList = document.getElementById('reviewsList');
            if (!reviewsList) return;

            // Show loading
            reviewsList.innerHTML = '<div class="loading-placeholder"><p>Đang tải đánh giá...</p></div>';

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
            const reviewsList = document.getElementById('reviewsList');
            if (reviewsList) {
                reviewsList.innerHTML = '<div class="error-message"><p>Không thể tải đánh giá. Vui lòng thử lại sau.</p></div>';
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
        const reviewsList = document.getElementById('reviewsList');
        if (!reviewsList) return;

        if (this.reviews.length === 0) {
            reviewsList.innerHTML = '<div class="no-reviews"><p>Chưa có đánh giá cho tour này.</p></div>';
            return;
        }

        const html = this.reviews.map(review => this.renderSingleReview(review)).join('');
        reviewsList.innerHTML = html;
        
        // Initialize review filters
        this.initializeReviewFilters();
    }
    
    initializeReviewFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        if (!filterButtons.length) return;
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all filter buttons
                filterButtons.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Get filter value
                const filterValue = btn.getAttribute('data-filter');
                
                // Filter reviews
                this.filterReviews(filterValue);
            });
        });
    }
    
    filterReviews(filterValue) {
        const reviewItems = document.querySelectorAll('.review-item');
        if (!reviewItems.length) return;
        
        reviewItems.forEach(item => {
            const rating = item.getAttribute('data-rating');
            
            if (filterValue === 'all' || rating === filterValue) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
        
        // Check if there are no visible reviews after filtering
        const visibleReviews = Array.from(reviewItems).filter(item => item.style.display !== 'none');
        const reviewsList = document.getElementById('reviewsList');
        
        if (visibleReviews.length === 0 && reviewsList) {
            // Append no results message if it doesn't exist
            const noResults = document.querySelector('.no-filter-results');
            if (!noResults) {
                const message = document.createElement('div');
                message.className = 'no-filter-results';
                message.innerHTML = `<p>Không có đánh giá ${filterValue} sao nào.</p>`;
                reviewsList.appendChild(message);
            }
        } else {
            // Remove no results message if it exists
            const noResults = document.querySelector('.no-filter-results');
            if (noResults) {
                noResults.remove();
            }
        }
    }

    renderSingleReview(review) {
        const stars = this.generateStarRating(review.rating);
        const reviewDate = new Date(review.createdAt).toLocaleDateString('vi-VN');
        const currentUser = apiClient.getCurrentUser();
        const isOwner = currentUser && currentUser.username === review.user.username;
        
        // Calculate time ago
        const timeAgo = this.getTimeAgo(new Date(review.createdAt));

        return `
            <div class="review-item" data-review-id="${review.id}" data-rating="${review.rating}">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">
                            ${review.user.avatarUrl ? 
                                `<img src="${apiClient.getFullImageUrl(review.user.avatarUrl)}" alt="${review.user.fullName || review.user.username}">` :
                                `<div class="default-avatar"><ion-icon name="person-outline"></ion-icon></div>`
                            }
                        </div>
                        <div class="reviewer-details">
                            <h5 class="reviewer-name">${review.user.fullName || review.user.username}</h5>
                            <div class="review-meta">
                                <div class="rating-badge rating-${review.rating}">${review.rating} <ion-icon name="star"></ion-icon></div>
                                <span class="review-date" title="${reviewDate}">${timeAgo}</span>
                                ${review.tourBookingId ? `
                                    <div class="verified-badge" title="Người dùng đã đặt tour này">
                                        <ion-icon name="checkmark-circle"></ion-icon>
                                        <span>Đã trải nghiệm tour</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    ${isOwner ? `
                        <div class="review-actions">
                            <button class="btn-icon edit-btn" onclick="tourDetailManager.editReview(${review.id})" title="Chỉnh sửa">
                                <ion-icon name="create-outline"></ion-icon>
                            </button>
                            <button class="btn-icon delete-btn" onclick="tourDetailManager.deleteReview(${review.id})" title="Xóa">
                                <ion-icon name="trash-outline"></ion-icon>
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="review-content">
                    <p>${review.content}</p>
                </div>
                <div class="review-footer">
                    <button class="helpful-btn">
                        <ion-icon name="thumbs-up-outline"></ion-icon>
                        Hữu ích
                    </button>
                </div>
            </div>
        `;
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

    async loadRatingBreakdown() {
        try {
            const ratingData = await apiClient.getTourRating(this.tourId);
            this.renderRatingBreakdown(ratingData);
        } catch (error) {
            console.error('Error loading rating breakdown:', error);
        }
    }

    renderRatingBreakdown(ratingData) {
        const breakdown = document.getElementById('ratingBreakdown');
        if (!breakdown) return;

        const totalComments = ratingData.totalComments || 0;
        if (totalComments === 0) {
            breakdown.innerHTML = '<p class="no-data">Chưa có đánh giá</p>';
            return;
        }

        // Create star breakdown with progress bars
        const starCounts = {
            5: ratingData.fiveStarCount || 0,
            4: ratingData.fourStarCount || 0,
            3: ratingData.threeStarCount || 0,
            2: ratingData.twoStarCount || 0,
            1: ratingData.oneStarCount || 0
        };
        
        let breakdownHtml = '<div class="rating-distribution">';
        
        // Create rating bars from 5 to 1 stars
        for (let i = 5; i >= 1; i--) {
            const count = starCounts[i] || 0;
            const percentage = totalComments > 0 ? Math.round((count / totalComments) * 100) : 0;
            
            breakdownHtml += `
                <div class="rating-bar">
                    <div class="rating-label">${i} <ion-icon name="star"></ion-icon></div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${percentage}%"></div>
                    </div>
                    <div class="rating-count">${count}</div>
                    <div class="rating-percent">${percentage}%</div>
                </div>
            `;
        }
        
        breakdownHtml += '</div>';
        
        // Add summary stats
        breakdownHtml += `
            <div class="rating-stats">
                <div class="stat-item">
                    <span class="label">Tổng đánh giá:</span>
                    <span class="value">${totalComments}</span>
                </div>
                <div class="stat-item">
                    <span class="label">Đánh giá tích cực:</span>
                    <span class="value">${((starCounts[4] + starCounts[5]) / totalComments * 100).toFixed(0)}%</span>
                </div>
            </div>
        `;
        
        breakdown.innerHTML = breakdownHtml;
    }    showReviewForm() {
        const container = document.getElementById('reviewFormContainer');
        const writeBtn = document.getElementById('writeReviewBtn');
        
        // Don't show form if button is disabled
        if (writeBtn && writeBtn.disabled) {
            return;
        }
        
        if (container) {
            container.style.display = 'block';
            container.scrollIntoView({ behavior: 'smooth' });
        }
        
        if (writeBtn) {
            writeBtn.style.display = 'none';
        }

        this.initializeReviewForm();
    }

    hideReviewForm() {
        const container = document.getElementById('reviewFormContainer');
        const writeBtn = document.getElementById('writeReviewBtn');
        
        if (container) {
            container.style.display = 'none';
        }
        
        if (writeBtn) {
            writeBtn.style.display = 'block';
        }

        this.resetReviewForm();
    }    initializeReviewForm() {
        const stars = document.querySelectorAll('#starRating .star');
        const ratingText = document.getElementById('ratingText');
        const form = document.getElementById('reviewForm');
        const starRating = document.getElementById('starRating');
        
        if (!stars.length || !ratingText || !form || !starRating) {
            console.error('Review form elements not found');
            return;
        }
        
        // Get existing rating if editing
        let selectedRating = parseInt(starRating.getAttribute('data-selected-rating') || '0');

        // Clear existing event listeners
        stars.forEach(star => {
            // Clone and replace to remove existing event listeners
            const newStar = star.cloneNode(true);
            star.parentNode.replaceChild(newStar, star);
        });
        
        // Re-select stars after replacing them
        const newStars = document.querySelectorAll('#starRating .star');
        
        // Set initial selection state based on stored rating
        if (selectedRating > 0) {
            newStars.forEach((s, i) => {
                if (i < selectedRating) {
                    s.classList.add('selected');
                }
            });
            const ratingTexts = ['Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'];
            ratingText.textContent = ratingTexts[selectedRating - 1] || 'Chọn số sao';
        }

        // Add new event listeners
        newStars.forEach((star, index) => {
            // Highlight stars on hover
            star.addEventListener('mouseover', () => {
                newStars.forEach((s, i) => {
                    if (i <= index) {
                        s.classList.add('hover');
                    } else {
                        s.classList.remove('hover');
                    }
                });
            });

            // Remove hover highlight when mouse leaves
            star.addEventListener('mouseout', () => {
                newStars.forEach(s => s.classList.remove('hover'));
            });

            // Select stars when clicked
            star.addEventListener('click', () => {
                selectedRating = index + 1;
                
                // Update visual selection
                newStars.forEach((s, i) => {
                    if (i < selectedRating) {
                        s.classList.add('selected');
                    } else {
                        s.classList.remove('selected');
                    }
                });
                
                // Update rating text
                const ratingTexts = ['Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'];
                ratingText.textContent = ratingTexts[index] || 'Chọn số sao';
                
                // Store selected rating as a data attribute
                starRating.setAttribute('data-selected-rating', selectedRating.toString());
                console.log('Selected rating:', selectedRating);
            });
        });

        // Reset and setup form submission
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        // Form submission
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentRating = parseInt(document.getElementById('starRating').getAttribute('data-selected-rating') || '0');
            console.log('Submitting with rating:', currentRating);
            
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

            // Check if editing
            const editingId = newForm.dataset.editing;
            if (editingId) {
                await this.updateReview(editingId, reviewData);
            } else {
                await this.submitReview(reviewData);
            }
        });
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
            
            // Reload reviews and tour data
            await this.loadReviews();
            await this.loadTourDetail(); // Refresh rating in header

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
            
            // Reload reviews and tour data
            await this.loadReviews();
            await this.loadTourDetail(); // Refresh rating in header

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
    }    resetReviewForm() {
        const form = document.getElementById('reviewForm');
        const stars = document.querySelectorAll('#starRating .star');
        const ratingText = document.getElementById('ratingText');
        const submitBtn = form?.querySelector('button[type="submit"]');
        const starRating = document.getElementById('starRating');
        
        if (form) {
            form.reset();
            delete form.dataset.editing;
        }
        if (stars) stars.forEach(star => star.classList.remove('selected', 'hover'));
        if (ratingText) ratingText.textContent = 'Chọn số sao';
        if (submitBtn) submitBtn.textContent = 'Gửi đánh giá';
        if (starRating) starRating.setAttribute('data-selected-rating', '0');
    }    async editReview(reviewId) {
        // Find the review
        const review = this.reviews.find(r => r.id === reviewId);
        if (!review) return;

        // Show form with existing data
        this.showReviewForm();
        
        // Populate form
        const contentElement = document.getElementById('reviewContent');
        if (contentElement) {
            contentElement.value = review.content;
        }
        
        // Set rating
        const stars = document.querySelectorAll('#starRating .star');
        if (stars) {
            stars.forEach((star, index) => {
                if (index < review.rating) {
                    star.classList.add('selected');
                } else {
                    star.classList.remove('selected');
                }
            });
        }
        
        const ratingTexts = ['Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'];
        const ratingTextElement = document.getElementById('ratingText');
        if (ratingTextElement) {
            ratingTextElement.textContent = ratingTexts[review.rating - 1] || 'Chọn số sao';
        }

        // Change form submission to update instead of create
        const form = document.getElementById('reviewForm');
        if (form) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Cập nhật đánh giá';
            }
            
            // Store editing state
            form.dataset.editing = reviewId;
        }
        
        // Update the selected rating variable in the form
        const starRating = document.getElementById('starRating');
        if (starRating) {
            starRating.setAttribute('data-selected-rating', review.rating.toString());
            console.log('Edit review - set rating to:', review.rating);
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
            
            // Reload reviews and tour data
            await this.loadReviews();
            await this.loadTourDetail(); // Refresh rating in header

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
            
            // Reload reviews and tour data
            await this.loadReviews();
            await this.loadTourDetail(); // Refresh rating in header
            
        } catch (error) {
            console.error('Error deleting review:', error);
            this.showToast('Có lỗi xảy ra khi xóa đánh giá', 'error');
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tourDetailManager = new TourDetailManager();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TourDetailManager;
}

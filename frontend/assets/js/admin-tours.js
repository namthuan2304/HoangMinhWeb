// Admin Tours Management
class AdminTours {
    constructor() {
        this.tours = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalItems = 0;
        this.totalPages = 0;
        this.filters = {
            keyword: '',
            status: '',
            category: '',
            priceRange: ''
        };
        
        this.init();
    }

    async init() {
        console.log('Initializing Admin Tours...');
        
        // Check admin authentication
        if (!this.checkAdminAuth()) {
            return;
        }

        // Initialize elements
        this.initializeElements();
        this.bindEvents();
        
        // Debug image URLs
        this.testImageUrls();
        
        // Load initial data
        await this.loadTours();
        
        console.log('Admin Tours initialized successfully');
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
        this.searchInput = document.getElementById('searchInput');
        this.statusFilter = document.getElementById('statusFilter');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.priceRangeFilter = document.getElementById('priceRangeFilter');
        this.clearFiltersBtn = document.getElementById('clearFiltersBtn');
        
        // Table elements
        this.tableWrapper = document.getElementById('toursTableWrapper');
        this.paginationWrapper = document.getElementById('paginationWrapper');
        this.itemsPerPageSelect = document.getElementById('itemsPerPage');
        
        // Action buttons
        this.refreshBtn = document.getElementById('refreshBtn');
        this.addTourBtn = document.getElementById('addTourBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        // Filter events
        this.searchInput.addEventListener('input', this.debounce(() => this.applyFilters(), 500));
        this.statusFilter.addEventListener('change', () => this.applyFilters());
        this.categoryFilter.addEventListener('change', () => this.applyFilters());
        this.priceRangeFilter.addEventListener('change', () => this.applyFilters());
        this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        
        // Table events
        this.itemsPerPageSelect.addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.loadTours();
        });
        
        // Action button events
        this.refreshBtn.addEventListener('click', () => this.loadTours());
        this.addTourBtn.addEventListener('click', () => this.navigateToAddTour());
    }

    async loadTours() {
        this.showLoading(true);
        
        try {
            const params = {
                page: this.currentPage - 1,
                size: this.itemsPerPage,
                sortBy: 'createdAt',
                sortDir: 'desc',
                ...this.filters
            };

            // Handle price range filter
            if (this.filters.priceRange) {
                const [minPrice, maxPrice] = this.filters.priceRange.split('-');
                params.minPrice = minPrice;
                params.maxPrice = maxPrice;
                delete params.priceRange;
            }

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            console.log('Loading tours with params:', params);
            
            // Use the admin-specific endpoint that returns full tour data
            const response = await apiClient.getToursForAdmin(params);
            
            this.tours = response.content || [];
            this.totalItems = response.totalElements || 0;
            this.totalPages = response.totalPages || 0;

            // Debug first tour images
            if (this.tours.length > 0) {
                console.log('First tour for image debugging:');
                this.debugTourImages(this.tours[0]);
            }

            this.renderToursTable();
            this.renderPagination();

        } catch (error) {
            console.error('Error loading tours:', error);
            this.showError('Có lỗi khi tải danh sách tours');
        } finally {
            this.showLoading(false);
        }
    }

    renderToursTable() {
        if (!this.tableWrapper) return;

        if (this.tours.length === 0) {
            this.tableWrapper.innerHTML = `
                <div class="empty-state">
                    <ion-icon name="map-outline"></ion-icon>
                    <h3>Không có tour nào</h3>
                    <p>Không tìm thấy tour nào với điều kiện lọc hiện tại.</p>
                    <button class="btn btn-primary" onclick="adminTours.navigateToAddTour()">
                        <ion-icon name="add-outline"></ion-icon>
                        Thêm Tour Mới
                    </button>
                </div>
            `;
            return;
        }

        const html = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Hình ảnh</th>
                            <th>Tên Tour</th>
                            <th>Điểm đến</th>
                            <th>Giá</th>
                            <th>Thời gian</th>
                            <th>Trạng thái</th>
                            <th>Lượt đặt</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.tours.map(tour => this.renderTourRow(tour)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        this.tableWrapper.innerHTML = html;
    }

    renderTourRow(tour) {
        // Get the first available image URL
        const imageUrl = this.getTourImageUrl(tour);

        return `
            <tr>
                <td>
                    <div class="tour-image">
                        <img src="${imageUrl}" alt="${tour.name}" 
                             onerror="this.src='../assets/images/default-tour.jpg'">
                    </div>
                </td>
                <td>
                    <div class="tour-info">
                        <strong class="tour-name">${tour.name}</strong>
                        <small class="tour-code">ID: ${tour.id}</small>
                    </div>
                </td>
                <td>
                    <span class="tour-destination">${tour.destination}</span>
                </td>
                <td>
                    <div class="tour-price">
                        <span class="price-amount">${this.formatCurrency(tour.price)}</span>
                        ${tour.discountPrice ? `
                            <small class="discount-price">
                                <s>${this.formatCurrency(tour.originalPrice || tour.price)}</s>
                            </small>
                        ` : ''}
                    </div>
                </td>
                <td>
                    <span class="tour-duration">${tour.durationDays} ngày</span>
                </td>
                <td>
                    <span class="badge badge-${this.getStatusColor(tour.status)}">
                        ${this.getStatusText(tour.status)}
                    </span>
                </td>
                <td>
                    <span class="booking-count">${tour.totalBookings || 0}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline" onclick="adminTours.viewTour(${tour.id})" title="Xem chi tiết">
                            <ion-icon name="eye-outline"></ion-icon>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="adminTours.editTour(${tour.id})" title="Chỉnh sửa">
                            <ion-icon name="create-outline"></ion-icon>
                        </button>
                        <button class="btn btn-sm btn-${tour.status === 'ACTIVE' ? 'warning' : 'success'}" 
                                onclick="adminTours.toggleTourStatus(${tour.id}, '${tour.status}')" 
                                title="${tour.status === 'ACTIVE' ? 'Ngừng hoạt động' : 'Kích hoạt'}">
                            <ion-icon name="${tour.status === 'ACTIVE' ? 'pause-outline' : 'play-outline'}"></ion-icon>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminTours.deleteTour(${tour.id})" title="Xóa">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // Add debugging method
    debugTourImages(tour) {
        console.log('Tour data:', tour);
        console.log('Tour images:', tour.images);
        console.log('Tour imageUrls:', tour.imageUrls);
        console.log('Generated image URL:', apiClient.getTourImageUrl(tour));
    }

    // Add this method for debugging
    testImageUrls() {
        // Test different image path formats
        const testPaths = [
            '/uploads/tours/image1.jpg',
            'uploads/tours/image2.jpg',
            'image3.jpg',
            'http://localhost:8080/uploads/tours/image4.jpg'
        ];
        
        console.log('Testing image URL generation:');
        testPaths.forEach(path => {
            console.log(`Input: "${path}" -> Output: "${apiClient.getFullImageUrl(path)}"`);
        });
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
                    trong tổng số ${this.totalItems} tours
                </div>
                <div class="pagination-controls">
                    <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                            onclick="adminTours.goToPage(${this.currentPage - 1})">
                        <ion-icon name="chevron-back-outline"></ion-icon>
                        Trước
                    </button>
                    
                    ${this.generatePageNumbers()}
                    
                    <button class="pagination-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''} 
                            onclick="adminTours.goToPage(${this.currentPage + 1})">
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
                        onclick="adminTours.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        return html;
    }

    applyFilters() {
        this.filters.keyword = this.searchInput.value.trim();
        this.filters.status = this.statusFilter.value;
        this.filters.category = this.categoryFilter.value;
        this.filters.priceRange = this.priceRangeFilter.value;
        
        this.currentPage = 1;
        this.loadTours();
    }

    clearFilters() {
        this.searchInput.value = '';
        this.statusFilter.value = '';
        this.categoryFilter.value = '';
        this.priceRangeFilter.value = '';
        
        this.filters = { keyword: '', status: '', category: '', priceRange: '' };
        this.currentPage = 1;
        this.loadTours();
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        this.loadTours();
    }

    // Tour Actions
    viewTour(tourId) {
        if (tourId) {
            window.open(`../tour-detail.html?id=${tourId}`, '_blank');
        }
    }

    editTour(tourId) {
        if (tourId) {
            window.location.href = `tour-edit.html?id=${tourId}`;
        }
    }

    navigateToAddTour() {
        window.location.href = 'tour-create.html';
    }    async toggleTourStatus(tourId, currentStatus) {
        try {
            const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            const actionText = newStatus === 'ACTIVE' ? 'kích hoạt' : 'ngừng hoạt động';
            
            if (!confirm(`Bạn có chắc chắn muốn ${actionText} tour này?`)) {
                return;
            }

            this.showLoading(true);
            
            await apiClient.updateTourStatus(tourId, newStatus);
            
            this.showToast(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} tour thành công!`, 'success');
            this.loadTours();
            
        } catch (error) {
            console.error('Error toggling tour status:', error);
            this.showToast('Có lỗi khi cập nhật trạng thái tour', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteTour(tourId) {
        try {
            if (!confirm('Bạn có chắc chắn muốn xóa tour này? Hành động này không thể hoàn tác!')) {
                return;
            }

            this.showLoading(true);
            
            await apiClient.deleteTour(tourId);
            
            this.showToast('Xóa tour thành công!', 'success');
            this.loadTours();
            
        } catch (error) {
            console.error('Error deleting tour:', error);
            this.showToast('Có lỗi khi xóa tour', 'error');
        } finally {
            this.showLoading(false);
        }
    }    // Utility methods
    getStatusColor(status) {
        const colors = {
            'ACTIVE': 'success',
            'INACTIVE': 'warning',
            'CANCELLED': 'danger',
            'COMPLETED': 'info',
            'FULL': 'primary'
        };
        return colors[status] || 'secondary';
    }

    getStatusText(status) {
        const texts = {
            'ACTIVE': 'Hoạt động',
            'INACTIVE': 'Ngừng hoạt động',
            'CANCELLED': 'Đã hủy',
            'COMPLETED': 'Hoàn thành',
            'FULL': 'Đã đầy'
        };
        return texts[status] || status;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
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
                    <button class="btn btn-primary" onclick="adminTours.loadTours()">
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

    // Enhanced getTourImageUrl method with better debugging
    getTourImageUrl(tour) {
        if (!tour) {
            console.log('No tour provided');
            return '../assets/images/default-tour.jpg';
        }
        
        console.log('Getting image URL for tour:', tour.name);
        console.log('Tour mainImageUrl:', tour.mainImageUrl);
        console.log('Tour imageUrls:', tour.imageUrls);
        
        // Check mainImageUrl first (from backend)
        if (tour.mainImageUrl) {
            const fullUrl = apiClient.getFullImageUrl(tour.mainImageUrl);
            console.log('Using mainImageUrl:', fullUrl);
            return fullUrl;
        }
        
        // Check imageUrls array
        if (tour.imageUrls && Array.isArray(tour.imageUrls) && tour.imageUrls.length > 0) {
            const fullUrl = apiClient.getFullImageUrl(tour.imageUrls[0]);
            console.log('Using imageUrls[0]:', fullUrl);
            return fullUrl;
        }
        
        // Check images array (alternative field name)
        if (tour.images && Array.isArray(tour.images) && tour.images.length > 0) {
            const fullUrl = apiClient.getFullImageUrl(tour.images[0]);
            console.log('Using images[0]:', fullUrl);
            return fullUrl;
        }
        
        // Check single image field
        if (tour.image || tour.imageUrl) {
            const fullUrl = apiClient.getFullImageUrl(tour.image || tour.imageUrl);
            console.log('Using single image field:', fullUrl);
            return fullUrl;
        }
        
        // Return default image
        console.log('Using default image');
        return '../assets/images/default-tour.jpg';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for API client to be available
    const initTours = () => {
        if (typeof apiClient !== 'undefined' && apiClient) {
            window.adminTours = new AdminTours();
        } else {
            setTimeout(initTours, 100);
        }
    };
    
    initTours();
});

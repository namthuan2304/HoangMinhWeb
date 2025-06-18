/**
 * Admin SPA Components
 * Quản lý và load các components/pages trong SPA
 */

class AdminComponents {
    constructor() {
        this.contentContainer = null;
        this.cache = new Map();
        this.activeComponents = new Map();
    }

    /**
     * Khởi tạo
     */
    init() {
        this.contentContainer = document.getElementById('adminContent');
    }

    /**
     * Load Dashboard
     */
    async loadDashboard() {
        const html = `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <h1>Dashboard</h1>
                    <p>Tổng quan hệ thống quản lý du lịch</p>
                </div>

                <!-- Stats Cards -->
                <div class="stats-grid">
                    <div class="stats-card">
                        <div class="stats-icon">
                            <ion-icon name="map-outline"></ion-icon>
                        </div>
                        <div class="stats-content">
                            <h3 id="totalTours">-</h3>
                            <p>Tổng Tours</p>
                        </div>
                    </div>
                    
                    <div class="stats-card">
                        <div class="stats-icon">
                            <ion-icon name="calendar-outline"></ion-icon>
                        </div>
                        <div class="stats-content">
                            <h3 id="totalBookings">-</h3>
                            <p>Tổng Đặt Tour</p>
                        </div>
                    </div>
                    
                    <div class="stats-card">
                        <div class="stats-icon">
                            <ion-icon name="people-outline"></ion-icon>
                        </div>
                        <div class="stats-content">
                            <h3 id="totalUsers">-</h3>
                            <p>Tổng Người dùng</p>
                        </div>
                    </div>
                    
                    <div class="stats-card">
                        <div class="stats-icon">
                            <ion-icon name="cash-outline"></ion-icon>
                        </div>
                        <div class="stats-content">
                            <h3 id="totalRevenue">-</h3>
                            <p>Doanh thu tháng</p>
                        </div>
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="dashboard-charts">
                    <div class="chart-container">
                        <div class="chart-header">
                            <h3>Doanh thu 12 tháng</h3>
                        </div>
                        <canvas id="revenueChart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-header">
                            <h3>Đặt tour theo tháng</h3>
                        </div>
                        <canvas id="bookingChart"></canvas>
                    </div>
                </div>

                <!-- Recent Activities -->
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>Hoạt động gần đây</h3>
                        <a href="#bookings" class="btn btn-sm btn-outline-primary">Xem tất cả</a>
                    </div>
                    <div class="recent-activities">
                        <div id="recentBookings" class="loading">Đang tải...</div>
                    </div>
                </div>
            </div>
        `;

        this.render(html);
        await this.loadDashboardData();
    }

    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        try {
            // Load stats
            const [dashboardStats, recentBookings] = await Promise.all([
                adminCore.api.request('/admin/dashboard/stats'),
                adminCore.api.request('/bookings/admin?page=0&size=5')
            ]);

            // Update stats
            if (dashboardStats) {
                document.getElementById('totalTours').textContent = dashboardStats.totalTours || 0;
                document.getElementById('totalBookings').textContent = dashboardStats.totalBookings || 0;
                document.getElementById('totalUsers').textContent = dashboardStats.totalUsers || 0;
                document.getElementById('totalRevenue').textContent = 
                    adminCore.formatCurrency(dashboardStats.monthlyRevenue || 0);
            }

            // Load charts
            await this.loadDashboardCharts();

            // Load recent bookings
            this.renderRecentBookings(recentBookings?.content || []);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showToast('Lỗi tải dữ liệu dashboard: ' + error.message, 'error');
        }
    }

    /**
     * Load dashboard charts
     */
    async loadDashboardCharts() {
        try {
            const currentYear = new Date().getFullYear();
            const [revenueData, bookingData] = await Promise.all([
                adminCore.api.request(`/bookings/revenue-by-month?year=${currentYear}`),
                adminCore.api.request(`/bookings/stats-by-month?year=${currentYear}`)
            ]);

            // Revenue chart
            const revenueChart = document.getElementById('revenueChart');
            if (revenueChart) {
                new Chart(revenueChart, {
                    type: 'line',
                    data: {
                        labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
                        datasets: [{
                            label: 'Doanh thu (VNĐ)',
                            data: this.processChartData(revenueData, 'revenue'),
                            borderColor: '#4CAF50',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Booking chart
            const bookingChart = document.getElementById('bookingChart');
            if (bookingChart) {
                new Chart(bookingChart, {
                    type: 'bar',
                    data: {
                        labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
                        datasets: [{
                            label: 'Số đặt tour',
                            data: this.processChartData(bookingData, 'count'),
                            backgroundColor: '#2196F3',
                            borderColor: '#1976D2',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
            }

        } catch (error) {
            console.error('Error loading charts:', error);
        }
    }

    /**
     * Process chart data
     */
    processChartData(data, field) {
        const monthlyData = new Array(12).fill(0);
        
        if (Array.isArray(data)) {
            data.forEach(item => {
                const month = item.month || item[0]; // month could be in different format
                const value = item[field] || item[1];
                if (month >= 1 && month <= 12) {
                    monthlyData[month - 1] = value || 0;
                }
            });
        }
        
        return monthlyData;
    }

    /**
     * Render recent bookings
     */
    renderRecentBookings(bookings) {
        const container = document.getElementById('recentBookings');
        if (!container) return;

        if (bookings.length === 0) {
            container.innerHTML = '<p class="no-data">Chưa có đặt tour nào gần đây</p>';
            return;
        }

        const html = bookings.map(booking => `
            <div class="activity-item">
                <div class="activity-icon">
                    <ion-icon name="calendar-outline"></ion-icon>
                </div>
                <div class="activity-content">
                    <h4>${booking.tour?.name || 'Tour không xác định'}</h4>
                    <p>Khách hàng: ${booking.contactName}</p>
                    <small>
                        ${adminCore.formatDate(booking.createdAt, 'dd/MM/yyyy HH:mm')} - 
                        <span class="status-badge status-${booking.status?.toLowerCase()}">${this.getBookingStatusText(booking.status)}</span>
                    </small>
                </div>
                <div class="activity-amount">
                    ${adminCore.formatCurrency(booking.totalAmount)}
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * Get booking status text
     */
    getBookingStatusText(status) {
        const statusMap = {
            'PENDING': 'Chờ xác nhận',
            'CONFIRMED': 'Đã xác nhận',
            'PAID': 'Đã thanh toán',
            'COMPLETED': 'Hoàn thành',
            'CANCELLED': 'Đã hủy'
        };
        return statusMap[status] || status;
    }

    /**
     * Load Tours page
     */
    async loadTours() {
        const html = `
            <div class="tours-container">
                <div class="page-header">
                    <h1>Quản lý Tours</h1>
                    <div class="page-actions">
                        <a href="#tours/create" class="btn btn-primary">
                            <ion-icon name="add-outline"></ion-icon>
                            Thêm Tour Mới
                        </a>
                    </div>
                </div>

                <!-- Filters -->
                <div class="filters-section">
                    <div class="filters-row">
                        <div class="filter-group">
                            <input type="text" id="tourSearch" placeholder="Tìm kiếm tours..." class="form-control">
                        </div>
                        <div class="filter-group">
                            <select id="tourStatusFilter" class="form-control">
                                <option value="">Tất cả trạng thái</option>
                                <option value="ACTIVE">Hoạt động</option>
                                <option value="INACTIVE">Không hoạt động</option>
                                <option value="DRAFT">Nháp</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <select id="tourTypeFilter" class="form-control">
                                <option value="">Tất cả loại tour</option>
                                <option value="DOMESTIC">Trong nước</option>
                                <option value="INTERNATIONAL">Quốc tế</option>
                            </select>
                        </div>
                        <button id="applyFilters" class="btn btn-secondary">Lọc</button>
                    </div>
                </div>

                <!-- Tours Table -->
                <div class="table-container">
                    <div id="toursTableLoading" class="loading">Đang tải...</div>
                    <div id="toursTable" style="display: none;">
                        <!-- Table will be rendered here -->
                    </div>
                </div>

                <!-- Pagination -->
                <div id="toursPagination" class="pagination-container">
                    <!-- Pagination will be rendered here -->
                </div>
            </div>
        `;

        this.render(html);
        await this.loadToursData();
        this.initToursEvents();
    }

    /**
     * Load tours data
     */
    async loadToursData(page = 0, filters = {}) {
        try {
            const params = {
                page,
                size: adminCore.config.itemsPerPage,
                ...filters
            };

            const response = await adminCore.api.request(`/tours/admin?${new URLSearchParams(params)}`);
            this.renderToursTable(response.content || []);
            this.renderPagination('tours', response, page);

        } catch (error) {
            console.error('Error loading tours:', error);
            showToast('Lỗi tải danh sách tours: ' + error.message, 'error');
        } finally {
            this.hideTableLoading('tours');
        }
    }

    /**
     * Render tours table
     */
    renderToursTable(tours) {
        const tableContainer = document.getElementById('toursTable');
        if (!tableContainer) return;

        if (tours.length === 0) {
            tableContainer.innerHTML = '<div class="no-data">Không có tours nào</div>';
            tableContainer.style.display = 'block';
            return;
        }

        const html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Hình ảnh</th>
                        <th>Tên Tour</th>
                        <th>Điểm đến</th>
                        <th>Giá</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    ${tours.map(tour => `
                        <tr>
                            <td>
                                <div class="tour-image">
                                    <img src="${tour.mainImage || '../assets/images/default-tour.jpg'}" 
                                         alt="${tour.name}" 
                                         onerror="this.src='../assets/images/default-tour.jpg'">
                                </div>
                            </td>
                            <td>
                                <div class="tour-info">
                                    <h4>${tour.name}</h4>
                                    <small>${tour.duration} ngày</small>
                                </div>
                            </td>
                            <td>${tour.destination}</td>
                            <td>${adminCore.formatCurrency(tour.price)}</td>
                            <td>
                                <span class="status-badge status-${tour.status?.toLowerCase()}">
                                    ${this.getTourStatusText(tour.status)}
                                </span>
                            </td>
                            <td>${adminCore.formatDate(tour.createdAt)}</td>
                            <td>
                                <div class="action-buttons">
                                    <a href="#tours/${tour.id}/edit" class="btn btn-sm btn-outline-primary" title="Chỉnh sửa">
                                        <ion-icon name="create-outline"></ion-icon>
                                    </a>
                                    <button class="btn btn-sm btn-outline-danger" 
                                            onclick="adminComponents.deleteTour(${tour.id})" 
                                            title="Xóa">
                                        <ion-icon name="trash-outline"></ion-icon>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        tableContainer.innerHTML = html;
        tableContainer.style.display = 'block';
    }

    /**
     * Get tour status text
     */
    getTourStatusText(status) {
        const statusMap = {
            'ACTIVE': 'Hoạt động',
            'INACTIVE': 'Không hoạt động',
            'DRAFT': 'Nháp'
        };
        return statusMap[status] || status;
    }

    /**
     * Initialize tours events
     */
    initToursEvents() {
        const searchInput = document.getElementById('tourSearch');
        const statusFilter = document.getElementById('tourStatusFilter');
        const typeFilter = document.getElementById('tourTypeFilter');
        const applyFilters = document.getElementById('applyFilters');

        // Search with debounce
        if (searchInput) {
            searchInput.addEventListener('input', adminCore.debounce((e) => {
                this.filterTours();
            }, 500));
        }

        // Filter change events
        [statusFilter, typeFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => this.filterTours());
            }
        });

        // Apply filters button
        if (applyFilters) {
            applyFilters.addEventListener('click', () => this.filterTours());
        }
    }

    /**
     * Filter tours
     */
    filterTours(page = 0) {
        const filters = {
            keyword: document.getElementById('tourSearch')?.value || '',
            status: document.getElementById('tourStatusFilter')?.value || '',
            tourType: document.getElementById('tourTypeFilter')?.value || ''
        };

        // Remove empty filters
        Object.keys(filters).forEach(key => {
            if (!filters[key]) delete filters[key];
        });

        this.showTableLoading('tours');
        this.loadToursData(page, filters);
    }

    /**
     * Delete tour
     */
    async deleteTour(tourId) {
        const confirmed = await adminCore.showConfirm(
            'Bạn có chắc chắn muốn xóa tour này?',
            { title: 'Xác nhận xóa tour', confirmText: 'Xóa' }
        );

        if (!confirmed) return;

        try {
            await adminCore.api.request(`/tours/${tourId}`, { method: 'DELETE' });
            showToast('Xóa tour thành công', 'success');
            this.filterTours(); // Reload current page
        } catch (error) {
            console.error('Error deleting tour:', error);
            showToast('Lỗi xóa tour: ' + error.message, 'error');
        }
    }

    /**
     * Load other pages (placeholder implementations)
     */
    async loadTourCreate() {
        this.render('<div class="loading">Đang tải form thêm tour...</div>');
        // TODO: Implement tour create form
    }

    async loadTourEdit(tourId) {
        this.render(`<div class="loading">Đang tải form chỉnh sửa tour ${tourId}...</div>`);
        // TODO: Implement tour edit form
    }

    async loadBookings() {
        this.render('<div class="loading">Đang tải danh sách đặt tour...</div>');
        // TODO: Implement bookings list
    }

    async loadBookingDetail(bookingId) {
        this.render(`<div class="loading">Đang tải chi tiết đặt tour ${bookingId}...</div>`);
        // TODO: Implement booking detail
    }

    async loadUsers() {
        this.render('<div class="loading">Đang tải danh sách người dùng...</div>');
        // TODO: Implement users list
    }

    async loadArticles() {
        this.render('<div class="loading">Đang tải danh sách bài viết...</div>');
        // TODO: Implement articles list
    }

    async loadArticleCreate() {
        this.render('<div class="loading">Đang tải form thêm bài viết...</div>');
        // TODO: Implement article create form
    }

    async loadArticleEdit(articleId) {
        this.render(`<div class="loading">Đang tải form chỉnh sửa bài viết ${articleId}...</div>`);
        // TODO: Implement article edit form
    }

    async loadComments() {
        this.render('<div class="loading">Đang tải danh sách bình luận...</div>');
        // TODO: Implement comments list
    }

    async loadRevenueReport() {
        this.render('<div class="loading">Đang tải báo cáo doanh thu...</div>');
        // TODO: Implement revenue report
    }

    async loadToursReport() {
        this.render('<div class="loading">Đang tải báo cáo tours...</div>');
        // TODO: Implement tours report
    }

    async loadUsersReport() {
        this.render('<div class="loading">Đang tải báo cáo người dùng...</div>');
        // TODO: Implement users report
    }

    async load404() {
        this.render(`
            <div class="error-page">
                <div class="error-content">
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <h2>Không tìm thấy trang</h2>
                    <p>Trang bạn đang tìm kiếm không tồn tại.</p>
                    <a href="#dashboard" class="btn btn-primary">Về Dashboard</a>
                </div>
            </div>
        `);
    }

    /**
     * Render content
     */
    render(html) {
        if (this.contentContainer) {
            this.contentContainer.innerHTML = html;
        }
    }

    /**
     * Show table loading
     */
    showTableLoading(table) {
        const loading = document.getElementById(`${table}TableLoading`);
        const tableDiv = document.getElementById(`${table}Table`);
        
        if (loading) loading.style.display = 'block';
        if (tableDiv) tableDiv.style.display = 'none';
    }

    /**
     * Hide table loading
     */
    hideTableLoading(table) {
        const loading = document.getElementById(`${table}TableLoading`);
        if (loading) loading.style.display = 'none';
    }

    /**
     * Render pagination
     */
    renderPagination(table, response, currentPage) {
        const container = document.getElementById(`${table}Pagination`);
        if (!container || !response) return;

        const { totalPages, totalElements, size, number } = response;
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const startItem = (number * size) + 1;
        const endItem = Math.min((number + 1) * size, totalElements);

        let html = `
            <div class="pagination-info">
                Hiển thị ${startItem}-${endItem} trong tổng số ${totalElements} kết quả
            </div>
            <div class="pagination-controls">
        `;

        // Previous button
        if (number > 0) {
            html += `<button class="pagination-btn" onclick="adminComponents.changePage('${table}', ${number - 1})">
                <ion-icon name="chevron-back-outline"></ion-icon>
            </button>`;
        }

        // Page numbers
        const startPage = Math.max(0, number - 2);
        const endPage = Math.min(totalPages - 1, number + 2);

        for (let i = startPage; i <= endPage; i++) {
            const active = i === number ? 'active' : '';
            html += `<button class="pagination-btn ${active}" onclick="adminComponents.changePage('${table}', ${i})">
                ${i + 1}
            </button>`;
        }

        // Next button
        if (number < totalPages - 1) {
            html += `<button class="pagination-btn" onclick="adminComponents.changePage('${table}', ${number + 1})">
                <ion-icon name="chevron-forward-outline"></ion-icon>
            </button>`;
        }

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Change page
     */
    changePage(table, page) {
        switch (table) {
            case 'tours':
                this.filterTours(page);
                break;
            // Add other tables here
        }
    }
}

// Export components instance
window.adminComponents = new AdminComponents();

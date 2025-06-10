// Admin Dashboard Management
class AdminDashboard {
    constructor() {
        this.charts = {};
        this.currentYear = new Date().getFullYear();
        this.refreshInterval = null;
        
        this.init();
    }

    async init() {
        console.log('Initializing Admin Dashboard...');
        
        // Check admin authentication
        if (!this.checkAdminAuth()) {
            return;
        }

        // Initialize UI elements
        this.initializeElements();
        this.bindEvents();
        
        // Load dashboard data
        await this.loadDashboardData();
        
        // Initialize charts
        this.initializeCharts();
        
        // Set up auto refresh
        this.setupAutoRefresh();
        
        console.log('Admin Dashboard initialized successfully');
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
        // Stats elements
        this.statsElements = {
            totalUsers: document.getElementById('totalUsers'),
            totalTours: document.getElementById('totalTours'),
            totalBookings: document.getElementById('totalBookings'),
            totalRevenue: document.getElementById('totalRevenue'),
            userGrowth: document.getElementById('userGrowth'),
            tourGrowth: document.getElementById('tourGrowth'),
            bookingGrowth: document.getElementById('bookingGrowth'),
            revenueGrowth: document.getElementById('revenueGrowth')
        };

        // Chart elements
        this.chartElements = {
            revenueChart: document.getElementById('revenueChart'),
            userChart: document.getElementById('userChart'),
            revenueYearSelect: document.getElementById('revenueYearSelect'),
            userYearSelect: document.getElementById('userYearSelect')
        };

        // Table elements
        this.tableElements = {
            topToursTable: document.getElementById('topToursTable').querySelector('tbody'),
            recentBookingsTable: document.getElementById('recentBookingsTable').querySelector('tbody')
        };

        // System status elements
        this.systemElements = {
            systemStatus: document.getElementById('systemStatus'),
            serverTime: document.getElementById('serverTime'),
            activeTours: document.getElementById('activeTours'),
            publishedArticles: document.getElementById('publishedArticles')
        };

        // Action buttons
        this.refreshBtn = document.getElementById('refreshBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        // Refresh button
        this.refreshBtn.addEventListener('click', () => {
            this.loadDashboardData();
        });

        // Export button
        this.exportBtn.addEventListener('click', () => {
            this.exportReport();
        });

        // Year selectors
        this.chartElements.revenueYearSelect.addEventListener('change', (e) => {
            this.loadRevenueChart(parseInt(e.target.value));
        });

        this.chartElements.userYearSelect.addEventListener('change', (e) => {
            this.loadUserChart(parseInt(e.target.value));
        });
    }

    async loadDashboardData() {
        this.showLoading(true);
        
        try {
            // Load all dashboard data in parallel
            const [
                dashboardStats,
                topTours,
                recentBookings,
                systemActivity
            ] = await Promise.all([
                apiClient.getDashboard(),
                apiClient.getTopBookedTours(5),
                apiClient.getBookings({ page: 0, size: 5, sortBy: 'createdAt', sortDir: 'desc' }),
                apiClient.request('/statistics/system-activity')
            ]);

            // Update stats
            this.updateStats(dashboardStats);
            
            // Update tables
            this.updateTopToursTable(topTours);
            this.updateRecentBookingsTable(recentBookings.content || []);
            
            // Update system status
            this.updateSystemStatus(systemActivity);
            
            // Load charts
            await this.loadCharts();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showToast('Có lỗi khi tải dữ liệu dashboard', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateStats(stats) {
        // ...existing code...
        if (this.statsElements.totalUsers) {
            this.statsElements.totalUsers.textContent = this.formatNumber(stats.totalUsers || 0);
        }
        if (this.statsElements.totalTours) {
            this.statsElements.totalTours.textContent = this.formatNumber(stats.totalTours || 0);
        }
        if (this.statsElements.totalBookings) {
            this.statsElements.totalBookings.textContent = this.formatNumber(stats.totalBookings || 0);
        }
        if (this.statsElements.totalRevenue) {
            this.statsElements.totalRevenue.textContent = this.formatCurrency(stats.currentMonthRevenue || 0);
        }

        // Update growth indicators
        this.updateGrowthIndicator(this.statsElements.userGrowth, stats.newUsersThisMonth || 0);
        this.updateGrowthIndicator(this.statsElements.bookingGrowth, stats.newBookingsThisMonth || 0);
    }

    updateGrowthIndicator(element, value) {
        if (!element) return;
        
        element.textContent = `+${this.formatNumber(value)} tháng này`;
        element.className = value > 0 ? 'stat-change positive' : 'stat-change neutral';
    }

    async loadCharts() {
        await Promise.all([
            this.loadRevenueChart(this.currentYear),
            this.loadUserChart(this.currentYear)
        ]);
    }

    async loadRevenueChart(year) {
        try {
            const data = await apiClient.request(`/statistics/revenue/monthly?year=${year}`);
            this.updateRevenueChart(data);
        } catch (error) {
            console.error('Error loading revenue chart:', error);
        }
    }

    async loadUserChart(year) {
        try {
            const data = await apiClient.request(`/statistics/users/monthly?year=${year}`);
            this.updateUserChart(data);
        } catch (error) {
            console.error('Error loading user chart:', error);
        }
    }

    initializeCharts() {
        // Revenue Chart
        const revenueCtx = this.chartElements.revenueChart.getContext('2d');
        this.charts.revenue = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
                datasets: [{
                    label: 'Doanh thu (VNĐ)',
                    data: [],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                }
            }
        });

        // User Chart
        const userCtx = this.chartElements.userChart.getContext('2d');
        this.charts.user = new Chart(userCtx, {
            type: 'bar',
            data: {
                labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
                datasets: [{
                    label: 'Người dùng mới',
                    data: [],
                    backgroundColor: '#28a745',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    updateRevenueChart(data) {
        const monthlyData = new Array(12).fill(0);
        
        data.forEach(([month, revenue]) => {
            monthlyData[month - 1] = revenue || 0;
        });

        this.charts.revenue.data.datasets[0].data = monthlyData;
        this.charts.revenue.update();
    }

    updateUserChart(data) {
        const monthlyData = new Array(12).fill(0);
        
        data.forEach(([month, count]) => {
            monthlyData[month - 1] = count || 0;
        });

        this.charts.user.data.datasets[0].data = monthlyData;
        this.charts.user.update();
    }

    updateTopToursTable(tours) {
        const tbody = this.tableElements.topToursTable;
        tbody.innerHTML = '';

        if (!tours || tours.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Không có dữ liệu</td></tr>';
            return;
        }

        tours.forEach(([tourName, bookingCount, revenue, rating]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="tour-info">
                        <strong>${tourName}</strong>
                    </div>
                </td>
                <td><span class="badge badge-info">${this.formatNumber(bookingCount)}</span></td>
                <td><strong>${this.formatCurrency(revenue || 0)}</strong></td>
                <td>
                    <div class="rating">
                        ${this.renderStars(rating || 0)}
                        <span>${(rating || 0).toFixed(1)}</span>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }    updateRecentBookingsTable(bookings) {
        const tbody = this.tableElements.recentBookingsTable;
        tbody.innerHTML = '';

        if (!bookings || bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Không có dữ liệu</td></tr>';
            return;
        }

        bookings.forEach(booking => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <code>${booking.invoiceNumber || booking.id}</code>
                </td>
                <td>
                    <div class="user-info">
                        <strong>${booking.contactName || 'N/A'}</strong>
                        <small>${booking.contactEmail || 'N/A'}</small>
                    </div>
                </td>
                <td>
                    <div class="tour-info">
                        <strong>${booking.tourName || 'N/A'}</strong>
                    </div>
                </td>
                <td>
                    <span class="badge badge-${this.getStatusColor(booking.status)}">
                        ${this.getStatusText(booking.status)}
                    </span>
                </td>                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline" onclick="adminDashboard.viewBookingDetail(${booking.id})">
                            <ion-icon name="eye-outline"></ion-icon>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateSystemStatus(systemActivity) {
        if (this.systemElements.serverTime) {
            this.systemElements.serverTime.textContent = systemActivity.serverTime || '-';
        }
        if (this.systemElements.activeTours) {
            this.systemElements.activeTours.textContent = this.formatNumber(systemActivity.activeTours || 0);
        }
        if (this.systemElements.publishedArticles) {
            this.systemElements.publishedArticles.textContent = this.formatNumber(systemActivity.publishedArticles || 0);
        }
    }

    setupAutoRefresh() {
        // Refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
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
            a.download = `bao-cao-dashboard-${currentDate.getFullYear()}-${currentDate.getMonth() + 1}.pdf`;
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

    // Navigation methods
    viewBookingDetail(bookingId) {
        if (bookingId) {
            window.location.href = `booking-detail.html?id=${bookingId}`;
        }
    }

    navigateToBookings() {
        window.location.href = 'bookings.html';
    }

    navigateToTours() {
        window.location.href = 'tours.html';
    }

    // Utility methods
    formatNumber(num) {
        return new Intl.NumberFormat('vi-VN').format(num);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars += '<ion-icon name="star"></ion-icon>';
            } else if (i === fullStars && hasHalfStar) {
                stars += '<ion-icon name="star-half"></ion-icon>';
            } else {
                stars += '<ion-icon name="star-outline"></ion-icon>';
            }
        }

        return stars;
    }

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

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for API client to be available
    const initDashboard = () => {
        if (typeof apiClient !== 'undefined' && apiClient) {
            window.adminDashboard = new AdminDashboard();
        } else {
            setTimeout(initDashboard, 100);
        }
    };
    
    initDashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.adminDashboard) {
        window.adminDashboard.destroy();
    }
});
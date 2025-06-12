/**
 * Admin Reports Tours - Tour Statistics Management
 */

class AdminReportsTours {
    constructor() {
        this.currentTimeRange = '30';
        this.currentCategory = 'all';
        this.currentStatus = 'all';
        this.charts = {};
        this.init();
    }

    async init() {
        try {
            // Show loading
            this.showLoading(true);

            // Initialize components
            this.setupEventListeners();
            await this.loadInitialData();
            
            // Hide loading
            this.showLoading(false);
        } catch (error) {
            console.error('Error initializing tour reports:', error);
            this.showError('Có lỗi xảy ra khi tải dữ liệu thống kê');
        }
    }

    setupEventListeners() {
        // Filter handlers
        const timeRangeSelect = document.getElementById('timeRangeSelect');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', (e) => {
                this.currentTimeRange = e.target.value;
                this.refreshData();
            });
        }

        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.refreshData();
            });
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentStatus = e.target.value;
                this.refreshData();
            });
        }

        // Chart type selector
        const trendChartType = document.getElementById('trendChartType');
        if (trendChartType) {
            trendChartType.addEventListener('change', (e) => {
                this.refreshTrendChart(e.target.value);
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportReport();
            });
        }
    }

    async loadInitialData() {
        try {
            // Load all data concurrently
            await Promise.all([
                this.loadStatsOverview(),
                this.loadPerformanceMetrics(),
                this.loadBookingTrendsChart(),
                this.loadDestinationsChart(),
                this.loadCategoriesChart(),
                this.loadTopTours(),
                this.loadRecentTours()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            throw error;
        }
    }

    async refreshData() {
        try {
            this.showLoading(true);
            await this.loadInitialData();
            this.showLoading(false);
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.showError('Có lỗi xảy ra khi làm mới dữ liệu');
            this.showLoading(false);
        }
    }

    async loadStatsOverview() {
        try {
            const stats = await this.fetchTourStats();
            
            this.updateStatCard('totalToursCount', stats.totalTours, stats.totalToursChange);
            this.updateStatCard('totalBookingsCount', stats.totalBookings, stats.totalBookingsChange);
            this.updateStatCard('totalRevenueAmount', this.formatCurrency(stats.totalRevenue), stats.totalRevenueChange);
            this.updateStatCard('averageRating', `${stats.averageRating}/5`, stats.averageRatingChange);
        } catch (error) {
            console.error('Error loading stats overview:', error);
        }
    }

    updateStatCard(valueId, value, change) {
        const valueElement = document.getElementById(valueId);
        const changeElement = document.getElementById(valueId.replace('Count', 'Change').replace('Amount', 'Change'));
        
        if (valueElement) {
            valueElement.textContent = value;
        }
        
        if (changeElement && change !== undefined) {
            changeElement.textContent = change > 0 ? `+${change}%` : `${change}%`;
            changeElement.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
        }
    }

    async loadPerformanceMetrics() {
        try {
            const metrics = await this.fetchPerformanceMetrics();
            
            this.updateMetric('bookingRate', metrics.bookingRate);
            this.updateMetric('completionRate', metrics.completionRate);
            this.updateMetric('cancellationRate', metrics.cancellationRate);
        } catch (error) {
            console.error('Error loading performance metrics:', error);
        }
    }

    updateMetric(metricId, value) {
        const valueElement = document.getElementById(metricId);
        const progressElement = document.getElementById(metricId + 'Progress');
        
        if (valueElement) {
            valueElement.textContent = `${value}%`;
        }
        
        if (progressElement) {
            progressElement.style.width = `${value}%`;
            
            // Color coding based on metric type
            let colorClass = '';
            if (metricId === 'bookingRate' || metricId === 'completionRate') {
                colorClass = value >= 70 ? 'success' : value >= 50 ? 'warning' : 'danger';
            } else if (metricId === 'cancellationRate') {
                colorClass = value <= 15 ? 'success' : value <= 30 ? 'warning' : 'danger';
            }
            
            progressElement.className = `metric-progress ${colorClass}`;
        }
    }

    async loadBookingTrendsChart() {
        try {
            const data = await this.fetchBookingTrendsData();
            
            const ctx = document.getElementById('bookingTrendsChart');
            if (!ctx) return;

            // Destroy existing chart
            if (this.charts.bookingTrends) {
                this.charts.bookingTrends.destroy();
            }

            this.charts.bookingTrends = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [
                        {
                            label: 'Lượt đặt tour',
                            data: data.bookings,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Doanh thu',
                            data: data.revenue,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: false,
                            tension: 0.4,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    if (context.datasetIndex === 1) {
                                        return `${context.dataset.label}: ${new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND'
                                        }).format(context.parsed.y)}`;
                                    }
                                    return `${context.dataset.label}: ${context.parsed.y}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Thời gian'
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Lượt đặt'
                            },
                            beginAtZero: true
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Doanh thu (VND)'
                            },
                            grid: {
                                drawOnChartArea: false,
                            },
                            beginAtZero: true
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    }
                }
            });
        } catch (error) {
            console.error('Error loading booking trends chart:', error);
        }
    }

    async loadDestinationsChart() {
        try {
            const data = await this.fetchDestinationsData();
            
            const ctx = document.getElementById('destinationsChart');
            if (!ctx) return;

            if (this.charts.destinations) {
                this.charts.destinations.destroy();
            }

            this.charts.destinations = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Lượt đặt',
                        data: data.values,
                        backgroundColor: [
                            '#3b82f6',
                            '#10b981',
                            '#f59e0b',
                            '#ef4444',
                            '#8b5cf6',
                            '#06b6d4',
                            '#84cc16',
                            '#f97316',
                            '#ec4899',
                            '#6366f1'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Lượt đặt'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Điểm đến'
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading destinations chart:', error);
        }
    }

    async loadCategoriesChart() {
        try {
            const data = await this.fetchCategoriesData();
            
            const ctx = document.getElementById('categoriesChart');
            if (!ctx) return;

            if (this.charts.categories) {
                this.charts.categories.destroy();
            }

            this.charts.categories = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        backgroundColor: [
                            '#3b82f6',
                            '#10b981',
                            '#f59e0b',
                            '#ef4444',
                            '#8b5cf6',
                            '#06b6d4'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed * 100) / total).toFixed(1);
                                    return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading categories chart:', error);
        }
    }

    async loadTopTours() {
        try {
            const tours = await this.fetchTopTours();
            const tbody = document.querySelector('#topToursTable tbody');
            
            if (!tbody) return;

            tbody.innerHTML = tours.map(tour => `
                <tr>
                    <td>
                        <div class="tour-info">
                            <div class="tour-image">
                                ${tour.image ? `<img src="${tour.image}" alt="${tour.name}">` : 
                                  `<ion-icon name="image-outline"></ion-icon>`}
                            </div>
                            <div class="tour-details">
                                <span class="tour-name">${tour.name}</span>
                                <span class="tour-code">#${tour.code}</span>
                            </div>
                        </div>
                    </td>
                    <td>${tour.destination}</td>
                    <td>${tour.bookings}</td>
                    <td class="amount">${this.formatCurrency(tour.revenue)}</td>
                    <td>
                        <div class="rating">
                            <span class="rating-value">${tour.rating}</span>
                            <div class="stars">
                                ${this.renderStars(tour.rating)}
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${tour.status}">${tour.statusText}</span>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading top tours:', error);
            this.showTableError('topToursTable', 'Không thể tải danh sách tours hiệu quả nhất');
        }
    }

    async loadRecentTours() {
        try {
            const tours = await this.fetchRecentTours();
            const tbody = document.querySelector('#recentToursTable tbody');
            
            if (!tbody) return;

            tbody.innerHTML = tours.map(tour => `
                <tr>
                    <td>
                        <div class="tour-info">
                            <div class="tour-image">
                                ${tour.image ? `<img src="${tour.image}" alt="${tour.name}">` : 
                                  `<ion-icon name="image-outline"></ion-icon>`}
                            </div>
                            <div class="tour-details">
                                <span class="tour-name">${tour.name}</span>
                                <span class="tour-code">#${tour.code}</span>
                            </div>
                        </div>
                    </td>
                    <td>${tour.destination}</td>
                    <td class="amount">${this.formatCurrency(tour.price)}</td>
                    <td>${this.formatDate(tour.createdAt)}</td>
                    <td>
                        <span class="status-badge ${tour.status}">${tour.statusText}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="adminReportsTours.viewTour(${tour.id})" title="Xem chi tiết">
                                <ion-icon name="eye-outline"></ion-icon>
                            </button>
                            <button class="btn-icon" onclick="adminReportsTours.editTour(${tour.id})" title="Chỉnh sửa">
                                <ion-icon name="create-outline"></ion-icon>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading recent tours:', error);
            this.showTableError('recentToursTable', 'Không thể tải danh sách tours mới nhất');
        }
    }    // API Methods - Real API calls
    async fetchTourStats() {
        try {
            const [totalTours, newTours, averageRating, bookingStats] = await Promise.all([
                apiClient.request('/statistics/tours/total'),
                apiClient.request('/statistics/tours/new-tours?days=30'),
                apiClient.request('/statistics/tours/average-rating'),
                apiClient.request('/statistics/bookings/total')
            ]);
            
            return {
                totalTours: totalTours.count || 0,
                totalToursChange: totalTours.growthRate || 0,
                totalBookings: bookingStats.count || 0,
                totalBookingsChange: bookingStats.growthRate || 0,
                totalRevenue: bookingStats.revenue || 0,
                totalRevenueChange: bookingStats.revenueGrowthRate || 0,
                averageRating: averageRating.rating || 0,
                averageRatingChange: averageRating.change || 0
            };        } catch (error) {
            console.error('Error fetching tour stats:', error);
            throw error;
        }
    }

    async fetchPerformanceMetrics() {
        try {
            const [bookingRate, completionRate, cancellationRate] = await Promise.all([
                apiClient.request('/statistics/tours/booking-rate'),
                apiClient.request('/statistics/bookings/completion-rate'),
                apiClient.request('/statistics/bookings/cancellation-rate')
            ]);
            
            return {
                bookingRate: Math.round(bookingRate.rate || 0),
                completionRate: Math.round(completionRate.rate || 0),
                cancellationRate: Math.round(cancellationRate.rate || 0)
            };
        } catch (error) {
            console.error('Error fetching performance metrics:', error);
            throw error;
        }
    }async fetchBookingTrendsData() {
        try {
            const data = await apiClient.request(`/statistics/bookings/trends?days=${this.currentTimeRange}&type=daily`);
            
            // API returns array of arrays: [date, count]
            const labels = data.map(item => {
                const date = new Date(item[0]);
                return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
            });
            
            const bookings = data.map(item => item[1] || 0);
            
            // For now, we'll generate mock revenue data based on bookings
            // TODO: Backend should include revenue in the trends data
            const revenue = bookings.map(count => count * 2500000); // Estimate 2.5M VND per booking
            
            return { labels, bookings, revenue };        } catch (error) {
            console.error('Error fetching booking trends data:', error);
            throw error;
        }
    }async fetchDestinationsData() {
        try {
            const data = await apiClient.request('/statistics/tours/popular-destinations?limit=10');
            
            // API returns array of arrays: [destination, totalBookings]
            const labels = data.map(item => item[0] || 'Unknown');
            const values = data.map(item => item[1] || 0);
            
            return { labels, values };
        } catch (error) {
            console.error('Error fetching destinations data:', error);
            throw error;
        }
    }async fetchCategoriesData() {
        try {
            const data = await apiClient.request('/statistics/tours/category-distribution');
            
            // API returns array of arrays: [category/tourType, count]
            const labels = data.map(item => {
                // Map tour types to Vietnamese
                const category = item[0];
                switch(category) {
                    case 'DOMESTIC': return 'Trong nước';
                    case 'INTERNATIONAL': return 'Quốc tế';
                    default: return category || 'Khác';
                }
            });
            const values = data.map(item => item[1] || 0);
            
            return { labels, values };        } catch (error) {
            console.error('Error fetching categories data:', error);
            throw error;        }    }async fetchTopTours() {
        try {
            const data = await apiClient.request('/statistics/tours/top-performance?limit=5');
            
            // API returns array of arrays: [id, name, destination, totalBookings, ratingAverage, totalRevenue]
            const tours = data.map(item => ({
                id: item[0],
                name: item[1] || `Tour ${item[0]}`,
                code: `T${String(item[0]).padStart(3, '0')}`,
                destination: item[2] || 'N/A',
                bookings: item[3] || 0,
                revenue: item[5] || 0,
                rating: item[4] || 0,
                status: 'active',
                statusText: 'Hoạt động'
            }));

            // Fetch tour details for images (do this sequentially to avoid overwhelming the server)
            for (let tour of tours) {
                try {
                    const fullTour = await apiClient.getTour(tour.id);
                    tour.image = this.getTourImageUrl(fullTour);
                } catch (error) {
                    console.error(`Error fetching tour ${tour.id} details:`, error);
                    tour.image = apiClient.getDefaultTourImage();
                }
            }

            return tours;
        } catch (error) {
            console.error('Error fetching top tours:', error);
            throw error;
        }}    async fetchRecentTours() {
        try {
            const data = await apiClient.request('/statistics/tours/recent?limit=5');
            
            // API returns array of arrays: [id, name, destination, price, createdAt, status]
            const tours = data.map(item => ({
                id: item[0],
                name: item[1] || `Tour ${item[0]}`,
                code: `T${String(item[0]).padStart(3, '0')}`,
                destination: item[2] || 'N/A',
                price: item[3] || 0,
                createdAt: item[4] || new Date(),
                status: item[5] || 'ACTIVE',
                statusText: item[5] === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'
            }));

            // Fetch tour details for images (do this sequentially to avoid overwhelming the server)
            for (let tour of tours) {
                try {
                    const fullTour = await apiClient.getTour(tour.id);
                    tour.image = this.getTourImageUrl(fullTour);
                } catch (error) {
                    console.error(`Error fetching tour ${tour.id} details:`, error);
                    tour.image = apiClient.getDefaultTourImage();
                }
            }

            return tours;
        } catch (error) {
            console.error('Error fetching recent tours:', error);
            throw error;
        }
    }

    // Chart refresh methods
    async refreshTrendChart(type) {
        try {
            // This would typically fetch different data based on the chart type
            await this.loadBookingTrendsChart();
        } catch (error) {
            console.error('Error refreshing trend chart:', error);
        }
    }

    // Tour action methods
    viewTour(tourId) {
        window.location.href = `tour-detail.html?id=${tourId}`;
    }

    editTour(tourId) {
        window.location.href = `tour-edit.html?id=${tourId}`;
    }

    // Export functionality
    async exportReport() {
        try {
            // Show loading state
            const exportBtn = document.getElementById('exportBtn');
            const originalText = exportBtn.innerHTML;
            exportBtn.innerHTML = '<div class="loading-spinner"></div> Đang xuất...';
            exportBtn.disabled = true;

            // Simulate export process
            await new Promise(resolve => setTimeout(resolve, 2000));

            // In a real implementation, you would make an API call here
            console.log('Exporting tour report with filters:', {
                timeRange: this.currentTimeRange,
                category: this.currentCategory,
                status: this.currentStatus
            });

            // Reset button
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;

            // Show success message
            this.showSuccess('Báo cáo tours đã được xuất thành công!');

        } catch (error) {
            console.error('Error exporting report:', error);
            this.showError('Có lỗi xảy ra khi xuất báo cáo');
        }
    }    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Helper method to get tour image URL
    getTourImageUrl(tour) {
        if (!tour) return apiClient.getDefaultTourImage();
        
        // Use apiClient's method to get tour image URL
        return apiClient.getTourImageUrl(tour);
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let starsHtml = '';
        
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<ion-icon name="star"></ion-icon>';
        }
        
        if (hasHalfStar) {
            starsHtml += '<ion-icon name="star-half"></ion-icon>';
        }
        
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<ion-icon name="star-outline"></ion-icon>';
        }
        
        return starsHtml;
    }

    showTableError(tableId, message) {
        const tbody = document.querySelector(`#${tableId} tbody`);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="100%" class="error-cell">
                        <ion-icon name="alert-circle-outline"></ion-icon>
                        ${message}
                    </td>
                </tr>
            `;
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            if (show) {
                overlay.classList.add('show');
            } else {
                overlay.classList.remove('show');
            }
        }
    }

    showSuccess(message) {
        // Implement toast notification
        console.log('Success:', message);
    }

    showError(message) {
        // Implement toast notification
        console.error('Error:', message);
    }
}

// Initialize when DOM is loaded
let adminReportsTours;
document.addEventListener('DOMContentLoaded', () => {
    adminReportsTours = new AdminReportsTours();
});

// Export for global access
window.adminReportsTours = adminReportsTours;

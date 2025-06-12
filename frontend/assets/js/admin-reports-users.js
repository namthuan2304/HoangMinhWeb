/**
 * Admin Reports Users - User Statistics Management
 */

class AdminReportsUsers {
    constructor() {
        this.currentTimeRange = '30';
        this.currentUserType = 'all';
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
            console.error('Error initializing user reports:', error);
            this.showError('Có lỗi xảy ra khi tải dữ liệu thống kê');
        }
    }

    setupEventListeners() {
        // Time range filter
        const timeRangeSelect = document.getElementById('timeRangeSelect');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', (e) => {
                this.handleTimeRangeChange(e.target.value);
            });
        }

        // User type filter
        const userTypeFilter = document.getElementById('userTypeFilter');
        if (userTypeFilter) {
            userTypeFilter.addEventListener('change', (e) => {
                this.currentUserType = e.target.value;
                this.refreshData();
            });
        }

        // Chart type selector
        const growthChartType = document.getElementById('growthChartType');
        if (growthChartType) {
            growthChartType.addEventListener('change', (e) => {
                this.refreshGrowthChart(e.target.value);
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
                this.showExportModal();
            });
        }

        // Export modal handlers
        this.setupExportModal();

        // Custom date range
        this.setupCustomDateRange();
    }

    handleTimeRangeChange(value) {
        this.currentTimeRange = value;
        const customDateRange = document.getElementById('customDateRange');
        
        if (value === 'custom') {
            customDateRange.style.display = 'flex';
            this.setupDateInputs();
        } else {
            customDateRange.style.display = 'none';
            this.refreshData();
        }
    }

    setupCustomDateRange() {
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');

        if (startDate && endDate) {
            [startDate, endDate].forEach(input => {
                input.addEventListener('change', () => {
                    if (this.currentTimeRange === 'custom' && 
                        startDate.value && endDate.value) {
                        this.refreshDataWithCustomRange(startDate.value, endDate.value);
                    }
                });
            });
        }
    }

    setupDateInputs() {
        const endDate = document.getElementById('endDate');
        const startDate = document.getElementById('startDate');
        
        if (endDate && startDate) {
            const today = new Date().toISOString().split('T')[0];
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            endDate.value = today;
            startDate.value = lastMonth.toISOString().split('T')[0];
        }
    }

    async loadInitialData() {
        try {
            // Load all data concurrently
            await Promise.all([
                this.loadStatsOverview(),
                this.loadUserGrowthChart(),
                this.loadUserActivityChart(),
                this.loadUserDemographicsChart(),
                this.loadTopActiveUsers(),
                this.loadRecentRegistrations(),
                this.loadAnalyticsSummary(),
                this.loadInsights()
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

    async refreshDataWithCustomRange(startDate, endDate) {
        try {
            this.showLoading(true);
            // Implement custom date range logic
            await this.loadInitialData();
            this.showLoading(false);
        } catch (error) {
            console.error('Error refreshing data with custom range:', error);
            this.showError('Có lỗi xảy ra khi tải dữ liệu');
            this.showLoading(false);
        }
    }    async loadStatsOverview() {
        try {
            const stats = await this.fetchUserStats();
            
            this.updateStatCard('totalUsersCount', stats.totalUsers, stats.totalUsersChange);
            this.updateStatCard('newUsersCount', stats.newUsers, stats.newUsersChange);
            this.updateStatCard('activeUsersCount', stats.activeUsers, stats.activeUsersChange);
            this.updateStatCard('retentionRate', `${stats.retentionRate}%`, stats.retentionChange);
        } catch (error) {
            console.error('Error loading stats overview:', error);
            // Show error message in stats cards
            this.updateStatCard('totalUsersCount', 'N/A', null);
            this.updateStatCard('newUsersCount', 'N/A', null);
            this.updateStatCard('activeUsersCount', 'N/A', null);
            this.updateStatCard('retentionRate', 'N/A', null);
        }
    }

    updateStatCard(valueId, value, change) {
        const valueElement = document.getElementById(valueId);
        const changeElement = document.getElementById(valueId.replace('Count', 'Change').replace('Rate', 'Change'));
        
        if (valueElement) {
            valueElement.textContent = value;
        }
        
        if (changeElement && change !== undefined) {
            changeElement.textContent = change > 0 ? `+${change}%` : `${change}%`;
            changeElement.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
        }
    }

    async loadUserGrowthChart() {
        try {
            const data = await this.fetchUserGrowthData();
            
            const ctx = document.getElementById('userGrowthChart');
            if (!ctx) return;

            // Destroy existing chart
            if (this.charts.userGrowth) {
                this.charts.userGrowth.destroy();
            }

            this.charts.userGrowth = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [
                        {
                            label: 'Người dùng mới',
                            data: data.newUsers,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Tổng người dùng',
                            data: data.totalUsers,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: false,
                            tension: 0.4
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
                            display: true,
                            title: {
                                display: true,
                                text: 'Số lượng'
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
            console.error('Error loading user growth chart:', error);
        }
    }

    async loadUserActivityChart() {
        try {
            const data = await this.fetchUserActivityData();
            
            const ctx = document.getElementById('userActivityChart');
            if (!ctx) return;

            if (this.charts.userActivity) {
                this.charts.userActivity.destroy();
            }

            this.charts.userActivity = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Số lượng hoạt động',
                        data: data.values,
                        backgroundColor: [
                            '#3b82f6',
                            '#10b981',
                            '#f59e0b',
                            '#ef4444',
                            '#8b5cf6',
                            '#06b6d4',
                            '#84cc16'
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
                            beginAtZero: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading user activity chart:', error);
        }
    }

    async loadUserDemographicsChart() {
        try {
            const data = await this.fetchUserDemographicsData();
            
            const ctx = document.getElementById('userDemographicsChart');
            if (!ctx) return;

            if (this.charts.userDemographics) {
                this.charts.userDemographics.destroy();
            }

            this.charts.userDemographics = new Chart(ctx, {
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
                            '#8b5cf6'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading user demographics chart:', error);
        }
    }

    async loadTopActiveUsers() {
        try {
            const users = await this.fetchTopActiveUsers();
            const tbody = document.querySelector('#topActiveUsersTable tbody');
            
            if (!tbody) return;

            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>
                        <div class="user-info">
                            <div class="user-avatar">
                                ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}">` : 
                                  `<ion-icon name="person-outline"></ion-icon>`}
                            </div>
                            <div class="user-details">
                                <span class="user-name">${user.name}</span>
                                <span class="user-id">#${user.id}</span>
                            </div>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td>${user.toursBooked}</td>
                    <td class="amount">${this.formatCurrency(user.totalSpent)}</td>
                    <td>${this.formatDate(user.lastActivity)}</td>
                    <td>
                        <span class="status-badge ${user.status}">${user.statusText}</span>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading top active users:', error);
            this.showTableError('topActiveUsersTable', 'Không thể tải danh sách người dùng hoạt động');
        }
    }

    async loadRecentRegistrations() {
        try {
            const users = await this.fetchRecentRegistrations();
            const tbody = document.querySelector('#recentRegistrationsTable tbody');
            
            if (!tbody) return;

            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>
                        <div class="user-info">
                            <div class="user-avatar">
                                ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}">` : 
                                  `<ion-icon name="person-outline"></ion-icon>`}
                            </div>
                            <div class="user-details">
                                <span class="user-name">${user.name}</span>
                                <span class="user-id">#${user.id}</span>
                            </div>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td>${this.formatDate(user.registrationDate)}</td>
                    <td>
                        <span class="source-badge ${user.source}">${user.sourceText}</span>
                    </td>
                    <td>
                        <span class="status-badge ${user.status}">${user.statusText}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="adminReportsUsers.viewUser(${user.id})" title="Xem chi tiết">
                                <ion-icon name="eye-outline"></ion-icon>
                            </button>
                            <button class="btn-icon" onclick="adminReportsUsers.editUser(${user.id})" title="Chỉnh sửa">
                                <ion-icon name="create-outline"></ion-icon>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading recent registrations:', error);
            this.showTableError('recentRegistrationsTable', 'Không thể tải danh sách đăng ký gần đây');
        }
    }

    async loadAnalyticsSummary() {
        try {
            const analytics = await this.fetchAnalyticsSummary();
            
            document.getElementById('conversionRate').textContent = `${analytics.conversionRate}%`;
            document.getElementById('averageSessionTime').textContent = analytics.averageSessionTime;
            document.getElementById('pageViewsPerSession').textContent = analytics.pageViewsPerSession;
            document.getElementById('bounceRate').textContent = `${analytics.bounceRate}%`;
        } catch (error) {
            console.error('Error loading analytics summary:', error);
        }
    }

    async loadInsights() {
        try {
            const insights = await this.fetchUserInsights();
            const container = document.getElementById('insightsContent');
            
            if (!container) return;

            container.innerHTML = insights.map(insight => `
                <div class="insight-item ${insight.type}">
                    <div class="insight-icon">
                        <ion-icon name="${insight.icon}"></ion-icon>
                    </div>
                    <div class="insight-content">
                        <h4>${insight.title}</h4>
                        <p>${insight.description}</p>
                        ${insight.action ? `<button class="btn btn-sm btn-primary">${insight.action}</button>` : ''}
                    </div>
                </div>
            `).join('');        } catch (error) {
            console.error('Error loading insights:', error);
            // Show error message instead of fallback
            const container = document.querySelector('#insightsContainer .insights-grid');
            if (container) {
                container.innerHTML = `
                    <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">
                        <ion-icon name="alert-circle-outline" style="font-size: 2rem; margin-bottom: 1rem;"></ion-icon>
                        <p>Không thể tải thông tin insights: ${error.message}</p>
                    </div>
                `;
            }
        }
    }
    
    // API Methods - Real API calls only
    async fetchUserStats() {
        try {
            const [totalUsers, newUsers, activeUsers, retentionRate] = await Promise.all([
                apiClient.request('/statistics/users/total'),
                apiClient.request('/statistics/users/new-users?days=30'),
                apiClient.request('/statistics/users/active'),
                apiClient.request('/statistics/users/retention-rate')
            ]);
            
            return {
                totalUsers: totalUsers.count || 0,
                totalUsersChange: totalUsers.growthRate || 0,
                newUsers: newUsers.count || 0,
                newUsersChange: newUsers.growthRate || 0,
                activeUsers: activeUsers.count || 0,
                activeUsersChange: activeUsers.growthRate || 0,
                retentionRate: retentionRate.rate || 0,
                retentionChange: retentionRate.change || 0
            };
        } catch (error) {
            console.error('Error fetching user stats:', error);
            throw error;
        }
    }    async fetchUserGrowthData() {
        try {
            const data = await apiClient.request(`/statistics/users/registration-trends?days=${this.currentTimeRange}`);
            
            // API returns array of arrays: [date, count]
            const labels = data.map(item => {
                const date = new Date(item[0]);
                return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
            });
            
            const newUsers = data.map(item => item[1] || 0);
            
            // Get total users from API instead of hardcoded value
            const totalUsersData = await apiClient.request('/statistics/users/total');
            let runningTotal = Math.max(0, (totalUsersData.count || 0) - newUsers.reduce((sum, count) => sum + count, 0));
            
            const totalUsers = newUsers.map(count => {
                runningTotal += count;
                return runningTotal;
            });
            
            return { labels, newUsers, totalUsers };
        } catch (error) {
            console.error('Error fetching user growth data:', error);
            throw error;
        }
    }    async fetchUserActivityData() {
        try {
            // Note: This endpoint doesn't exist yet in backend
            throw new Error('User activity breakdown endpoint not implemented yet');
        } catch (error) {
            console.error('Error fetching user activity data:', error);
            // Return empty data structure instead of mock data
            return {
                labels: [],
                values: [],
                error: 'Tính năng thống kê hoạt động người dùng đang được phát triển'
            };
        }
    }    async fetchUserDemographicsData() {
        try {
            const [ageData, locationData, genderData] = await Promise.all([
                apiClient.request('/statistics/users/age-distribution'),
                apiClient.request('/statistics/users/location-distribution'),
                apiClient.request('/statistics/users/gender-distribution')
            ]);
            
            // API returns array of arrays: [ageGroup, count]
            const labels = ageData.map(item => item[0]);
            const values = ageData.map(item => item[1]);
            
            return { labels, values };
        } catch (error) {
            console.error('Error fetching user demographics data:', error);
            throw error;
        }
    }async fetchTopActiveUsers() {
        try {
            const data = await apiClient.request('/statistics/users/top-by-bookings?limit=10');
            
            // API returns array of arrays: [id, username, fullName, email, bookingCount, totalSpent]
            return data.map(item => ({
                id: item[0],
                name: item[2] || item[1] || `User ${item[0]}`,
                email: item[3] || '',
                avatar: null,
                toursBooked: item[4] || 0,
                totalSpent: item[5] || 0,
                lastActivity: new Date(),
                status: 'active',
                statusText: 'Hoạt động'
            }));
        } catch (error) {
            console.error('Error fetching top active users:', error);
            throw error;
        }
    }

    async fetchRecentRegistrations() {
        try {
            const data = await apiClient.request('/statistics/users/recent-users?limit=10');
            
            // API returns array of arrays: [id, username, fullName, email, createdAt, isActive]
            return data.map(item => ({
                id: item[0],
                name: item[2] || item[1] || `User ${item[0]}`,
                email: item[3] || '',
                avatar: null,
                registrationDate: new Date(item[4]),
                source: 'organic',
                sourceText: 'Tự nhiên',
                status: item[5] ? 'active' : 'inactive',
                statusText: item[5] ? 'Đã xác thực' : 'Chưa xác thực'
            }));
        } catch (error) {
            console.error('Error fetching recent registrations:', error);
            throw error;
        }
    }    async fetchAnalyticsSummary() {
        try {
            // Note: This endpoint doesn't exist yet in backend
            // We could implement this as aggregated data from other endpoints
            throw new Error('Analytics summary endpoint not implemented yet');
        } catch (error) {
            console.error('Error fetching analytics summary:', error);
            return {
                conversionRate: 0,
                averageSessionTime: 'N/A',
                pageViewsPerSession: 0,
                bounceRate: 0,
                error: 'Dữ liệu analytics chưa khả dụng'
            };
        }
    }

    async fetchUserInsights() {
        try {
            // Note: This would be an AI-generated insights endpoint
            // For now, return empty insights
            throw new Error('User insights endpoint not implemented yet');
        } catch (error) {
            console.error('Error fetching user insights:', error);
            return [];
        }
    }

    // Chart refresh methods
    async refreshGrowthChart(type) {
        try {
            // This would typically fetch different data based on the chart type
            await this.loadUserGrowthChart();
        } catch (error) {
            console.error('Error refreshing growth chart:', error);
        }
    }

    // Export functionality
    setupExportModal() {
        const exportBtn = document.getElementById('exportBtn');
        const exportModal = document.getElementById('exportModal');
        const closeModal = document.getElementById('closeExportModal');
        const cancelExport = document.getElementById('cancelExport');
        const confirmExport = document.getElementById('confirmExport');

        if (exportBtn && exportModal) {
            exportBtn.addEventListener('click', () => {
                exportModal.classList.add('show');
            });
        }

        [closeModal, cancelExport].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    exportModal.classList.remove('show');
                });
            }
        });

        if (confirmExport) {
            confirmExport.addEventListener('click', () => {
                this.handleExport();
            });
        }
    }

    showExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    async handleExport() {
        try {
            const format = document.getElementById('exportFormat').value;
            const timeRange = document.getElementById('exportTimeRange').value;
            const includeCharts = document.getElementById('includeCharts').checked;
            const includeDetails = document.getElementById('includeDetails').checked;

            // Show loading state
            const confirmBtn = document.getElementById('confirmExport');
            const originalText = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<div class="loading-spinner"></div> Đang xuất...';
            confirmBtn.disabled = true;

            // Simulate export process
            await new Promise(resolve => setTimeout(resolve, 2000));

            // In a real implementation, you would make an API call here
            console.log('Exporting with options:', {
                format,
                timeRange,
                includeCharts,
                includeDetails
            });

            // Reset button and close modal
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
            document.getElementById('exportModal').classList.remove('show');

            // Show success message
            this.showSuccess('Báo cáo đã được xuất thành công!');

        } catch (error) {
            console.error('Error exporting report:', error);
            this.showError('Có lỗi xảy ra khi xuất báo cáo');
        }
    }

    // User action methods
    viewUser(userId) {
        window.location.href = `user-detail.html?id=${userId}`;
    }

    editUser(userId) {
        window.location.href = `user-edit.html?id=${userId}`;
    }

    // Utility methods
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
let adminReportsUsers;
document.addEventListener('DOMContentLoaded', () => {
    adminReportsUsers = new AdminReportsUsers();
});

// Export for global access
window.adminReportsUsers = adminReportsUsers;

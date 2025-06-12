// Admin Revenue Reports Management
class AdminRevenueReports {
    constructor() {
        this.currentReportType = 'monthly';
        this.currentYear = new Date().getFullYear();
        this.currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
        this.revenueChart = null;
        this.chartType = 'line'; // line, bar
        this.rawData = [];
        
        this.init();
    }

    init() {
        this.initializeElements();
        this.bindEvents();
        this.setupChart();
        this.loadInitialData();
    }

    initializeElements() {
        // Filter elements
        this.reportTypeSelect = document.getElementById('reportTypeSelect');
        this.yearSelect = document.getElementById('yearSelect');
        this.quarterSelect = document.getElementById('quarterSelect');
        this.yearFilterGroup = document.getElementById('yearFilterGroup');
        this.quarterFilterGroup = document.getElementById('quarterFilterGroup');
        this.applyFilterBtn = document.getElementById('applyFilterBtn');
        
        // Action buttons
        this.refreshBtn = document.getElementById('refreshBtn');
        this.exportPdfBtn = document.getElementById('exportPdfBtn');
        this.chartToggleBtn = document.getElementById('chartToggleBtn');
        this.exportTableBtn = document.getElementById('exportTableBtn');
        
        // Summary elements
        this.summaryElements = {
            totalRevenue: document.getElementById('totalRevenue'),
            totalBookings: document.getElementById('totalBookings'),
            averageRevenue: document.getElementById('averageRevenue'),
            growthRate: document.getElementById('growthRate'),
            revenuePeriod: document.getElementById('revenuePeriod'),
            bookingsPeriod: document.getElementById('bookingsPeriod'),
            averagePeriod: document.getElementById('averagePeriod'),
            growthPeriod: document.getElementById('growthPeriod')
        };
        
        // Chart elements
        this.chartTitle = document.getElementById('chartTitle');
        this.chartCanvas = document.getElementById('revenueChart');
        
        // Table elements
        this.tableHeader = document.getElementById('tableHeader');
        this.tableBody = document.getElementById('tableBody');
        this.topToursBody = document.getElementById('topToursBody');
        
        // Loading overlay
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        // Filter events
        this.reportTypeSelect.addEventListener('change', () => this.handleReportTypeChange());
        this.applyFilterBtn.addEventListener('click', () => this.applyFilters());
        
        // Action button events
        this.refreshBtn.addEventListener('click', () => this.refreshData());
        this.exportPdfBtn.addEventListener('click', () => this.exportPdf());
        this.chartToggleBtn.addEventListener('click', () => this.toggleChartType());
        this.exportTableBtn.addEventListener('click', () => this.exportTable());
        
        // Year/Quarter change events
        this.yearSelect.addEventListener('change', () => this.updateFilters());
        this.quarterSelect.addEventListener('change', () => this.updateFilters());
    }

    handleReportTypeChange() {
        const reportType = this.reportTypeSelect.value;
        
        // Show/hide appropriate filter groups
        if (reportType === 'quarterly') {
            this.quarterFilterGroup.style.display = 'flex';
        } else {
            this.quarterFilterGroup.style.display = 'none';
        }
        
        this.updateTableHeaders(reportType);
        this.updateChartTitle(reportType);
    }

    updateFilters() {
        // Auto-apply filters when year or quarter changes
        this.applyFilters();
    }

    updateTableHeaders(reportType) {
        const headers = {
            monthly: ['Tháng', 'Doanh thu', 'Số đơn', 'Đơn giá TB', '% Tổng'],
            quarterly: ['Quý', 'Doanh thu', 'Số đơn', 'Đơn giá TB', '% Tổng'],
            yearly: ['Năm', 'Doanh thu', 'Số đơn', 'Đơn giá TB', '% Tổng']
        };
        
        const headerRow = headers[reportType] || headers.monthly;
        this.tableHeader.innerHTML = headerRow.map(header => `<th>${header}</th>`).join('');
    }

    updateChartTitle(reportType) {
        const titles = {
            monthly: 'Biểu đồ doanh thu theo tháng',
            quarterly: 'Biểu đồ doanh thu theo quý',
            yearly: 'Biểu đồ doanh thu theo năm'
        };
        
        this.chartTitle.textContent = titles[reportType] || titles.monthly;
    }

    async loadInitialData() {
        this.showLoading(true);
        try {
            await this.loadRevenueData();
            await this.loadTopTours();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showToast('Có lỗi khi tải dữ liệu', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async applyFilters() {
        this.currentReportType = this.reportTypeSelect.value;
        this.currentYear = parseInt(this.yearSelect.value);
        this.currentQuarter = parseInt(this.quarterSelect.value);
        
        this.showLoading(true);
        try {
            await this.loadRevenueData();
        } catch (error) {
            console.error('Error applying filters:', error);
            this.showToast('Có lỗi khi áp dụng bộ lọc', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadRevenueData() {
        try {
            let apiEndpoint;
            let params = {};
            
            switch (this.currentReportType) {
                case 'monthly':
                    apiEndpoint = '/statistics/revenue/monthly';
                    params.year = this.currentYear;
                    break;
                case 'quarterly':
                    apiEndpoint = '/statistics/revenue/quarterly';
                    params.year = this.currentYear;
                    break;
                case 'yearly':
                    apiEndpoint = '/statistics/revenue/yearly';
                    params.year = this.currentYear;
                    break;
            }
            
            const queryString = new URLSearchParams(params).toString();
            const fullEndpoint = `${apiEndpoint}?${queryString}`;
            
            let data;
            if (this.currentReportType === 'yearly') {
                // For yearly, we get a single object with total revenue
                const response = await apiClient.request(fullEndpoint);
                data = [{
                    period: this.currentYear,
                    revenue: response.totalRevenue || 0,
                    bookings: 0 // We'll need to fetch this separately if needed
                }];
            } else {
                // For monthly and quarterly, we get an array
                data = await apiClient.request(fullEndpoint);
            }
            
            this.rawData = this.processRevenueData(data);
            this.updateSummaryCards();
            this.updateChart();
            this.updateTable();
            
        } catch (error) {
            console.error('Error loading revenue data:', error);
            throw error;
        }
    }

    processRevenueData(rawData) {
        if (!Array.isArray(rawData)) {
            console.warn('Revenue data is not an array:', rawData);
            return [];
        }
        
        return rawData.map(item => {
            if (Array.isArray(item)) {
                // Data comes as [period, revenue, bookings] array
                return {
                    period: item[0],
                    revenue: parseFloat(item[1]) || 0,
                    bookings: parseInt(item[2]) || 0
                };
            } else if (typeof item === 'object') {
                // Data comes as object
                return {
                    period: item.period || item.month || item.quarter || item.year,
                    revenue: parseFloat(item.revenue) || 0,
                    bookings: parseInt(item.bookings) || 0
                };
            }
            return { period: 0, revenue: 0, bookings: 0 };
        });
    }

    updateSummaryCards() {
        const totalRevenue = this.rawData.reduce((sum, item) => sum + item.revenue, 0);
        const totalBookings = this.rawData.reduce((sum, item) => sum + item.bookings, 0);
        const averageRevenue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
        
        // Calculate growth rate (simplified - comparing to previous period)
        const growthRate = this.calculateGrowthRate();
        
        // Update summary values
        this.summaryElements.totalRevenue.textContent = this.formatCurrency(totalRevenue);
        this.summaryElements.totalBookings.textContent = this.formatNumber(totalBookings);
        this.summaryElements.averageRevenue.textContent = this.formatCurrency(averageRevenue);
        this.summaryElements.growthRate.textContent = this.formatPercentage(growthRate);
        
        // Update period labels
        const periodText = this.getPeriodText();
        this.summaryElements.revenuePeriod.textContent = periodText;
        this.summaryElements.bookingsPeriod.textContent = periodText;
        this.summaryElements.averagePeriod.textContent = periodText;
        this.summaryElements.growthPeriod.textContent = 'So với kỳ trước';
    }

    calculateGrowthRate() {
        if (this.rawData.length < 2) return 0;
        
        const current = this.rawData[this.rawData.length - 1].revenue;
        const previous = this.rawData[this.rawData.length - 2].revenue;
        
        if (previous === 0) return 0;
        
        return ((current - previous) / previous) * 100;
    }

    getPeriodText() {
        switch (this.currentReportType) {
            case 'monthly':
                return `Năm ${this.currentYear}`;
            case 'quarterly':
                return `Năm ${this.currentYear}`;
            case 'yearly':
                return `Năm ${this.currentYear}`;
            default:
                return '';
        }
    }

    setupChart() {
        const ctx = this.chartCanvas.getContext('2d');
        
        this.revenueChart = new Chart(ctx, {
            type: this.chartType,
            data: {
                labels: [],
                datasets: [{
                    label: 'Doanh thu (VNĐ)',
                    data: [],
                    borderColor: '#007bff',
                    backgroundColor: this.chartType === 'line' 
                        ? 'rgba(0, 123, 255, 0.1)' 
                        : 'rgba(0, 123, 255, 0.8)',
                    tension: 0.4,
                    fill: this.chartType === 'line'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Doanh thu: ${this.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrencyShort(value)
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    updateChart() {
        if (!this.revenueChart) return;
        
        const labels = this.rawData.map(item => this.formatPeriodLabel(item.period));
        const data = this.rawData.map(item => item.revenue);
        
        this.revenueChart.data.labels = labels;
        this.revenueChart.data.datasets[0].data = data;
        this.revenueChart.update();
    }

    formatPeriodLabel(period) {
        switch (this.currentReportType) {
            case 'monthly':
                return `T${period}`;
            case 'quarterly':
                return `Q${period}`;
            case 'yearly':
                return `${period}`;
            default:
                return period.toString();
        }
    }

    toggleChartType() {
        this.chartType = this.chartType === 'line' ? 'bar' : 'line';
        
        // Destroy and recreate chart with new type
        this.revenueChart.destroy();
        this.setupChart();
        this.updateChart();
        
        // Update button text
        const newTypeText = this.chartType === 'line' ? 'Biểu đồ cột' : 'Biểu đồ đường';
        this.chartToggleBtn.querySelector('.btn-text').textContent = newTypeText;
    }

    updateTable() {
        const totalRevenue = this.rawData.reduce((sum, item) => sum + item.revenue, 0);
        
        this.tableBody.innerHTML = this.rawData.map(item => {
            const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue * 100) : 0;
            const averageOrder = item.bookings > 0 ? item.revenue / item.bookings : 0;
            
            return `
                <tr>
                    <td>${this.formatPeriodLabel(item.period)}</td>
                    <td class="number-cell currency-cell">${this.formatCurrency(item.revenue)}</td>
                    <td class="number-cell">${this.formatNumber(item.bookings)}</td>
                    <td class="number-cell currency-cell">${this.formatCurrency(averageOrder)}</td>
                    <td class="number-cell percentage-cell">${this.formatPercentage(percentage)}</td>
                </tr>
            `;
        }).join('');
        
        if (this.rawData.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="loading-cell">Không có dữ liệu</td>
                </tr>
            `;
        }
    }

    async loadTopTours() {
        try {
            const topTours = await apiClient.request('/statistics/tours/top-booked?limit=10');
            this.updateTopToursTable(topTours);
        } catch (error) {
            console.error('Error loading top tours:', error);
            this.topToursBody.innerHTML = `
                <tr>
                    <td colspan="5" class="loading-cell">Không thể tải dữ liệu tours</td>
                </tr>
            `;
        }
    }

    updateTopToursTable(topTours) {
        if (!Array.isArray(topTours) || topTours.length === 0) {
            this.topToursBody.innerHTML = `
                <tr>
                    <td colspan="5" class="loading-cell">Không có dữ liệu tours</td>
                </tr>
            `;
            return;
        }
        
        const totalRevenue = topTours.reduce((sum, tour) => sum + (parseFloat(tour[2]) || 0), 0);
        
        this.topToursBody.innerHTML = topTours.map((tour, index) => {
            const tourName = tour[0] || 'N/A';
            const bookingCount = parseInt(tour[1]) || 0;
            const revenue = parseFloat(tour[2]) || 0;
            const percentage = totalRevenue > 0 ? (revenue / totalRevenue * 100) : 0;
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${tourName}</td>
                    <td class="number-cell">${this.formatNumber(bookingCount)}</td>
                    <td class="number-cell currency-cell">${this.formatCurrency(revenue)}</td>
                    <td class="number-cell percentage-cell">${this.formatPercentage(percentage)}</td>
                </tr>
            `;
        }).join('');
    }

    async refreshData() {
        await this.loadInitialData();
        this.showToast('Dữ liệu đã được làm mới', 'success');
    }

    async exportPdf() {
        try {
            this.showLoading(true);
            
            let endpoint;
            if (this.currentReportType === 'yearly') {
                endpoint = `/statistics/revenue/yearly/pdf?year=${this.currentYear}`;
            } else {
                // For monthly reports, use current month
                const currentMonth = new Date().getMonth() + 1;
                endpoint = `/statistics/revenue/monthly/pdf?year=${this.currentYear}&month=${currentMonth}`;
            }
            
            const blob = await apiClient.getMonthlyRevenuePDF(this.currentYear, new Date().getMonth() + 1);
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bao-cao-doanh-thu-${this.currentReportType}-${this.currentYear}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showToast('Xuất báo cáo PDF thành công!', 'success');
        } catch (error) {
            console.error('Export PDF error:', error);
            this.showToast('Có lỗi khi xuất báo cáo PDF', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    exportTable() {
        // Create CSV content
        const headers = ['Thời gian', 'Doanh thu', 'Số đơn', 'Đơn giá TB', '% Tổng'];
        const totalRevenue = this.rawData.reduce((sum, item) => sum + item.revenue, 0);
        
        const csvContent = [
            headers.join(','),
            ...this.rawData.map(item => {
                const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue * 100) : 0;
                const averageOrder = item.bookings > 0 ? item.revenue / item.bookings : 0;
                
                return [
                    this.formatPeriodLabel(item.period),
                    item.revenue,
                    item.bookings,
                    averageOrder.toFixed(0),
                    percentage.toFixed(2) + '%'
                ].join(',');
            })
        ].join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `chi-tiet-doanh-thu-${this.currentReportType}-${this.currentYear}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Xuất dữ liệu Excel thành công!', 'success');
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    formatCurrencyShort(amount) {
        if (amount >= 1000000000) {
            return (amount / 1000000000).toFixed(1) + 'B';
        } else if (amount >= 1000000) {
            return (amount / 1000000).toFixed(1) + 'M';
        } else if (amount >= 1000) {
            return (amount / 1000).toFixed(1) + 'K';
        }
        return amount.toString();
    }

    formatNumber(num) {
        return new Intl.NumberFormat('vi-VN').format(num);
    }

    formatPercentage(percent) {
        return `${percent.toFixed(2)}%`;
    }

    showLoading(show) {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Style the toast
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    destroy() {
        if (this.revenueChart) {
            this.revenueChart.destroy();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated and has admin role
    if (!apiClient.isAuthenticated() || !apiClient.isAdmin()) {
        window.location.href = '../login.html';
        return;
    }
    
    // Initialize revenue reports
    window.adminRevenueReports = new AdminRevenueReports();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.adminRevenueReports) {
        window.adminRevenueReports.destroy();
    }
});
// Admin Bookings Management
class AdminBookings {
    constructor() {
        this.bookings = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalItems = 0;
        this.totalPages = 0;
        this.filters = {
            status: '',
            keyword: '',
            dateFrom: '',
            dateTo: ''
        };
        this.stats = {
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0
        };
        
        this.init();
    }

    async init() {
        console.log('Initializing Admin Bookings...');
        
        // Check admin authentication
        if (!this.checkAdminAuth()) {
            return;
        }

        // Initialize elements
        this.initializeElements();
        this.bindEvents();
        
        // Load initial data
        await this.loadBookings();
        await this.loadStats();
        
        console.log('Admin Bookings initialized successfully');
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
        this.statusFilter = document.getElementById('statusFilter');
        this.searchInput = document.getElementById('searchInput');
        this.dateFromFilter = document.getElementById('dateFromFilter');
        this.dateToFilter = document.getElementById('dateToFilter');
        this.clearFiltersBtn = document.getElementById('clearFiltersBtn');
        
        // Table elements
        this.tableWrapper = document.getElementById('bookingsTableWrapper');
        this.paginationWrapper = document.getElementById('paginationWrapper');
        this.itemsPerPageSelect = document.getElementById('itemsPerPage');
        
        // Stats elements
        this.pendingCount = document.getElementById('pendingCount');
        this.confirmedCount = document.getElementById('confirmedCount');
        this.completedCount = document.getElementById('completedCount');
        this.cancelledCount = document.getElementById('cancelledCount');
        
        // Action buttons
        this.refreshBtn = document.getElementById('refreshBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        // Filter events
        this.statusFilter.addEventListener('change', () => this.applyFilters());
        this.searchInput.addEventListener('input', this.debounce(() => this.applyFilters(), 500));
        this.dateFromFilter.addEventListener('change', () => this.applyFilters());
        this.dateToFilter.addEventListener('change', () => this.applyFilters());
        this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        
        // Table events
        this.itemsPerPageSelect.addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.loadBookings();
        });
        
        // Action button events
        this.refreshBtn.addEventListener('click', () => this.refresh());
        this.exportBtn.addEventListener('click', () => this.exportReport());
    }

    async loadBookings() {
        this.showLoading(true);
        
        try {
            const params = {
                page: this.currentPage - 1,
                size: this.itemsPerPage,
                sortBy: 'createdAt',
                sortDir: 'desc',
                ...this.filters
            };

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            const response = await apiClient.getBookings(params);
            this.bookings = response.content || [];
            this.totalItems = response.totalElements || 0;
            this.totalPages = response.totalPages || 0;

            this.renderBookingsTable();
            this.renderPagination();

        } catch (error) {
            console.error('Error loading bookings:', error);
            this.showError('Có lỗi khi tải danh sách đặt tour');
        } finally {
            this.showLoading(false);
        }
    }

    async loadStats() {
        try {
            // Load booking statistics by status
            const statsResponse = await apiClient.request('/bookings/statistics/by-status');
            
            // Reset stats
            this.stats = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
            
            // Update stats from response
            if (Array.isArray(statsResponse)) {
                statsResponse.forEach(([status, count]) => {
                    switch (status) {
                        case 'PENDING':
                            this.stats.pending = count;
                            break;
                        case 'CONFIRMED':
                            this.stats.confirmed = count;
                            break;
                        case 'COMPLETED':
                            this.stats.completed = count;
                            break;
                        case 'CANCELLED':
                            this.stats.cancelled = count;
                            break;
                    }
                });
            }
            
            this.updateStatsDisplay();

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateStatsDisplay() {
        if (this.pendingCount) this.pendingCount.textContent = this.formatNumber(this.stats.pending);
        if (this.confirmedCount) this.confirmedCount.textContent = this.formatNumber(this.stats.confirmed);
        if (this.completedCount) this.completedCount.textContent = this.formatNumber(this.stats.completed);
        if (this.cancelledCount) this.cancelledCount.textContent = this.formatNumber(this.stats.cancelled);
    }    renderBookingsTable() {
        if (!this.tableWrapper) return;

        if (this.bookings.length === 0) {
            this.tableWrapper.innerHTML = `
                <div class="empty-state">
                    <ion-icon name="calendar-outline"></ion-icon>
                    <h3>Không có đặt tour nào</h3>
                    <p>Không tìm thấy đặt tour nào với điều kiện lọc hiện tại.</p>
                </div>
            `;
            return;
        }

        const html = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Mã đơn</th>
                            <th>Khách hàng</th>
                            <th>Tour</th>
                            <th>Số người</th>
                            <th>Tổng tiền</th>
                            <th>Ngày đặt</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.bookings.map(booking => this.renderBookingRow(booking)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        this.tableWrapper.innerHTML = html;
        
        // Bind event listeners for action buttons
        this.bindActionButtons();
    }    
    bindActionButtons() {
        // Remove existing event listeners to prevent duplicate bindings
        document.querySelectorAll('.view-booking-btn, .edit-booking-btn, .print-invoice-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });

        // View booking buttons
        document.querySelectorAll('.view-booking-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const bookingId = parseInt(e.currentTarget.dataset.bookingId);
                this.viewBooking(bookingId);
            });
        });

        // Edit booking buttons
        document.querySelectorAll('.edit-booking-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const bookingId = parseInt(e.currentTarget.dataset.bookingId);
                console.log('Edit button clicked for booking:', bookingId);
                this.updateStatus(bookingId);
            });
        });

        // Print invoice buttons
        document.querySelectorAll('.print-invoice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const bookingId = parseInt(e.currentTarget.dataset.bookingId);
                this.printInvoice(bookingId);
            });
        });
    }
    renderBookingRow(booking) {
        return `
            <tr>
                <td>
                    <code class="invoice-code">${booking.invoiceNumber || booking.id}</code>
                </td>
                <td>
                    <div class="customer-info">
                        <strong>${booking.contactName || 'N/A'}</strong>
                        <small>${booking.contactEmail || 'N/A'}</small>
                    </div>
                </td>
                <td>
                    <div class="tour-info">
                        <strong>${booking.tourName || 'N/A'}</strong>
                        <small>${booking.tourDestination || ''}</small>
                    </div>
                </td>
                <td>
                    <span class="participant-count">${booking.participantsCount} người</span>
                </td>
                <td>
                    <span class="amount">${this.formatCurrency(booking.totalAmount)}</span>
                </td>
                <td>
                    <span class="booking-date">${this.formatDate(booking.createdAt)}</span>
                </td>
                <td>
                    <span class="badge badge-${this.getStatusColor(booking.status)}">
                        ${this.getStatusText(booking.status)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline view-booking-btn" 
                                data-booking-id="${booking.id}" 
                                title="Xem chi tiết">
                            <ion-icon name="eye-outline"></ion-icon>
                        </button>
                        <button class="btn btn-sm btn-primary edit-booking-btn" 
                                data-booking-id="${booking.id}" 
                                title="Cập nhật trạng thái">
                            <ion-icon name="create-outline"></ion-icon>
                        </button>
                        <button class="btn btn-sm btn-success print-invoice-btn" 
                                data-booking-id="${booking.id}" 
                                title="In hóa đơn">
                            <ion-icon name="print-outline"></ion-icon>
                        </button>
                    </div>
                </td>
            </tr>
        `;
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
                    trong tổng số ${this.totalItems} kết quả
                </div>
                <div class="pagination-controls">
                    <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                            onclick="adminBookings.goToPage(${this.currentPage - 1})">
                        <ion-icon name="chevron-back-outline"></ion-icon>
                        Trước
                    </button>
                    
                    ${this.generatePageNumbers()}
                    
                    <button class="pagination-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''} 
                            onclick="adminBookings.goToPage(${this.currentPage + 1})">
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
                        onclick="adminBookings.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        return html;
    }

    applyFilters() {
        this.filters.status = this.statusFilter.value;
        this.filters.keyword = this.searchInput.value.trim();
        this.filters.dateFrom = this.dateFromFilter.value;
        this.filters.dateTo = this.dateToFilter.value;
        
        this.currentPage = 1;
        this.loadBookings();
    }

    clearFilters() {
        this.statusFilter.value = '';
        this.searchInput.value = '';
        this.dateFromFilter.value = '';
        this.dateToFilter.value = '';
        
        this.filters = { status: '', keyword: '', dateFrom: '', dateTo: '' };
        this.currentPage = 1;
        this.loadBookings();
    }

    async refresh() {
        await Promise.all([
            this.loadBookings(),
            this.loadStats()
        ]);
        this.showToast('Dữ liệu đã được làm mới', 'success');
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        this.loadBookings();
    
    }    viewBooking(bookingId) {
        if (bookingId) {
            window.location.href = `booking-detail.html?id=${bookingId}`;
        }
    }    async updateStatus(bookingId) {
        console.log('updateStatus called with bookingId:', bookingId);
        try {
            const booking = this.bookings.find(b => b.id === bookingId);
            console.log('Found booking:', booking);
            if (!booking) {
                console.error('Booking not found');
                return;
            }

            const availableStatuses = this.getAvailableStatuses(booking.status);
            console.log('Available statuses:', availableStatuses);
            
            if (availableStatuses.length === 0) {
                this.showToast('Không thể thay đổi trạng thái của đặt tour này', 'warning');
                return;
            }

            // Show quick status update buttons
            const statusOptions = availableStatuses.map(status => 
                `<button class="btn btn-sm btn-outline status-option" data-status="${status}">
                    ${this.getStatusText(status)}
                </button>`
            ).join('');            const modalHtml = `
                <div class="modal-overlay show" id="statusModal">
                    <div class="modal">
                        <div class="modal-header">
                            <h3>Cập nhật trạng thái</h3>
                            <button class="modal-close" onclick="adminBookings.closeModal()">
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p>Chọn trạng thái mới cho đặt tour <strong>#${booking.invoiceNumber || booking.id}</strong>:</p>
                            <div class="status-options">
                                ${statusOptions}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Show modal with animation
            setTimeout(() => {
                const modal = document.getElementById('statusModal');
                if (modal) {
                    modal.classList.add('show');
                }
            }, 10);

            // Bind status option events
            document.querySelectorAll('.status-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.confirmStatusUpdate(bookingId, btn.dataset.status);
                });
            });

        } catch (error) {
            console.error('Error updating status:', error);
            this.showToast('Có lỗi khi cập nhật trạng thái', 'error');
        }
    }    async confirmStatusUpdate(bookingId, newStatus) {
        try {
            this.showLoading(true);
            
            // For CANCELLED status, we might want to add a note, but for quick actions keep it simple
            await apiClient.updateBookingStatus(bookingId, newStatus);
            
            this.showToast('Cập nhật trạng thái thành công!', 'success');
            this.closeModal();
            
            // Refresh data
            await Promise.all([
                this.loadBookings(),
                this.loadStats()
            ]);
            
        } catch (error) {
            console.error('Error updating booking status:', error);
            this.showToast('Có lỗi khi cập nhật trạng thái', 'error');
        } finally {
            this.showLoading(false);
        }
    }    
    async printInvoice(bookingId) {
        try {
            const booking = this.bookings.find(b => b.id === bookingId);
            if (!booking) {
                this.showToast('Không tìm thấy thông tin đặt tour', 'error');
                return;
            }

            // Show print options modal
            this.showPrintInvoiceModal(booking);
            
        } catch (error) {
            console.error('Error opening print invoice modal:', error);
            this.showToast('Có lỗi khi mở tùy chọn in', 'error');
        }
    }

    showPrintInvoiceModal(booking) {
        const modalHtml = `
            <div class="modal-overlay show" id="printInvoiceModal">
                <div class="modal invoice-modal">
                    <div class="modal-header">
                        <h3>In hóa đơn</h3>
                        <button class="modal-close" onclick="adminBookings.closePrintModal()">
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="invoice-info">
                            <h4>Thông tin đặt tour</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Mã đơn:</label>
                                    <span>${booking.invoiceNumber || booking.id}</span>
                                </div>
                                <div class="info-item">
                                    <label>Khách hàng:</label>
                                    <span>${booking.contactName || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Tour:</label>
                                    <span>${booking.tourName || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Tổng tiền:</label>
                                    <span>${this.formatCurrency(booking.totalAmount)}</span>
                                </div>
                                <div class="info-item">
                                    <label>Trạng thái:</label>
                                    <span class="badge badge-${this.getStatusColor(booking.status)}">
                                        ${this.getStatusText(booking.status)}
                                    </span>
                                </div>
                                <div class="info-item">
                                    <label>Ngày đặt:</label>
                                    <span>${this.formatDate(booking.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="print-options">
                            <h4>Tùy chọn in</h4>
                            <div class="option-buttons">
                                <button class="btn btn-primary" onclick="adminBookings.previewInvoice(${booking.id})">
                                    <ion-icon name="eye-outline"></ion-icon>
                                    <span>Xem trước</span>
                                </button>
                                <button class="btn btn-success" onclick="adminBookings.downloadInvoice(${booking.id})">
                                    <ion-icon name="download-outline"></ion-icon>
                                    <span>Tải xuống PDF</span>
                                </button>
                                <button class="btn btn-info" onclick="adminBookings.printInvoiceDirect(${booking.id})">
                                    <ion-icon name="print-outline"></ion-icon>
                                    <span>In trực tiếp</span>
                                </button>
                                <button class="btn btn-warning" onclick="adminBookings.emailInvoice(${booking.id})">
                                    <ion-icon name="mail-outline"></ion-icon>
                                    <span>Gửi email</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal with animation
        setTimeout(() => {
            const modal = document.getElementById('printInvoiceModal');
            if (modal) {
                modal.classList.add('show');
            }
        }, 10);
    }

    async previewInvoice(bookingId) {
        try {
            this.showLoading(true);
            const blob = await apiClient.getAdminInvoicePDF(bookingId);
            
            // Validate PDF blob
            if (!blob || blob.size === 0) {
                throw new Error('PDF không hợp lệ hoặc rỗng');
            }
            
            // Check if blob is actually a PDF
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const header = String.fromCharCode(...uint8Array.slice(0, 4));
            
            if (header !== '%PDF') {
                throw new Error('File không phải là PDF hợp lệ');
            }
            
            // Create object URL and open in new tab
            const url = window.URL.createObjectURL(blob);
            const previewWindow = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            
            if (!previewWindow) {
                // Fallback: create modal with embedded PDF viewer
                this.showPDFPreviewModal(url, bookingId);
            } else {
                // Cleanup URL after some time
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                }, 30000);
            }
            
            this.closePrintModal();
            this.showToast('Đang mở xem trước PDF...', 'success');
            
        } catch (error) {
            console.error('Error previewing invoice:', error);
            this.showToast(`Có lỗi khi xem trước: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showPDFPreviewModal(pdfUrl, bookingId) {
        const modalHtml = `
            <div class="modal-overlay show" id="pdfPreviewModal">
                <div class="modal pdf-preview-modal">
                    <div class="modal-header">
                        <h3>Xem trước hóa đơn</h3>
                        <div class="modal-actions">
                            <button class="btn btn-primary" onclick="adminBookings.printFromPreview('${pdfUrl}')">
                                <ion-icon name="print-outline"></ion-icon>
                                In
                            </button>
                            <button class="btn btn-success" onclick="adminBookings.downloadFromPreview('${pdfUrl}', ${bookingId})">
                                <ion-icon name="download-outline"></ion-icon>
                                Tải xuống
                            </button>
                            <button class="modal-close" onclick="adminBookings.closePDFPreview('${pdfUrl}')">
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="pdf-viewer">
                            <iframe src="${pdfUrl}" width="100%" height="600px" style="border: none;"></iframe>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    printFromPreview(pdfUrl) {
        try {
            const printWindow = window.open(pdfUrl, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.print();
                    }, 1000);
                };
            } else {
                throw new Error('Không thể mở cửa sổ in');
            }
            this.showToast('Đang gửi lệnh in...', 'success');
        } catch (error) {
            console.error('Error printing from preview:', error);
            this.showToast('Có lỗi khi in', 'error');
        }
    }

    downloadFromPreview(pdfUrl, bookingId) {
        try {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `hoa-don-${bookingId}.pdf`;
            link.click();
            this.showToast('Đang tải xuống...', 'success');
        } catch (error) {
            console.error('Error downloading from preview:', error);
            this.showToast('Có lỗi khi tải xuống', 'error');
        }
    }

    closePDFPreview(pdfUrl) {
        const modal = document.getElementById('pdfPreviewModal');
        if (modal) {
            modal.remove();
        }
        // Cleanup URL
        if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl);
        }
    }

    async downloadInvoice(bookingId) {
        try {
            this.showLoading(true);
            const blob = await apiClient.getAdminInvoicePDF(bookingId);
            this.downloadInvoiceBlob(blob, bookingId);
            this.closePrintModal();
            this.showToast('Tải hóa đơn thành công!', 'success');
            
        } catch (error) {
            console.error('Error downloading invoice:', error);
            this.showToast('Có lỗi khi tải hóa đơn', 'error');
        } finally {
            this.showLoading(false);
        }
    }    
    async printInvoiceDirect(bookingId) {
        try {
            this.showLoading(true);
            const blob = await apiClient.getAdminInvoicePDF(bookingId);
            
            // Validate PDF blob
            if (!blob || blob.size === 0) {
                throw new Error('PDF không hợp lệ hoặc rỗng');
            }
            
            // Check if blob is actually a PDF
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const header = String.fromCharCode(...uint8Array.slice(0, 4));
            
            if (header !== '%PDF') {
                throw new Error('File không phải là PDF hợp lệ');
            }
            
            // Create object URL
            const url = window.URL.createObjectURL(blob);
            
            // Open in new window for better PDF viewing
            const printWindow = window.open(url, '_blank');
            
            if (!printWindow) {
                // Fallback: use iframe
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                document.body.appendChild(iframe);
                
                iframe.onload = () => {
                    try {
                        setTimeout(() => {
                            iframe.contentWindow.print();
                        }, 500);
                    } catch (error) {
                        console.error('Error printing from iframe:', error);
                        this.showToast('Không thể in trực tiếp. Vui lòng tải xuống PDF', 'warning');
                        this.downloadInvoiceBlob(blob, bookingId);
                    }
                    
                    // Cleanup
                    setTimeout(() => {
                        window.URL.revokeObjectURL(url);
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                    }, 2000);
                };
                
                iframe.onerror = () => {
                    console.error('PDF load error in iframe');
                    this.showToast('Lỗi tải PDF. Vui lòng thử tải xuống', 'error');
                    this.downloadInvoiceBlob(blob, bookingId);
                    
                    // Cleanup
                    window.URL.revokeObjectURL(url);
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                };
                
                iframe.src = url;
            } else {
                // PDF opened in new window successfully
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.print();
                    }, 1000);
                };
                
                // Cleanup URL after some time
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                }, 10000);
            }
            
            this.closePrintModal();
            this.showToast('Đang mở PDF để in...', 'success');
            
        } catch (error) {
            console.error('Error printing invoice:', error);
            this.showToast(`Có lỗi khi in hóa đơn: ${error.message}`, 'error');
            
            // Try to download as fallback
            try {
                await this.downloadInvoice(bookingId);
            } catch (downloadError) {
                console.error('Fallback download also failed:', downloadError);
            }
        } finally {
            this.showLoading(false);
        }
    }async emailInvoice(bookingId) {
        try {
            const booking = this.bookings.find(b => b.id === bookingId);
            if (!booking || !booking.contactEmail) {
                this.showToast('Không tìm thấy email khách hàng', 'warning');
                return;
            }

            // Show email confirmation modal
            this.showEmailConfirmationModal(booking);
            
        } catch (error) {
            console.error('Error opening email modal:', error);
            this.showToast('Có lỗi khi mở tùy chọn gửi email', 'error');
        }
    }

    showEmailConfirmationModal(booking) {
        const modalHtml = `
            <div class="modal-overlay show" id="emailConfirmModal">
                <div class="modal email-modal">
                    <div class="modal-header">
                        <h3>Gửi hóa đơn qua email</h3>
                        <button class="modal-close" onclick="adminBookings.closeEmailModal()">
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="email-form">
                            <div class="form-group">
                                <label for="emailTo">Gửi đến:</label>
                                <input type="email" id="emailTo" value="${booking.contactEmail}" readonly>
                            </div>
                            <div class="form-group">
                                <label for="emailSubject">Tiêu đề:</label>
                                <input type="text" id="emailSubject" value="Hóa đơn đặt tour #${booking.invoiceNumber || booking.id}">
                            </div>
                            <div class="form-group">
                                <label for="emailMessage">Nội dung:</label>
                                <textarea id="emailMessage" rows="4" placeholder="Thêm lời nhắn cho khách hàng (tùy chọn)">Xin chào ${booking.contactName || 'Quý khách'},

Cảm ơn bạn đã đặt tour với chúng tôi. Vui lòng tìm hóa đơn chi tiết trong file đính kèm.

Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.

Trân trọng,
Travel Booking System</textarea>
                            </div>
                            <div class="form-actions">
                                <button class="btn btn-outline" onclick="adminBookings.closeEmailModal()">
                                    <ion-icon name="close-outline"></ion-icon>
                                    Hủy
                                </button>
                                <button class="btn btn-primary" onclick="adminBookings.sendEmailInvoice(${booking.id})">
                                    <ion-icon name="send-outline"></ion-icon>
                                    Gửi email
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal with animation
        setTimeout(() => {
            const modal = document.getElementById('emailConfirmModal');
            if (modal) {
                modal.classList.add('show');
            }
        }, 10);
    }

    async sendEmailInvoice(bookingId) {
        try {
            this.showLoading(true);
            
            const emailTo = document.getElementById('emailTo').value;
            const emailSubject = document.getElementById('emailSubject').value;
            const emailMessage = document.getElementById('emailMessage').value;

            if (!emailTo || !emailSubject) {
                this.showToast('Vui lòng điền đầy đủ thông tin email', 'warning');
                return;
            }

            // Send email with custom content
            await apiClient.sendCustomEmail(bookingId, {
                to: emailTo,
                subject: emailSubject,
                message: emailMessage
            });
            
            this.closeEmailModal();
            this.closePrintModal();
            this.showToast(`Đã gửi hóa đơn đến ${emailTo}`, 'success');
            
        } catch (error) {
            console.error('Error sending email:', error);
            this.showToast('Có lỗi khi gửi email', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    closeEmailModal() {
        const modal = document.getElementById('emailConfirmModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    downloadInvoiceBlob(blob, bookingId) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hoa-don-${bookingId}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    closePrintModal() {
        const modal = document.getElementById('printInvoiceModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
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
            a.download = `bao-cao-dat-tour-${currentDate.getFullYear()}-${currentDate.getMonth() + 1}.pdf`;
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
    }    closeModal() {
        const modal = document.getElementById('statusModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    getAvailableStatuses(currentStatus) {
        const statusTransitions = {
            'PENDING': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['COMPLETED', 'CANCELLED'],
            'COMPLETED': [],
            'CANCELLED': []
        };
        
        return statusTransitions[currentStatus] || [];
    }

    // Utility methods
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

    formatNumber(num) {
        return new Intl.NumberFormat('vi-VN').format(num);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
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
                    <button class="btn btn-primary" onclick="adminBookings.loadBookings()">
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AdminBookings...');
    // Wait for API client to be available
    const initBookings = () => {
        if (typeof apiClient !== 'undefined' && apiClient) {
            console.log('API client available, creating AdminBookings instance...');
            window.adminBookings = new AdminBookings();
            console.log('AdminBookings instance created:', window.adminBookings);
        } else {
            console.log('API client not ready, retrying...');
            setTimeout(initBookings, 100);
        }
    };
    
    initBookings();
});

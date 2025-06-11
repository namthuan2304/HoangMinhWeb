// Admin Users Management
class AdminUsers {
    constructor() {
        this.users = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalItems = 0;
        this.totalPages = 0;
        this.filters = {
            keyword: '',
            role: '',
            status: '',
            gender: '',
            dateFrom: '',
            dateTo: ''
        };
        this.stats = {
            total: 0,
            active: 0,
            newThisMonth: 0,
            admin: 0
        };
        this.selectedUsers = new Set();
        this.currentUser = null;
        this.serverBaseUrl = 'http://localhost:8080';
        
        this.init();
    }

    async init() {
        console.log('Initializing Admin Users...');
        
        // Check admin authentication
        if (!this.checkAdminAuth()) {
            return;
        }

        // Initialize elements
        this.initializeElements();
        this.bindEvents();
        
        // Load initial data
        await this.loadUsers();
        await this.loadStats();
        
        console.log('Admin Users initialized successfully');
    }

    checkAdminAuth() {
        try {
            if (!apiClient || !apiClient.isAuthenticated()) {
                console.log('User not authenticated, redirecting to login');
                window.location.href = '../login.html';
                return false;
            }

            const user = apiClient.getCurrentUser();
            if (!user || user.role !== 'ADMIN') {
                console.log('User is not admin, redirecting to home');
                window.location.href = '../index.html';
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking admin auth:', error);
            window.location.href = '../login.html';
            return false;
        }
    }

    initializeElements() {
        // Filter elements
        this.searchKeywordInput = document.getElementById('searchKeyword');
        this.roleFilter = document.getElementById('roleFilter');
        this.statusFilter = document.getElementById('statusFilter');
        this.genderFilter = document.getElementById('genderFilter');
        this.dateFromFilter = document.getElementById('dateFromFilter');
        this.dateToFilter = document.getElementById('dateToFilter');
        this.clearFiltersBtn = document.getElementById('clearFiltersBtn');

        // Table elements
        this.usersTable = document.getElementById('usersTable');
        this.usersTableBody = this.usersTable.querySelector('tbody');
        this.selectAllCheckbox = document.getElementById('selectAllUsers');
        this.itemsPerPageSelect = document.getElementById('itemsPerPageSelect');
        this.paginationControls = document.getElementById('paginationControls');

        // Action buttons
        this.refreshBtn = document.getElementById('refreshBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.createUserBtn = document.getElementById('createUserBtn');
        this.bulkActionBtn = document.getElementById('bulkActionBtn');

        // Modal elements
        this.userDetailModal = document.getElementById('userDetailModal');
        this.userEditModal = document.getElementById('userEditModal');
        this.bulkActionsModal = document.getElementById('bulkActionsModal');
        this.userEditForm = document.getElementById('userEditForm');

        // Stats elements
        this.totalUsersElement = document.getElementById('totalUsers');
        this.activeUsersElement = document.getElementById('activeUsers');
        this.newUsersThisMonthElement = document.getElementById('newUsersThisMonth');
        this.adminUsersElement = document.getElementById('adminUsers');

        // Toast
        this.toast = document.getElementById('toast');
    }

    bindEvents() {
        // Filters
        this.searchKeywordInput.addEventListener('input', () => this.debounceFilter());
        this.roleFilter.addEventListener('change', () => this.applyFilters());
        this.statusFilter.addEventListener('change', () => this.applyFilters());
        this.genderFilter.addEventListener('change', () => this.applyFilters());
        this.dateFromFilter.addEventListener('change', () => this.applyFilters());
        this.dateToFilter.addEventListener('change', () => this.applyFilters());
        this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());

        // Table controls
        this.selectAllCheckbox.addEventListener('change', () => this.toggleSelectAll());
        this.itemsPerPageSelect.addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.loadUsers();
        });        // Action buttons
        if (this.refreshBtn) this.refreshBtn.addEventListener('click', () => this.refresh());
        if (this.exportBtn) this.exportBtn.addEventListener('click', () => this.exportUsers());
        if (this.createUserBtn) this.createUserBtn.addEventListener('click', () => this.navigateToCreateUser());
        if (this.bulkActionBtn) this.bulkActionBtn.addEventListener('click', () => this.showBulkActionsModal());

        // Modal events
        this.bindModalEvents();

        // Debounce function for search
        this.debounceTimer = null;
    }

    bindModalEvents() {
        // User Detail Modal
        document.getElementById('closeUserDetailModal').addEventListener('click', () => this.closeModal('userDetailModal'));
        document.getElementById('closeDetailBtn').addEventListener('click', () => this.closeModal('userDetailModal'));
        document.getElementById('editUserBtn').addEventListener('click', () => this.editUserFromDetail());

        // User Edit Modal
        document.getElementById('closeUserEditModal').addEventListener('click', () => this.closeModal('userEditModal'));
        document.getElementById('cancelEditBtn').addEventListener('click', () => this.closeModal('userEditModal'));
        document.getElementById('saveUserBtn').addEventListener('click', () => this.saveUser());

        // Bulk Actions Modal
        document.getElementById('closeBulkActionsModal').addEventListener('click', () => this.closeModal('bulkActionsModal'));
        document.getElementById('cancelBulkActionsBtn').addEventListener('click', () => this.closeModal('bulkActionsModal'));
        document.getElementById('bulkActivateBtn').addEventListener('click', () => this.bulkUpdateStatus('ACTIVE'));
        document.getElementById('bulkDeactivateBtn').addEventListener('click', () => this.bulkUpdateStatus('INACTIVE'));
        document.getElementById('bulkDeleteBtn').addEventListener('click', () => this.bulkDeleteUsers());

        // Close modals when clicking overlay
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    debounceFilter() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.applyFilters();
        }, 500);
    }

    async loadUsers() {
        try {
            this.showLoading(true);

            const params = {
                page: this.currentPage - 1,
                size: this.itemsPerPage,
                sort: 'createdAt,desc'
            };

            // Add filters
            if (this.filters.keyword) params.keyword = this.filters.keyword;
            if (this.filters.role) params.role = this.filters.role;
            if (this.filters.status) params.status = this.filters.status;
            if (this.filters.gender) params.gender = this.filters.gender;
            if (this.filters.dateFrom) params.dateFrom = this.filters.dateFrom;
            if (this.filters.dateTo) params.dateTo = this.filters.dateTo;

            const response = await apiClient.getUsers(params);
            
            if (response && response.content) {
                this.users = response.content;
                this.totalItems = response.totalElements;
                this.totalPages = response.totalPages;
                this.currentPage = response.number + 1;
            } else {
                this.users = [];
                this.totalItems = 0;
                this.totalPages = 0;
            }

            this.renderUsersTable();
            this.renderPagination();
            this.updatePaginationInfo();

        } catch (error) {
            console.error('Error loading users:', error);
            this.showToast('Không thể tải danh sách người dùng', 'error');
        } finally {
            this.showLoading(false);
        }
    }    async loadStats() {
        try {
            // For now, calculate stats from current data
            // In a real app, you'd have dedicated stats endpoints
            const allUsersResponse = await apiClient.getUsers({ size: 1000 });
            const allUsers = allUsersResponse.content || [];

            this.stats.total = allUsers.length;
            this.stats.active = allUsers.filter(user => user.isActive === true).length;
            this.stats.admin = allUsers.filter(user => user.role === 'ADMIN').length;

            // Calculate new users this month
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            this.stats.newThisMonth = allUsers.filter(user => {
                const createdDate = new Date(user.createdAt);
                return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
            }).length;

            this.updateStatsDisplay();

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateStatsDisplay() {
        if (this.totalUsersElement) this.totalUsersElement.textContent = this.stats.total.toLocaleString();
        if (this.activeUsersElement) this.activeUsersElement.textContent = this.stats.active.toLocaleString();
        if (this.newUsersThisMonthElement) this.newUsersThisMonthElement.textContent = this.stats.newThisMonth.toLocaleString();
        if (this.adminUsersElement) this.adminUsersElement.textContent = this.stats.admin.toLocaleString();
    }    renderUsersTable() {
        if (!this.usersTableBody) return;

        if (this.users.length === 0) {
            this.usersTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <ion-icon name="people-outline"></ion-icon>
                        <h3>Không có người dùng nào</h3>
                        <p>Không tìm thấy người dùng phù hợp với bộ lọc hiện tại</p>
                    </td>
                </tr>
            `;
            return;
        }

        this.usersTableBody.innerHTML = this.users.map(user => this.renderUserRow(user)).join('');
        
        // Add event listeners for user checkboxes
        this.usersTableBody.querySelectorAll('.user-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const userId = parseInt(e.target.value);
                if (e.target.checked) {
                    this.selectedUsers.add(userId);
                } else {
                    this.selectedUsers.delete(userId);
                }
                this.updateBulkActionsVisibility();
            });
        });
        
        this.updateBulkActionsVisibility();
    }    renderUserRow(user) {
        const isSelected = this.selectedUsers.has(user.id);
        
        // Debug log to check user status
        console.log('Rendering user:', user.username, 'isActive:', user.isActive, 'Type:', typeof user.isActive);
        
        return `
            <tr class="user-row ${isSelected ? 'selected' : ''}" data-user-id="${user.id}">
                <td>
                    <input type="checkbox" class="bulk-checkbox user-checkbox" 
                           value="${user.id}" ${isSelected ? 'checked' : ''}>
                </td>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">
                            ${user.avatarUrl ? 
                                `<img src="${this.getFullUrl(user.avatarUrl)}" alt="${user.fullName}">` :
                                `<ion-icon name="person-outline"></ion-icon>`
                            }
                        </div>
                        <div class="user-details">
                            <div class="user-name">${user.fullName || user.username}</div>
                            <div class="user-username">@${user.username}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="contact-info">
                        <div class="contact-email">${user.email}</div>
                        ${user.phone ? `<div class="contact-phone">${user.phone}</div>` : ''}
                    </div>
                </td>                <td>
                    <span class="role-badge ${user.role ? user.role.toLowerCase() : 'user'}">
                        ${this.getRoleLabel(user.role)}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
                        ${this.getStatusLabel(user.isActive)}
                    </span>
                </td>
                <td>
                    <div class="date-info">${this.formatDate(user.createdAt)}</div>
                </td>
                <td>
                    <div class="date-info ${this.isRecentActivity(user.lastLoginAt) ? 'date-recent' : ''}">
                        ${user.lastLoginAt ? this.formatDate(user.lastLoginAt) : 'Chưa đăng nhập'}
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-outline btn-sm" onclick="adminUsers.viewUser(${user.id})" title="Xem chi tiết">
                            <ion-icon name="eye-outline"></ion-icon>
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="adminUsers.editUser(${user.id})" title="Chỉnh sửa">
                            <ion-icon name="create-outline"></ion-icon>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="adminUsers.deleteUser(${user.id})" title="Xóa">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderPagination() {
        if (!this.paginationControls || this.totalPages <= 1) {
            if (this.paginationControls) this.paginationControls.innerHTML = '';
            return;
        }

        const pages = this.generatePageNumbers();
        
        this.paginationControls.innerHTML = `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="adminUsers.goToPage(${this.currentPage - 1})">
                <ion-icon name="chevron-back-outline"></ion-icon>
                Trước
            </button>
            
            ${pages.map(page => {
                if (page === '...') {
                    return '<span class="pagination-ellipsis">...</span>';
                }
                return `
                    <button class="pagination-btn ${page === this.currentPage ? 'active' : ''}" 
                            onclick="adminUsers.goToPage(${page})">
                        ${page}
                    </button>
                `;
            }).join('')}
            
            <button class="pagination-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''} 
                    onclick="adminUsers.goToPage(${this.currentPage + 1})">
                Sau
                <ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
        `;
    }

    generatePageNumbers() {
        const pages = [];
        const maxVisible = 5;
        
        if (this.totalPages <= maxVisible) {
            for (let i = 1; i <= this.totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (this.currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(this.totalPages);
            } else if (this.currentPage >= this.totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(this.totalPages);
            }
        }
        
        return pages;
    }    updatePaginationInfo() {
        const currentRangeElement = document.getElementById('currentRange');
        const totalUsersElement = document.querySelector('#totalUsersCount');
        
        if (currentRangeElement) {
            const start = (this.currentPage - 1) * this.itemsPerPage + 1;
            const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
            currentRangeElement.textContent = `${start}-${end}`;
        }
        
        if (totalUsersElement) {
            totalUsersElement.textContent = this.totalItems.toLocaleString();
        }
    }

    applyFilters() {
        this.filters.keyword = this.searchKeywordInput.value.trim();
        this.filters.role = this.roleFilter.value;
        this.filters.status = this.statusFilter.value;
        this.filters.gender = this.genderFilter.value;
        this.filters.dateFrom = this.dateFromFilter.value;
        this.filters.dateTo = this.dateToFilter.value;

        this.currentPage = 1;
        this.loadUsers();
    }

    clearFilters() {
        this.searchKeywordInput.value = '';
        this.roleFilter.value = '';
        this.statusFilter.value = '';
        this.genderFilter.value = '';
        this.dateFromFilter.value = '';
        this.dateToFilter.value = '';

        this.filters = {
            keyword: '',
            role: '',
            status: '',
            gender: '',
            dateFrom: '',
            dateTo: ''
        };

        this.currentPage = 1;
        this.loadUsers();
    }

    toggleSelectAll() {
        const isChecked = this.selectAllCheckbox.checked;
        const checkboxes = document.querySelectorAll('.user-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            const userId = parseInt(checkbox.value);
            if (isChecked) {
                this.selectedUsers.add(userId);
            } else {
                this.selectedUsers.delete(userId);
            }
        });

        this.updateBulkActionsVisibility();
    }

    updateBulkActionsVisibility() {
        const bulkActions = document.querySelector('.bulk-actions');
        if (bulkActions) {
            bulkActions.style.display = this.selectedUsers.size > 0 ? 'flex' : 'none';
        }

        // Update bulk action button text
        if (this.bulkActionBtn) {
            const count = this.selectedUsers.size;
            this.bulkActionBtn.innerHTML = `
                <ion-icon name="options-outline"></ion-icon>
                Thao tác với ${count} mục đã chọn
            `;
        }

        // Update select all checkbox state
        const checkboxes = document.querySelectorAll('.user-checkbox');
        const checkedCount = document.querySelectorAll('.user-checkbox:checked').length;
        
        if (this.selectAllCheckbox) {
            this.selectAllCheckbox.checked = checkedCount === checkboxes.length && checkboxes.length > 0;
            this.selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
        }
    }

    async viewUser(userId) {
        try {
            const user = await apiClient.getUser(userId);
            this.showUserDetailModal(user);
        } catch (error) {
            console.error('Error loading user:', error);
            this.showToast('Không thể tải thông tin người dùng', 'error');
        }
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            this.showUserEditModal(user);
        }
    }

    editUserFromDetail() {
        this.closeModal('userDetailModal');
        if (this.currentUser) {
            this.showUserEditModal(this.currentUser);
        }
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.fullName || user.username}"?`)) {
            return;
        }

        try {
            await apiClient.deleteUser(userId);
            this.showToast('Xóa người dùng thành công', 'success');
            this.loadUsers();
            this.loadStats();
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showToast('Không thể xóa người dùng', 'error');
        }
    }    async saveUser() {
        const form = this.userEditForm;
        const formData = new FormData(form);
          const userData = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            role: formData.get('role'),
            isActive: formData.get('status') === 'ACTIVE',
            gender: formData.get('gender'),
            birthDate: formData.get('birthDate'),
            address: formData.get('address')
        };

        // Remove empty values but keep boolean false values
        Object.keys(userData).forEach(key => {
            if (userData[key] === null || userData[key] === undefined || userData[key] === '') {
                delete userData[key];
            }
        });

        const saveBtn = document.getElementById('saveUserBtn');
        
        try {
            this.setButtonLoading(saveBtn, true);

            await apiClient.updateUser(this.currentUser.id, userData);
            
            this.showToast('Cập nhật người dùng thành công', 'success');
            this.closeModal('userEditModal');
            this.loadUsers();
            this.loadStats();

        } catch (error) {
            console.error('Error updating user:', error);
            this.showToast('Không thể cập nhật người dùng', 'error');
        } finally {
            this.setButtonLoading(saveBtn, false);
        }
    }

    showUserDetailModal(user) {
        this.currentUser = user;
        const content = document.getElementById('userDetailContent');
        
        content.innerHTML = `
            <div class="detail-section">
                <div class="user-avatar-large">
                    ${user.avatarUrl ? 
                        `<img src="${this.getFullUrl(user.avatarUrl)}" alt="${user.fullName}">` :
                        `<ion-icon name="person-outline"></ion-icon>`
                    }
                </div>
                <h4>
                    <ion-icon name="person-outline"></ion-icon>
                    Thông tin cá nhân
                </h4>
                <div class="detail-item">
                    <span class="detail-label">Họ và tên:</span>
                    <span class="detail-value">${user.fullName || 'Chưa cập nhật'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Tên đăng nhập:</span>
                    <span class="detail-value">@${user.username}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${user.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Số điện thoại:</span>
                    <span class="detail-value">${user.phone || 'Chưa cập nhật'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Giới tính:</span>
                    <span class="detail-value">${this.getGenderLabel(user.gender)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Ngày sinh:</span>
                    <span class="detail-value">${user.birthDate ? this.formatDate(user.birthDate) : 'Chưa cập nhật'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Địa chỉ:</span>
                    <span class="detail-value">${user.address || 'Chưa cập nhật'}</span>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>
                    <ion-icon name="shield-outline"></ion-icon>
                    Thông tin tài khoản
                </h4>                <div class="detail-item">
                    <span class="detail-label">Vai trò:</span>
                    <span class="detail-value">
                        <span class="role-badge ${user.role ? user.role.toLowerCase() : 'user'}">
                            ${this.getRoleLabel(user.role)}
                        </span>
                    </span>
                </div>                <div class="detail-item">
                    <span class="detail-label">Trạng thái:</span>
                    <span class="detail-value">
                        <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
                            ${this.getStatusLabel(user.isActive)}
                        </span>
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Ngày tham gia:</span>
                    <span class="detail-value">${this.formatDate(user.createdAt)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Hoạt động cuối:</span>
                    <span class="detail-value">${user.lastLoginAt ? this.formatDate(user.lastLoginAt) : 'Chưa đăng nhập'}</span>
                </div>
            </div>
        `;

        this.showModal('userDetailModal');
    }    showUserEditModal(user) {
        this.currentUser = user;
        
        // Fill form with user data
        document.getElementById('editFullName').value = user.fullName || '';
        document.getElementById('editUsername').value = user.username || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editPhone').value = user.phone || '';
        document.getElementById('editRole').value = user.role || 'USER';
        document.getElementById('editStatus').value = user.isActive ? 'ACTIVE' : 'INACTIVE';
        document.getElementById('editGender').value = user.gender || '';
        document.getElementById('editBirthDate').value = user.birthDate || '';
        document.getElementById('editAddress').value = user.address || '';

        this.showModal('userEditModal');
    }

    showBulkActionsModal() {
        const selectedCount = this.selectedUsers.size;
        if (selectedCount === 0) {
            this.showToast('Vui lòng chọn ít nhất một người dùng', 'warning');
            return;
        }

        document.getElementById('selectedUsersCount').textContent = selectedCount;
        this.showModal('bulkActionsModal');
    }    async bulkUpdateStatus(status) {
        if (this.selectedUsers.size === 0) return;

        const isActive = status === 'ACTIVE';
        const statusLabel = this.getStatusLabel(isActive);
        if (!confirm(`Bạn có chắc chắn muốn ${statusLabel.toLowerCase()} ${this.selectedUsers.size} người dùng đã chọn?`)) {
            return;
        }

        try {
            const promises = Array.from(this.selectedUsers).map(userId => 
                apiClient.updateUser(userId, { isActive })
            );

            await Promise.all(promises);
            
            this.showToast(`Cập nhật trạng thái thành công cho ${this.selectedUsers.size} người dùng`, 'success');
            this.closeModal('bulkActionsModal');
            this.selectedUsers.clear();
            this.loadUsers();
            this.loadStats();

        } catch (error) {
            console.error('Error bulk updating status:', error);
            this.showToast('Không thể cập nhật trạng thái', 'error');
        }
    }

    async bulkDeleteUsers() {
        if (this.selectedUsers.size === 0) return;

        if (!confirm(`Bạn có chắc chắn muốn xóa ${this.selectedUsers.size} người dùng đã chọn? Hành động này không thể hoàn tác.`)) {
            return;
        }

        try {
            const promises = Array.from(this.selectedUsers).map(userId => 
                apiClient.deleteUser(userId)
            );

            await Promise.all(promises);
            
            this.showToast(`Xóa thành công ${this.selectedUsers.size} người dùng`, 'success');
            this.closeModal('bulkActionsModal');
            this.selectedUsers.clear();
            this.loadUsers();
            this.loadStats();

        } catch (error) {
            console.error('Error bulk deleting users:', error);
            this.showToast('Không thể xóa người dùng', 'error');
        }
    }

    async exportUsers() {
        try {
            this.setButtonLoading(this.exportBtn, true);
            
            // Get all users for export
            const params = { ...this.filters, size: 1000 };
            const response = await apiClient.getUsers(params);
            const users = response.content || [];            // Create CSV content
            const headers = ['Họ tên', 'Tên đăng nhập', 'Email', 'Số điện thoại', 'Vai trò', 'Trạng thái', 'Ngày tham gia'];
            const csvContent = [
                headers.join(','),
                ...users.map(user => [
                    `"${user.fullName || ''}"`,
                    `"${user.username}"`,
                    `"${user.email}"`,
                    `"${user.phone || ''}"`,
                    `"${this.getRoleLabel(user.role)}"`,
                    `"${this.getStatusLabel(user.isActive)}"`,
                    `"${this.formatDate(user.createdAt)}"`
                ].join(','))
            ].join('\n');

            // Download file
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `users_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showToast('Xuất danh sách thành công', 'success');

        } catch (error) {
            console.error('Error exporting users:', error);
            this.showToast('Không thể xuất danh sách', 'error');
        } finally {
            this.setButtonLoading(this.exportBtn, false);
        }
    }

    async refresh() {
        this.selectedUsers.clear();
        await this.loadUsers();
        await this.loadStats();
        this.showToast('Đã làm mới dữ liệu', 'success');
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.currentPage = page;
            this.loadUsers();
        }
    }

    navigateToCreateUser() {
        window.location.href = 'user-create.html';
    }

    // Modal utilities
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    setButtonLoading(button, loading) {
        if (!button) return;

        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');

        if (loading) {
            button.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'flex';
        } else {
            button.disabled = false;
            if (btnText) btnText.style.display = 'flex';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }

    showToast(message, type = 'info') {
        if (!this.toast) return;

        this.toast.textContent = message;
        this.toast.className = `toast ${type}`;
        
        // Show toast
        setTimeout(() => this.toast.classList.add('show'), 100);
        
        // Hide toast after 4 seconds
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 4000);
    }

    // Utility methods
    getFullUrl(relativePath) {
        if (!relativePath) return null;
        return relativePath.startsWith('http') 
            ? relativePath 
            : `${this.serverBaseUrl}${relativePath.startsWith('/') ? relativePath : '/' + relativePath}`;
    }    getRoleLabel(role) {
        const labels = {
            'ADMIN': 'Quản trị viên',
            'USER': 'Người dùng'
        };
        return labels[role] || role || 'Người dùng';
    }    getStatusLabel(isActive) {
        console.log('getStatusLabel called with:', isActive, 'Type:', typeof isActive);
        if (isActive === true) {
            return 'Đang hoạt động';
        } else if (isActive === false) {
            return 'Không hoạt động';
        }
        // Default case
        return 'Không hoạt động';
    }

    getGenderLabel(gender) {
        const labels = {
            'MALE': 'Nam',
            'FEMALE': 'Nữ',
            'OTHER': 'Khác'
        };
        return labels[gender] || 'Chưa cập nhật';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Hôm nay';
        } else if (diffDays === 1) {
            return 'Hôm qua';
        } else if (diffDays < 7) {
            return `${diffDays} ngày trước`;
        } else {
            return date.toLocaleDateString('vi-VN');
        }
    }

    isRecentActivity(dateString) {
        if (!dateString) return false;
        
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.abs(now - date) / (1000 * 60 * 60);
        
        return diffHours <= 24; // Consider activity recent if within 24 hours
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for API client to be available
    const initUsers = () => {
        if (typeof apiClient !== 'undefined' && apiClient) {
            window.adminUsers = new AdminUsers();
        } else {
            setTimeout(initUsers, 100);
        }
    };
    
    initUsers();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.adminUsers) {
        // Cleanup if needed
    }
});

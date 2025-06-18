/**
 * Admin SPA Core System
 * Xử lý các chức năng cơ bản của SPA
 */

class AdminCore {
    constructor() {
        this.api = null;
        this.currentUser = null;
        this.config = {
            apiBaseUrl: 'http://localhost:8080/api',
            itemsPerPage: 10,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        };
        
        this.init();
    }

    /**
     * Khởi tạo core system
     */
    async init() {
        try {
            // Khởi tạo API client
            this.api = new APIClient();
            
            // Kiểm tra authentication
            await this.checkAuth();
            
            // Khởi tạo event listeners
            this.initEventListeners();
            
            // Khởi tạo UI components
            this.initUIComponents();
            
        } catch (error) {
            console.error('Core initialization error:', error);
        }
    }

    /**
     * Kiểm tra authentication
     */
    async checkAuth() {
        const token = localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!token || !user.id) {
            this.redirectToLogin();
            return;
        }

        // Kiểm tra quyền admin
        if (user.role !== 'ADMIN') {
            this.showUnauthorized();
            return;
        }

        this.currentUser = user;
        this.updateUserInfo();
    }

    /**
     * Cập nhật thông tin user trong UI
     */
    updateUserInfo() {
        const adminName = document.getElementById('adminName');
        const adminAvatar = document.getElementById('adminAvatar');
        
        if (adminName && this.currentUser) {
            adminName.textContent = this.currentUser.fullName || this.currentUser.username;
        }

        if (adminAvatar && this.currentUser && this.currentUser.avatar) {
            adminAvatar.src = this.currentUser.avatar;
        }
    }

    /**
     * Chuyển hướng đến trang login
     */
    redirectToLogin() {
        window.location.href = '../login.html';
    }

    /**
     * Hiển thị thông báo không có quyền
     */
    showUnauthorized() {
        document.getElementById('adminContent').innerHTML = `
            <div class="error-page">
                <div class="error-content">
                    <ion-icon name="shield-outline"></ion-icon>
                    <h2>Không có quyền truy cập</h2>
                    <p>Bạn không có quyền truy cập vào trang quản trị này.</p>
                    <a href="../index.html" class="btn btn-primary">Về trang chủ</a>
                </div>
            </div>
        `;
    }

    /**
     * Khởi tạo event listeners
     */
    initEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => this.toggleMobileSidebar());
        }

        // User menu
        const userMenuBtn = document.getElementById('userMenuBtn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserMenu();
            });
        }

        // Click outside to close menus
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-profile')) {
                this.closeUserMenu();
            }
        });

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshCurrentPage());
        }

        // Notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => this.showNotifications());
        }

        // Submenu toggles
        document.addEventListener('click', (e) => {
            const submenuTrigger = e.target.closest('[data-submenu]');
            if (submenuTrigger) {
                e.preventDefault();
                this.toggleSubmenu(submenuTrigger.getAttribute('data-submenu'));
            }
        });
    }

    /**
     * Khởi tạo UI components
     */
    initUIComponents() {
        // Initialize tooltips, modals, etc.
        this.initTooltips();
        this.initModals();
        this.initFormValidation();
    }

    /**
     * Toggle sidebar
     */
    toggleSidebar() {
        const sidebar = document.getElementById('adminSidebar');
        const layout = document.getElementById('adminLayout');
        
        if (sidebar && layout) {
            sidebar.classList.toggle('collapsed');
            layout.classList.toggle('sidebar-collapsed');
        }
    }

    /**
     * Toggle mobile sidebar
     */
    toggleMobileSidebar() {
        const sidebar = document.getElementById('adminSidebar');
        if (sidebar) {
            sidebar.classList.toggle('mobile-open');
        }
    }

    /**
     * Toggle user menu
     */
    toggleUserMenu() {
        const userMenu = document.getElementById('userMenu');
        if (userMenu) {
            userMenu.classList.toggle('open');
        }
    }

    /**
     * Close user menu
     */
    closeUserMenu() {
        const userMenu = document.getElementById('userMenu');
        if (userMenu) {
            userMenu.classList.remove('open');
        }
    }

    /**
     * Toggle submenu
     */
    toggleSubmenu(submenuId) {
        const submenu = document.getElementById(`${submenuId}-submenu`);
        const navItem = submenu?.closest('.nav-item');
        
        if (submenu && navItem) {
            // Close other submenus
            document.querySelectorAll('.nav-item.active').forEach(item => {
                if (item !== navItem) {
                    item.classList.remove('active');
                    const otherSubmenu = item.querySelector('.submenu');
                    if (otherSubmenu) {
                        otherSubmenu.classList.remove('open');
                    }
                }
            });

            // Toggle current submenu
            navItem.classList.toggle('active');
            submenu.classList.toggle('open');
        }
    }

    /**
     * Logout
     */
    async logout() {
        try {
            await this.api.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage and redirect
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '../login.html';
        }
    }

    /**
     * Refresh current page
     */
    refreshCurrentPage() {
        const currentRoute = adminRouter.currentRoute;
        if (currentRoute) {
            adminRouter.handleRoute(currentRoute);
        }
    }

    /**
     * Show notifications
     */
    showNotifications() {
        // TODO: Implement notifications
        showToast('Chức năng thông báo đang được phát triển', 'info');
    }

    /**
     * Initialize tooltips
     */
    initTooltips() {
        // Add tooltip functionality if needed
    }

    /**
     * Initialize modals
     */
    initModals() {
        // Handle modal close buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-close, .modal-overlay')) {
                this.closeModal();
            }
        });

        // Handle ESC key for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    /**
     * Initialize form validation
     */
    initFormValidation() {
        // Add form validation if needed
    }

    /**
     * Show modal
     */
    showModal(content, options = {}) {
        const modalContainer = document.getElementById('modalContainer');
        if (!modalContainer) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal ${options.size || ''}">
                <div class="modal-header">
                    <h3 class="modal-title">${options.title || ''}</h3>
                    <button class="modal-close">
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
            </div>
        `;

        modalContainer.appendChild(modal);
        
        // Add animation
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        return modal;
    }

    /**
     * Close modal
     */
    closeModal() {
        const modalContainer = document.getElementById('modalContainer');
        if (modalContainer) {
            modalContainer.innerHTML = '';
        }
    }

    /**
     * Show confirm dialog
     */
    showConfirm(message, options = {}) {
        return new Promise((resolve) => {
            const footer = `
                <button class="btn btn-secondary" data-action="cancel">Hủy</button>
                <button class="btn btn-danger" data-action="confirm">${options.confirmText || 'Xác nhận'}</button>
            `;

            const modal = this.showModal(
                `<p>${message}</p>`,
                { 
                    title: options.title || 'Xác nhận', 
                    footer: footer 
                }
            );

            modal.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                if (action === 'confirm') {
                    resolve(true);
                    this.closeModal();
                } else if (action === 'cancel') {
                    resolve(false);
                    this.closeModal();
                }
            });
        });
    }

    /**
     * Format date
     */
    formatDate(date, format = 'dd/MM/yyyy') {
        if (!date) return '';
        
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');

        switch (format) {
            case 'dd/MM/yyyy':
                return `${day}/${month}/${year}`;
            case 'dd/MM/yyyy HH:mm':
                return `${day}/${month}/${year} ${hours}:${minutes}`;
            default:
                return d.toLocaleDateString('vi-VN');
        }
    }

    /**
     * Format currency
     */
    formatCurrency(amount) {
        if (!amount) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    /**
     * Debounce function
     */
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

    /**
     * Get file preview URL
     */
    getFilePreviewUrl(file) {
        if (!file) return null;
        return URL.createObjectURL(file);
    }

    /**
     * Validate file
     */
    validateFile(file, options = {}) {
        const maxSize = options.maxSize || this.config.maxFileSize;
        const allowedTypes = options.allowedTypes || this.config.allowedImageTypes;

        if (file.size > maxSize) {
            throw new Error(`File quá lớn. Kích thước tối đa: ${maxSize / 1024 / 1024}MB`);
        }

        if (!allowedTypes.includes(file.type)) {
            throw new Error(`Định dạng file không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(', ')}`);
        }

        return true;
    }
}

// Export core instance
window.adminCore = new AdminCore();

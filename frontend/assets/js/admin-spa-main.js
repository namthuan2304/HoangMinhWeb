/**
 * Admin SPA Main Entry Point
 * Khởi động và điều phối toàn bộ hệ thống SPA
 */

class AdminSPA {
    constructor() {
        this.isInitialized = false;
        this.components = null;
        this.router = null;
        this.core = null;
    }

    /**
     * Khởi động SPA
     */
    async init() {
        try {
            console.log('🚀 Initializing Admin SPA...');
            
            // Kiểm tra môi trường
            this.checkEnvironment();

            // Khởi tạo core components
            await this.initializeCore();

            // Khởi tạo components
            this.initializeComponents();

            // Khởi tạo router
            this.initializeRouter();

            // Khởi động router
            this.startRouter();

            // Thiết lập các event listeners toàn cục
            this.setupGlobalEvents();

            // Đánh dấu đã khởi tạo xong
            this.isInitialized = true;

            console.log('✅ Admin SPA initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize Admin SPA:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Kiểm tra môi trường
     */
    checkEnvironment() {
        // Kiểm tra các dependencies cần thiết
        const requiredGlobals = ['adminCore', 'adminRouter', 'adminComponents', 'APIClient'];
        const missing = requiredGlobals.filter(global => !window[global]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required dependencies: ${missing.join(', ')}`);
        }

        // Kiểm tra browser compatibility
        if (!window.fetch) {
            throw new Error('Browser không hỗ trợ Fetch API');
        }

        if (!window.history || !window.history.pushState) {
            throw new Error('Browser không hỗ trợ History API');
        }
    }

    /**
     * Khởi tạo core system
     */
    async initializeCore() {
        this.core = window.adminCore;
        await this.core.init();
    }

    /**
     * Khởi tạo components
     */
    initializeComponents() {
        this.components = window.adminComponents;
        this.components.init();
    }

    /**
     * Khởi tạo router
     */
    initializeRouter() {
        this.router = window.adminRouter;
        
        // Thêm middleware authentication
        this.router.use(async (path, route) => {
            // Skip auth check for login page
            if (path === 'login') return true;
            
            // Check authentication
            if (!this.core.isAuthenticated()) {
                this.core.redirectToLogin();
                return false; // Block route
            }
            
            return true; // Allow route
        });

        // Thêm middleware loading state
        this.router.use(async (path, route) => {
            // Update document title
            document.title = `${route.title} - Admin Dashboard`;
            
            // Scroll to top
            window.scrollTo(0, 0);
            
            return true;
        });
    }

    /**
     * Khởi động router
     */
    startRouter() {
        this.router.start();
    }

    /**
     * Thiết lập global events
     */
    setupGlobalEvents() {
        // Xử lý lỗi toàn cục
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleGlobalError(event.error);
        });

        // Xử lý unhandled promise rejection
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });

        // Xử lý offline/online
        window.addEventListener('offline', () => {
            showToast('Mất kết nối internet', 'warning');
        });

        window.addEventListener('online', () => {
            showToast('Đã khôi phục kết nối', 'success');
        });

        // Xử lý beforeunload
        window.addEventListener('beforeunload', (event) => {
            // Có thể thêm logic lưu dữ liệu trước khi rời trang
            this.handleBeforeUnload(event);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });

        // Focus management
        document.addEventListener('focusout', (event) => {
            // Có thể thêm logic auto-save
        });
    }

    /**
     * Xử lý lỗi khởi tạo
     */
    handleInitializationError(error) {
        const errorHtml = `
            <div class="initialization-error">
                <div class="error-content">
                    <ion-icon name="warning-outline"></ion-icon>
                    <h2>Lỗi khởi tạo ứng dụng</h2>
                    <p>${error.message}</p>
                    <button onclick="window.location.reload()" class="btn btn-primary">
                        Tải lại trang
                    </button>
                </div>
            </div>
        `;

        document.body.innerHTML = errorHtml;
    }

    /**
     * Xử lý lỗi toàn cục
     */
    handleGlobalError(error) {
        // Log error
        console.error('Global error handled:', error);

        // Hiển thị thông báo cho user (chỉ trong development)
        if (window.location.hostname === 'localhost') {
            if (window.showToast) {
                showToast('Đã xảy ra lỗi: ' + error.message, 'error');
            }
        }

        // Có thể gửi error report về server
        this.reportError(error);
    }

    /**
     * Báo cáo lỗi
     */
    reportError(error) {
        // TODO: Implement error reporting
        // Could send to logging service or backend API
    }

    /**
     * Xử lý beforeunload
     */
    handleBeforeUnload(event) {
        // Kiểm tra có form nào đang được chỉnh sửa không
        const hasUnsavedChanges = document.querySelector('.form-dirty, .has-unsaved-changes');
        
        if (hasUnsavedChanges) {
            const message = 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời khỏi trang?';
            event.preventDefault();
            event.returnValue = message;
            return message;
        }
    }

    /**
     * Xử lý keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + K: Quick search
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            this.openQuickSearch();
        }

        // Escape: Close modal/overlay
        if (event.key === 'Escape') {
            this.handleEscapeKey();
        }

        // Alt + D: Go to dashboard
        if (event.altKey && event.key === 'd') {
            event.preventDefault();
            this.router.navigate('dashboard');
        }
    }

    /**
     * Mở quick search
     */
    openQuickSearch() {
        // TODO: Implement quick search functionality
        showToast('Quick search đang được phát triển', 'info');
    }

    /**
     * Xử lý phím Escape
     */
    handleEscapeKey() {
        // Close modal nếu có
        if (this.core && typeof this.core.closeModal === 'function') {
            this.core.closeModal();
        }

        // Close dropdown menus
        document.querySelectorAll('.dropdown.open, .submenu.open, .user-menu.open').forEach(element => {
            element.classList.remove('open');
        });
    }

    /**
     * Reload application
     */
    reload() {
        window.location.reload();
    }

    /**
     * Restart SPA (soft reload)
     */
    async restart() {
        try {
            // Reset state
            this.isInitialized = false;
            
            // Clear cache nếu có
            if (this.components && this.components.cache) {
                this.components.cache.clear();
            }
            
            // Re-initialize
            await this.init();
        } catch (error) {
            console.error('Failed to restart SPA:', error);
            this.reload(); // Fall back to hard reload
        }
    }

    /**
     * Get app info
     */
    getInfo() {
        return {
            initialized: this.isInitialized,
            currentRoute: this.router?.currentRoute,
            user: this.core?.currentUser,
            version: '1.0.0',
            buildTime: new Date().toISOString()
        };
    }
}

// Initialize and start SPA when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM loaded, starting Admin SPA...');
    
    try {
        // Create and start SPA instance
        window.adminSPA = new AdminSPA();
        await window.adminSPA.init();
        
        // Make it globally available for debugging
        if (window.location.hostname === 'localhost') {
            window.spa = window.adminSPA;
            console.log('🛠 SPA instance available as window.spa for debugging');
        }
        
    } catch (error) {
        console.error('Failed to start Admin SPA:', error);
    }
});

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminSPA;
}

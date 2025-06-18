/**
 * Admin SPA Router System
 * Xử lý điều hướng và routing cho Single Page Application
 */

class AdminRouter {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.middlewares = [];
        
        // Khởi tạo router
        this.init();
    }

    /**
     * Khởi tạo router
     */
    init() {
        // Lắng nghe sự kiện popstate (back/forward browser)
        window.addEventListener('popstate', (event) => {
            this.handleRoute(location.hash.slice(1) || 'dashboard');
        });

        // Lắng nghe click trên các link có data-route
        document.addEventListener('click', (event) => {
            const target = event.target.closest('[data-route]');
            if (target) {
                event.preventDefault();
                const route = target.getAttribute('data-route');
                this.navigate(route);
            }
        });

        // Đăng ký các routes mặc định
        this.registerDefaultRoutes();
    }

    /**
     * Đăng ký route
     */
    register(path, handler, options = {}) {
        this.routes.set(path, {
            handler,
            title: options.title || path,
            middleware: options.middleware || [],
            requireAuth: options.requireAuth !== false
        });
    }

    /**
     * Thêm middleware
     */
    use(middleware) {
        this.middlewares.push(middleware);
    }

    /**
     * Điều hướng đến route
     */
    navigate(path, replace = false) {
        const url = `#${path}`;
        
        if (replace) {
            history.replaceState({ path }, '', url);
        } else {
            history.pushState({ path }, '', url);
        }
        
        this.handleRoute(path);
    }

    /**
     * Xử lý route
     */
    async handleRoute(path) {
        try {
            // Hiển thị loading
            this.showLoading();

            // Tìm route matching
            const route = this.findRoute(path);
            if (!route) {
                throw new Error(`Route not found: ${path}`);
            }

            // Chạy middleware toàn cục
            for (const middleware of this.middlewares) {
                const result = await middleware(path, route);
                if (result === false) return; // Middleware chặn
            }

            // Chạy middleware của route
            for (const middleware of route.middleware) {
                const result = await middleware(path, route);
                if (result === false) return;
            }

            // Kiểm tra authentication
            if (route.requireAuth && !this.isAuthenticated()) {
                this.navigate('login', true);
                return;
            }

            // Cập nhật UI
            this.updateActiveNavigation(path);
            this.updatePageTitle(route.title);

            // Thực thi route handler
            await route.handler(path, this.getRouteParams(path));

            // Lưu current route
            this.currentRoute = path;

        } catch (error) {
            console.error('Router Error:', error);
            this.handleError(error);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Tìm route matching
     */
    findRoute(path) {
        // Exact match first
        if (this.routes.has(path)) {
            return this.routes.get(path);
        }

        // Pattern matching (như tours/:id)
        for (const [routePath, route] of this.routes) {
            if (this.matchRoute(routePath, path)) {
                return route;
            }
        }

        // Default route
        return this.routes.get('404') || null;
    }

    /**
     * Kiểm tra route pattern matching
     */
    matchRoute(routePath, actualPath) {
        const routeParts = routePath.split('/');
        const actualParts = actualPath.split('/');

        if (routeParts.length !== actualParts.length) {
            return false;
        }

        return routeParts.every((part, index) => {
            return part.startsWith(':') || part === actualParts[index];
        });
    }

    /**
     * Lấy route parameters
     */
    getRouteParams(path) {
        const params = {};
        const route = this.findRoute(path);
        
        if (!route) return params;

        // Tìm route pattern
        for (const [routePath] of this.routes) {
            if (this.matchRoute(routePath, path)) {
                const routeParts = routePath.split('/');
                const actualParts = path.split('/');

                routeParts.forEach((part, index) => {
                    if (part.startsWith(':')) {
                        const paramName = part.slice(1);
                        params[paramName] = actualParts[index];
                    }
                });
                break;
            }
        }

        return params;
    }

    /**
     * Cập nhật navigation active state
     */
    updateActiveNavigation(path) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link, .submenu-link').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current route
        const activeLink = document.querySelector(`[data-route="${path}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            
            // Mở submenu nếu cần
            const submenu = activeLink.closest('.submenu');
            if (submenu) {
                submenu.classList.add('open');
                const parentNavItem = submenu.closest('.nav-item');
                if (parentNavItem) {
                    parentNavItem.classList.add('active');
                }
            }
        }
    }

    /**
     * Cập nhật page title
     */
    updatePageTitle(title) {
        document.title = `${title} - Admin Dashboard`;
        const titleElement = document.getElementById('currentPageTitle');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    /**
     * Kiểm tra authentication
     */
    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return token && user.role === 'ADMIN';
    }

    /**
     * Hiển thị loading
     */
    showLoading() {
        const loading = document.getElementById('loadingSpinner');
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    /**
     * Ẩn loading
     */
    hideLoading() {
        const loading = document.getElementById('loadingSpinner');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    /**
     * Xử lý lỗi
     */
    handleError(error) {
        console.error('Router Error:', error);
        
        // Hiển thị error page hoặc toast
        if (window.showToast) {
            showToast('Đã xảy ra lỗi: ' + error.message, 'error');
        }
    }

    /**
     * Đăng ký các routes mặc định
     */
    registerDefaultRoutes() {
        // Dashboard
        this.register('dashboard', () => {
            return adminComponents.loadDashboard();
        }, { title: 'Dashboard' });

        // Tours
        this.register('tours', () => {
            return adminComponents.loadTours();
        }, { title: 'Quản lý Tours' });

        this.register('tours/create', () => {
            return adminComponents.loadTourCreate();
        }, { title: 'Thêm Tour Mới' });

        this.register('tours/:id/edit', (path, params) => {
            return adminComponents.loadTourEdit(params.id);
        }, { title: 'Chỉnh sửa Tour' });

        // Bookings
        this.register('bookings', () => {
            return adminComponents.loadBookings();
        }, { title: 'Quản lý Đặt Tour' });

        this.register('bookings/:id', (path, params) => {
            return adminComponents.loadBookingDetail(params.id);
        }, { title: 'Chi tiết Đặt Tour' });

        // Users
        this.register('users', () => {
            return adminComponents.loadUsers();
        }, { title: 'Quản lý Người dùng' });

        // Articles
        this.register('articles', () => {
            return adminComponents.loadArticles();
        }, { title: 'Quản lý Bài viết' });

        this.register('articles/create', () => {
            return adminComponents.loadArticleCreate();
        }, { title: 'Thêm Bài viết' });

        this.register('articles/:id/edit', (path, params) => {
            return adminComponents.loadArticleEdit(params.id);
        }, { title: 'Chỉnh sửa Bài viết' });

        // Comments
        this.register('comments', () => {
            return adminComponents.loadComments();
        }, { title: 'Quản lý Bình luận' });

        // Reports
        this.register('reports/revenue', () => {
            return adminComponents.loadRevenueReport();
        }, { title: 'Báo cáo Doanh thu' });

        this.register('reports/tours', () => {
            return adminComponents.loadToursReport();
        }, { title: 'Báo cáo Tours' });

        this.register('reports/users', () => {
            return adminComponents.loadUsersReport();
        }, { title: 'Báo cáo Người dùng' });

        // 404
        this.register('404', () => {
            return adminComponents.load404();
        }, { title: 'Không tìm thấy trang' });
    }

    /**
     * Khởi chạy router
     */
    start() {
        const initialPath = location.hash.slice(1) || 'dashboard';
        this.handleRoute(initialPath);
    }
}

// Export router instance
window.adminRouter = new AdminRouter();

// Access Control for User Pages
// Ngăn admin truy cập vào các trang user

class AccessControl {
    constructor() {
        this.init();
    }

    init() {
        // Chỉ chạy kiểm tra nếu có APIClient
        if (typeof apiClient !== 'undefined') {
            this.checkAccess();
        } else {
            // Đợi APIClient được khởi tạo
            document.addEventListener('DOMContentLoaded', () => {
                if (typeof apiClient !== 'undefined') {
                    this.checkAccess();
                }
            });
        }
    }

    checkAccess() {
        // Kiểm tra nếu admin đang truy cập trang user
        if (apiClient.isAuthenticated() && apiClient.isAdmin()) {
            const currentPath = window.location.pathname;
            const currentFile = currentPath.split('/').pop() || 'index.html';
            
            const userPages = [
                'index.html', 
                'tours.html', 
                'tour-detail.html', 
                'articles.html', 
                'article-detail.html', 
                'booking.html', 
                'bookings.html', 
                'profile.html'
            ];
            
            // Kiểm tra nếu admin đang ở trang user
            if (userPages.includes(currentFile)) {
                this.redirectToAdmin();
                return;
            }
            
            // Kiểm tra nếu ở root và không phải admin folder
            if (currentPath === '/' || currentPath === '/frontend/' || currentPath.endsWith('/frontend/')) {
                this.redirectToAdmin();
                return;
            }
        }
    }

    redirectToAdmin() {
        // Hiển thị thông báo
        this.showAccessDeniedMessage();
        
        // Chuyển hướng sau 2 giây
        setTimeout(() => {
            const currentPath = window.location.pathname;
            if (currentPath.includes('/frontend/')) {
                window.location.href = 'admin/dashboard.html';
            } else {
                window.location.href = '/frontend/admin/dashboard.html';
            }
        }, 2000);
    }

    showAccessDeniedMessage() {
        // Tạo overlay thông báo
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;

        const message = document.createElement('div');
        message.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;

        message.innerHTML = `
            <div style="color: #e74c3c; font-size: 48px; margin-bottom: 20px;">
                ⚠️
            </div>
            <h2 style="color: #2c3e50; margin-bottom: 15px;">Truy cập bị từ chối</h2>
            <p style="color: #7f8c8d; margin-bottom: 20px;">
                Admin không được phép truy cập vào các trang dành cho người dùng.
            </p>
            <p style="color: #3498db; font-size: 14px;">
                Đang chuyển hướng về trang quản trị...
            </p>
        `;

        overlay.appendChild(message);
        document.body.appendChild(overlay);
    }
}

// Khởi tạo kiểm tra quyền truy cập
new AccessControl();

// Admin Sidebar Management
class AdminSidebar {
    constructor() {
        this.sidebar = document.getElementById('adminSidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.profileBtn = document.getElementById('profileBtn');
        this.sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
        this.sidebarUserName = document.getElementById('sidebarUserName');
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeSubmenu();
        this.updateUserInfo();
        this.setActiveNavItem();
    }

    bindEvents() {
        // Desktop sidebar toggle
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Mobile sidebar toggle
        if (this.mobileSidebarToggle) {
            this.mobileSidebarToggle.addEventListener('click', () => {
                this.toggleMobileSidebar();
            });
        }

        // Sidebar overlay
        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => {
                this.closeMobileSidebar();
            });
        }

        // Profile button
        if (this.profileBtn) {
            this.profileBtn.addEventListener('click', () => {
                window.location.href = '../profile.html';
            });
        }

        // Logout button in sidebar
        if (this.sidebarLogoutBtn) {
            this.sidebarLogoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Close mobile sidebar when clicking nav links
        document.querySelectorAll('.nav-link, .submenu-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    this.closeMobileSidebar();
                }
            });
        });
    }

    initializeSubmenu() {
        // Handle submenu toggles
        document.querySelectorAll('.nav-link[data-submenu]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const submenuId = link.getAttribute('data-submenu');
                const navItem = link.closest('.nav-item');
                const submenu = document.getElementById(`${submenuId}-submenu`);
                
                if (!navItem || !submenu) {
                    console.warn('Submenu elements not found:', { submenuId, navItem: !!navItem, submenu: !!submenu });
                    return;
                }
                
                // Close other submenus
                document.querySelectorAll('.nav-item.has-submenu').forEach(item => {
                    if (item !== navItem && item.classList.contains('open')) {
                        item.classList.remove('open');
                    }
                });
                
                // Toggle current submenu
                navItem.classList.toggle('open');
                
                console.log('Submenu toggled:', {
                    submenuId,
                    isOpen: navItem.classList.contains('open')
                });
            });
        });

        // Handle submenu link clicks
        document.querySelectorAll('.submenu-link').forEach(link => {
            link.addEventListener('click', (e) => {
                // Remove active class from all submenu links
                document.querySelectorAll('.submenu-link').forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked link
                link.classList.add('active');
                
                // Close mobile sidebar if needed
                if (window.innerWidth <= 1024) {
                    this.closeMobileSidebar();
                }
            });
        });
    }

    toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('collapsed');
            
            // Save state to localStorage
            const isCollapsed = this.sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        }
    }

    toggleMobileSidebar() {
        if (this.sidebar && this.sidebarOverlay) {
            this.sidebar.classList.add('mobile-show');
            this.sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeMobileSidebar() {
        if (this.sidebar && this.sidebarOverlay) {
            this.sidebar.classList.remove('mobile-show');
            this.sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    handleResize() {
        if (window.innerWidth > 1024) {
            this.closeMobileSidebar();
        }
    }

    updateUserInfo() {
        try {
            const user = apiClient ? apiClient.getCurrentUser() : null;
            if (user && this.sidebarUserName) {
                this.sidebarUserName.textContent = user.fullName || user.username || 'Admin';
            }
        } catch (error) {
            console.error('Error updating sidebar user info:', error);
        }
    }

    setActiveNavItem() {
        const currentPath = window.location.pathname;
        const currentFile = currentPath.split('/').pop();
        
        // Remove all active classes first
        document.querySelectorAll('.nav-link, .submenu-link').forEach(link => {
            link.classList.remove('active');
        });
        
        let found = false;
        
        // Check submenu links first
        document.querySelectorAll('.submenu-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href && (href === currentFile || currentPath.includes(href.replace('.html', '')))) {
                link.classList.add('active');
                
                // Open parent submenu
                const parentSubmenu = link.closest('.submenu');
                if (parentSubmenu) {
                    const parentNavItem = parentSubmenu.closest('.nav-item.has-submenu');
                    if (parentNavItem) {
                        parentNavItem.classList.add('open');
                    }
                }
                found = true;
            }
        });
        
        // Check main nav links if no submenu link matched
        if (!found) {
            document.querySelectorAll('.nav-link:not([data-submenu])').forEach(link => {
                const href = link.getAttribute('href');
                if (href && (href === currentFile || currentPath.includes(href.replace('.html', '')))) {
                    link.classList.add('active');
                }
            });
        }
    }

    highlightCurrentPage() {
        this.setActiveNavItem();
    }

    async handleLogout() {
        try {
            // Show confirmation
            if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                return;
            }

            // Show loading state
            const originalContent = this.sidebarLogoutBtn.innerHTML;
            this.sidebarLogoutBtn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon>';
            this.sidebarLogoutBtn.disabled = true;

            // Call logout API
            if (apiClient) {
                await apiClient.logout();
            }

            // Show success message
            this.showToast('Đăng xuất thành công!', 'success');

            // Redirect to login page
            setTimeout(() => {
                window.location.href = '../login.html';
            }, 1000);

        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Đăng xuất thất bại', 'error');
            
            // Restore button state
            if (this.sidebarLogoutBtn) {
                this.sidebarLogoutBtn.innerHTML = '<ion-icon name="log-out-outline"></ion-icon>';
                this.sidebarLogoutBtn.disabled = false;
            }
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

    // Restore sidebar state from localStorage
    restoreState() {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed && this.sidebar) {
            this.sidebar.classList.add('collapsed');
        }
    }
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const initSidebar = () => {
        if (typeof apiClient !== 'undefined') {
            window.adminSidebar = new AdminSidebar();
            window.adminSidebar.restoreState();
            window.adminSidebar.highlightCurrentPage();
        } else {
            setTimeout(initSidebar, 100);
        }
    };
    
    initSidebar();
});

// Export for use in other files
window.AdminSidebar = AdminSidebar;

// Header Management
class HeaderManager {
    constructor() {
        console.log('HeaderManager: Constructor called');
        this.authButtons = document.getElementById('authButtons');
        this.userMenu = document.getElementById('userMenu');
        this.userTrigger = document.getElementById('userTrigger');
        this.userDropdownMenu = document.getElementById('userDropdownMenu');
        this.userName = document.getElementById('userName');
        this.userAvatar = document.querySelector('.user-avatar');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.serverBaseUrl = 'http://localhost:8080';
        
        console.log('HeaderManager: Elements found:', {
            authButtons: !!this.authButtons,
            userMenu: !!this.userMenu,
            userTrigger: !!this.userTrigger,
            userDropdownMenu: !!this.userDropdownMenu,
            userName: !!this.userName,
            userAvatar: !!this.userAvatar,
            logoutBtn: !!this.logoutBtn
        });
        
        this.init();
    }    init() {
        console.log('HeaderManager: Initializing...');
        // Check authentication state
        this.updateAuthState();
        
        // Initialize user dropdown
        this.initUserDropdown();
        
        // Initialize logout functionality
        this.initLogout();
        
        // Listen for auth state changes
        window.addEventListener('authStateChanged', () => {
            this.updateAuthState();
        });
    }

    // Utility method to create full URL for assets
    getFullUrl(relativePath) {
        if (!relativePath) return null;
        return relativePath.startsWith('http') 
            ? relativePath 
            : `${this.serverBaseUrl}${relativePath.startsWith('/') ? relativePath : '/' + relativePath}`;
    }updateAuthState() {
        console.log('Updating auth state...');
        try {
            if (typeof apiClient !== 'undefined' && apiClient && apiClient.isAuthenticated()) {
                console.log('User is authenticated, showing user menu');
                this.showUserMenu();
            } else {
                console.log('User is not authenticated, showing auth buttons');
                this.showAuthButtons();
            }
        } catch (error) {
            console.error('Error updating auth state:', error);
            this.showAuthButtons(); // Fallback to showing auth buttons
        }
    }    showUserMenu() {
        if (this.authButtons) this.authButtons.style.display = 'none';
        if (this.userMenu) this.userMenu.style.display = 'block';
        
        // Update user name and avatar
        try {
            const user = apiClient ? apiClient.getCurrentUser() : null;
            if (user && this.userName) {
                this.userName.textContent = user.fullName || user.username || 'User';
            } else if (this.userName) {
                this.userName.textContent = 'User';
            }

            // Update user avatar
            this.updateUserAvatar(user);
        } catch (error) {
            console.error('Error getting user data:', error);
            if (this.userName) {
                this.userName.textContent = 'User';
            }
            this.setDefaultAvatar();
        }
    }

    updateUserAvatar(user) {
        if (!this.userAvatar) return;

        // Load user profile to get latest avatar
        if (typeof apiClient !== 'undefined' && apiClient && apiClient.isAuthenticated()) {
            apiClient.getUserProfile()
                .then(userProfile => {
                    if (userProfile.avatarUrl) {
                        // Create img element if it doesn't exist
                        let avatarImg = this.userAvatar.querySelector('img');
                        if (!avatarImg) {
                            avatarImg = document.createElement('img');
                            avatarImg.alt = 'User Avatar';
                            avatarImg.style.width = '100%';
                            avatarImg.style.height = '100%';
                            avatarImg.style.borderRadius = '50%';
                            avatarImg.style.objectFit = 'cover';
                            
                            // Hide the icon and add the image
                            const icon = this.userAvatar.querySelector('ion-icon');
                            if (icon) icon.style.display = 'none';
                            this.userAvatar.appendChild(avatarImg);
                        }
                        
                        avatarImg.src = this.getFullUrl(userProfile.avatarUrl);
                    } else {
                        this.setDefaultAvatar();
                    }
                })
                .catch(error => {
                    console.error('Error loading user profile for avatar:', error);
                    this.setDefaultAvatar();
                });
        } else {
            this.setDefaultAvatar();
        }
    }

    setDefaultAvatar() {
        if (!this.userAvatar) return;
        
        // Remove any existing img element
        const existingImg = this.userAvatar.querySelector('img');
        if (existingImg) {
            existingImg.remove();
        }
        
        // Show the default icon
        const icon = this.userAvatar.querySelector('ion-icon');
        if (icon) {
            icon.style.display = 'block';
        }
    }

    showAuthButtons() {
        if (this.authButtons) this.authButtons.style.display = 'flex';
        if (this.userMenu) this.userMenu.style.display = 'none';
    }

    initUserDropdown() {
        console.log('HeaderManager: Initializing user dropdown...', {
            userTrigger: !!this.userTrigger,
            userDropdownMenu: !!this.userDropdownMenu
        });
        
        // Try to find elements again if they weren't found initially
        if (!this.userTrigger) {
            this.userTrigger = document.getElementById('userTrigger');
        }
        
        if (!this.userDropdownMenu) {
            this.userDropdownMenu = document.getElementById('userDropdownMenu');
        }
        
        if (!this.userTrigger || !this.userDropdownMenu) {
            console.warn('HeaderManager: User dropdown elements not found, will retry');
            // Set a retry timer
            setTimeout(() => this.initUserDropdown(), 500);
            return;
        }

        // Toggle dropdown on click
        this.userTrigger.addEventListener('click', (e) => {
            console.log('HeaderManager: User trigger clicked');
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-dropdown')) {
                this.closeDropdown();
            }
        });

        // Close dropdown on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown();
            }
        });
        
        // Add debug click handler to explicitly show dropdown
        this.userTrigger.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            console.log('Double click force toggle');
            if (this.userDropdownMenu) {
                this.userDropdownMenu.style.opacity = '1';
                this.userDropdownMenu.style.visibility = 'visible';
                this.userDropdownMenu.style.transform = 'translateY(0)';
                this.userDropdownMenu.style.display = 'block';
            }
        });
        
        console.log('HeaderManager: User dropdown initialized successfully');
    }

    toggleDropdown() {
        const dropdown = this.userTrigger?.closest('.user-dropdown');
        console.log('HeaderManager: Toggling dropdown', { dropdown: !!dropdown });
        if (dropdown) {
            const isActive = dropdown.classList.contains('active');
            dropdown.classList.toggle('active');
            
            // Explicitly show/hide the dropdown menu for better reliability
            if (this.userDropdownMenu) {
                if (!isActive) {
                    // If dropdown is being activated, ensure dropdown menu is visible
                    this.userDropdownMenu.style.opacity = '1';
                    this.userDropdownMenu.style.visibility = 'visible';
                    this.userDropdownMenu.style.transform = 'translateY(0)';
                } else {
                    // If dropdown is being deactivated
                    this.userDropdownMenu.style.opacity = '0';
                    this.userDropdownMenu.style.visibility = 'hidden';
                    this.userDropdownMenu.style.transform = 'translateY(-10px)';
                }
            }
            
            console.log('HeaderManager: Dropdown toggled', { 
                wasActive: isActive, 
                nowActive: dropdown.classList.contains('active') 
            });
        }
    }

    closeDropdown() {
        const dropdown = this.userTrigger?.closest('.user-dropdown');
        if (dropdown) {
            const wasActive = dropdown.classList.contains('active');
            dropdown.classList.remove('active');
            
            // Explicitly hide the dropdown menu
            if (this.userDropdownMenu) {
                this.userDropdownMenu.style.opacity = '0';
                this.userDropdownMenu.style.visibility = 'hidden';
                this.userDropdownMenu.style.transform = 'translateY(-10px)';
            }
            
            if (wasActive) {
                console.log('HeaderManager: Dropdown closed');
            }
        }
    }

    initLogout() {
        if (!this.logoutBtn) return;

        this.logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.handleLogout();
        });
    }

    async handleLogout() {
        try {
            // Show loading state
            const originalText = this.logoutBtn.innerHTML;
            this.logoutBtn.innerHTML = '<ion-icon name="loading-outline" class="rotating"></ion-icon><span>Đang đăng xuất...</span>';
            this.logoutBtn.disabled = true;

            // Call logout API
            await apiClient.logout();

            // Show success message
            this.showToast('Đăng xuất thành công!', 'success');

            // Update UI
            this.updateAuthState();
            this.closeDropdown();

            // Redirect to home if on protected pages
            const protectedPages = ['/profile.html', '/bookings.html', '/favorites.html'];
            const currentPage = window.location.pathname;
            
            if (protectedPages.some(page => currentPage.includes(page))) {
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }

        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Đăng xuất thất bại', 'error');
        } finally {
            // Restore button state
            if (this.logoutBtn) {
                this.logoutBtn.innerHTML = '<ion-icon name="log-out-outline"></ion-icon><span data-translate="logout">Đăng xuất</span>';
                this.logoutBtn.disabled = false;
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

        // Add to page
        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }    // Trigger auth state change event
    static triggerAuthStateChange() {
        console.log('Triggering auth state change...');
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        
        // Also manually update if header manager exists
        if (window.headerManager) {
            window.headerManager.updateAuthState();
        }
    }
}

// CSS for toast notifications
const toastStyles = `
<style>
.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--white);
    border-radius: 8px;
    box-shadow: 0 4px 20px hsla(0, 0%, 0%, 0.15);
    padding: 16px;
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    min-width: 300px;
}

.toast.show {
    transform: translateX(0);
}

.toast-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.toast-success {
    border-left: 4px solid #27ae60;
}

.toast-error {
    border-left: 4px solid #e74c3c;
}

.toast-info {
    border-left: 4px solid var(--bright-navy-blue);
}

.toast ion-icon {
    font-size: 20px;
}

.toast-success ion-icon {
    color: #27ae60;
}

.toast-error ion-icon {
    color: #e74c3c;
}

.toast-info ion-icon {
    color: var(--bright-navy-blue);
}

.rotating {
    animation: rotate 1s linear infinite;
}

@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>
`;

// Add toast styles to head
document.head.insertAdjacentHTML('beforeend', toastStyles);

// Initialize header manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for API client to be available with longer timeout
    const initHeaderManager = () => {
        if (typeof apiClient !== 'undefined' && apiClient) {
            console.log('Initializing HeaderManager...');
            window.headerManager = new HeaderManager();
        } else {
            console.log('Waiting for API client...');
            // Retry after a short delay, max 10 times
            setTimeout(initHeaderManager, 200);
        }
    };
    
    initHeaderManager();
});

// Also initialize when window loads (fallback)
window.addEventListener('load', () => {
    if (typeof apiClient !== 'undefined' && !window.headerManager) {
        console.log('Fallback: Initializing HeaderManager on window load...');
        window.headerManager = new HeaderManager();
    }
});

// Export for debugging
window.HeaderManager = HeaderManager;

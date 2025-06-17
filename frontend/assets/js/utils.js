// Utility functions cho trang Index
class IndexUtils {
    // Format giá tiền
    static formatPrice(price) {
        if (!price) return '0₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }

    // Format ngày tháng
    static formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Truncate text
    static truncateText(text, maxLength = 100) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Debounce function
    static debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Show loading state
    static showLoading(element) {
        if (!element) return;
        element.classList.add('loading');
        element.style.opacity = '0.6';
        element.style.pointerEvents = 'none';
    }

    // Hide loading state
    static hideLoading(element) {
        if (!element) return;
        element.classList.remove('loading');
        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
    }

    // Get full avatar URL with server base URL
    static getFullAvatarUrl(avatarUrl) {
        if (!avatarUrl) return null;
        
        // Nếu đã là URL đầy đủ thì return luôn
        if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
            return avatarUrl;
        }
        
        // Nếu là đường dẫn tương đối, thêm base URL
        const baseUrl = window.location.protocol + '//' + window.location.hostname + ':8080';
        return baseUrl + (avatarUrl.startsWith('/') ? avatarUrl : '/' + avatarUrl);
    }

    // Create loading spinner
    static createSpinner() {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        return spinner;
    }

    // Show toast notification
    static showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <ion-icon name="${this.getToastIcon(type)}"></ion-icon>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Get toast icon based on type
    static getToastIcon(type) {
        const icons = {
            success: 'checkmark-circle-outline',
            error: 'close-circle-outline',
            warning: 'warning-outline',
            info: 'information-circle-outline'
        };
        return icons[type] || icons.info;
    }

    // Validate email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate phone number (Vietnam format)
    static isValidPhone(phone) {
        const phoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    // Scroll to element smoothly
    static scrollToElement(elementId, offset = 0) {
        const element = document.getElementById(elementId);
        if (element) {
            const elementPosition = element.offsetTop - offset;
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    }

    // Check if user is on mobile
    static isMobile() {
        return window.innerWidth <= 768;
    }

    // Generate star rating HTML
    static generateStarRating(rating, maxStars = 5) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let starsHTML = '';

        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<ion-icon name="star"></ion-icon>';
        }

        // Half star
        if (hasHalfStar) {
            starsHTML += '<ion-icon name="star-half"></ion-icon>';
        }

        // Empty stars
        const emptyStars = maxStars - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<ion-icon name="star-outline"></ion-icon>';
        }

        return starsHTML;
    }

    // Local storage helpers
    static setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    static getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    static removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }

    // Session storage helpers
    static setSessionItem(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to sessionStorage:', error);
        }
    }

    static getSessionItem(key) {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from sessionStorage:', error);
            return null;
        }
    }

    // Image lazy loading
    static initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // Copy to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Đã sao chép vào clipboard', 'success');
        } catch (error) {
            console.error('Failed to copy text:', error);
            this.showToast('Không thể sao chép', 'error');
        }
    }

    // Analytics helpers (for future implementation)
    static trackEvent(eventName, properties = {}) {
        // Placeholder for analytics tracking
        console.log('Track event:', eventName, properties);
    }

    static trackPageView(pageName) {
        // Placeholder for page view tracking
        console.log('Track page view:', pageName);
    }
}

// Export for use in other files
window.IndexUtils = IndexUtils;

// Global constants for API
window.API_BASE_URL = 'http://localhost:8080';

// Global helper functions for authentication
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function isAuthenticated() {
    return !!localStorage.getItem('authToken');
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Global toast notification function (if not already defined)
if (typeof window.showToast === 'undefined') {
    window.showToast = function(message, type = 'info', duration = 3000) {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Show toast
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Hide and remove toast
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    };
}

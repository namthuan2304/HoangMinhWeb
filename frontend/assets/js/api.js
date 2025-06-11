// API Client cho Travel Booking System
class APIClient {
    constructor() {
        this.baseURL = 'http://localhost:8080/api';
        this.serverURL = 'http://localhost:8080'; // Base server URL for static resources
        this.token = localStorage.getItem('authToken');
        this.refreshToken = localStorage.getItem('refreshToken');
    }

    // Helper method để tạo headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Helper method để xử lý response
    async handleResponse(response) {
        if (response.status === 401) {
            // Token hết hạn, thử refresh
            const refreshed = await this.refreshAuthToken();
            if (!refreshed) {
                this.logout();
                throw new Error('Phiên đăng nhập đã hết hạn');
            }
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Có lỗi xảy ra' }));
            throw new Error(error.message || 'Request failed');
        }

        return response.json();
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(options.auth !== false),
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);
            return await this.handleResponse(response);
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }    // Authentication Methods
    async login(credentials) {
        try {
            const response = await this.request('/auth/signin', {
                method: 'POST',
                body: JSON.stringify(credentials),
                auth: false,
            });

            if (response.token) {
                this.token = response.token;
                this.refreshToken = response.refreshToken;
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('refreshToken', this.refreshToken);
                
                // Tạo user object từ response
                const user = {
                    id: response.id,
                    username: response.username,
                    email: response.email,
                    fullName: response.fullName,
                    roles: response.roles,
                    role: response.roles && response.roles.length > 0 ? response.roles[0].replace('ROLE_', '') : 'USER'
                };
                localStorage.setItem('user', JSON.stringify(user));
            }

            return response;
        } catch (error) {
            throw new Error('Đăng nhập thất bại: ' + error.message);
        }
    }

    async register(userData) {
        try {
            return await this.request('/auth/signup', {
                method: 'POST',
                body: JSON.stringify(userData),
                auth: false,
            });
        } catch (error) {
            throw new Error('Đăng ký thất bại: ' + error.message);
        }
    }    async refreshAuthToken() {
        if (!this.refreshToken) return false;

        try {
            const response = await this.request(`/auth/refresh-token?refreshToken=${this.refreshToken}`, {
                method: 'POST',
                auth: false,
            });

            if (response.success && response.data && response.data.token) {
                this.token = response.data.token;
                this.refreshToken = response.data.refreshToken;
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('refreshToken', this.refreshToken);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }

        return false;
    }

    async logout() {
        try {
            await this.request('/auth/signout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.token = null;
            this.refreshToken = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    }

    async forgotPassword(email) {
        return await this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
            auth: false,
        });
    }

    async resetPassword(token, newPassword) {
        return await this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword }),
            auth: false,
        });
    }

    // Users Methods
    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/users?${queryString}` : '/users';
        return await this.request(endpoint);
    }

    async getUser(id) {
        return await this.request(`/users/${id}`);
    }

    async getUserProfile() {
        return await this.request('/users/profile');
    }

    async updateUserProfile(userData) {
        return await this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    async updateUser(id, userData) {
        return await this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    async deleteUser(id) {
        return await this.request(`/users/${id}`, {
            method: 'DELETE',
        });
    }

    async changePassword(passwordData) {
        return await this.request('/users/change-password', {
            method: 'POST',
            body: JSON.stringify(passwordData),
        });
    }    async uploadAvatar(avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);

        const url = `${this.baseURL}/users/upload-avatar`;
        const config = {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                // Don't set Content-Type for FormData - browser will set it automatically
            },
        };

        try {
            const response = await fetch(url, config);
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Avatar upload error:', error);
            throw error;
        }
    }

    // Comments Methods
    async getCommentsByTour(tourId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/comments/tour/${tourId}?${queryString}` : `/comments/tour/${tourId}`;
        return await this.request(endpoint, { auth: false });
    }

    async getTourRating(tourId) {
        return await this.request(`/comments/tour/${tourId}/rating`, { auth: false });
    }

    async createComment(commentData) {
        return await this.request('/comments', {
            method: 'POST',
            body: JSON.stringify(commentData),
        });
    }

    async updateComment(id, commentData) {
        return await this.request(`/comments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(commentData),
        });
    }

    async deleteComment(id) {
        return await this.request(`/comments/${id}`, {
            method: 'DELETE',
        });
    }

    async getUserComments(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/comments/my-comments?${queryString}` : '/comments/my-comments';
        return await this.request(endpoint);
    }

    // Articles Methods
    async getArticles(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/articles?${queryString}` : '/articles';
        return await this.request(endpoint, { auth: false });
    }

    async getArticle(slug) {
        return await this.request(`/articles/${slug}`, { auth: false });
    }

    async createArticle(articleData) {
        return await this.request('/articles', {
            method: 'POST',
            body: JSON.stringify(articleData),
        });
    }

    async updateArticle(id, articleData) {
        return await this.request(`/articles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(articleData),
        });
    }

    async deleteArticle(id) {
        return await this.request(`/articles/${id}`, {
            method: 'DELETE',
        });
    }

    async publishArticle(id) {
        return await this.request(`/articles/${id}/publish`, {
            method: 'POST',
        });
    }

    // Additional Articles Methods
    async getArticleTags() {
        return await this.request('/articles/tags', { auth: false });
    }

    async trackArticleView(articleId) {
        return await this.request(`/articles/${articleId}/view`, {
            method: 'POST',
            auth: false
        });
    }

    async getArticleComments(articleId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/comments/article/${articleId}?${queryString}` : `/comments/article/${articleId}`;
        return await this.request(endpoint, { auth: false });
    }

    async createArticleComment(commentData) {
        return await this.request('/comments', {
            method: 'POST',
            body: JSON.stringify(commentData),
        });
    }

    // Bookings Methods
    async createBooking(bookingData) {
        return await this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData),
        });
    }

    async getBookings(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/bookings/admin?${queryString}` : '/bookings/admin';
        return await this.request(endpoint);
    }

    async getBooking(id) {
        return await this.request(`/bookings/${id}`);
    }    async getUserBookings(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/bookings/my-bookings?${queryString}` : '/bookings/my-bookings';
        return await this.request(endpoint);
    }

    async updateBookingStatus(id, status) {
        return await this.request(`/bookings/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    async cancelBooking(id) {
        return await this.request(`/bookings/${id}/cancel`, {
            method: 'POST',
        });
    }

    // Tours Methods
    async getTours(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/tours?${queryString}` : '/tours';
        return await this.request(endpoint, { auth: false });
    }

    async getTour(id) {
        return await this.request(`/tours/${id}`, { auth: false });
    }

    async searchTours(searchParams) {
        const queryString = new URLSearchParams(searchParams).toString();
        return await this.request(`/tours/search?${queryString}`, { auth: false });
    }

    async getFeaturedTours() {
        return await this.request('/tours/featured', { auth: false });
    }

    async getRelatedTours(tourId, limit = 5) {
        return await this.request(`/tours/${tourId}/related?limit=${limit}`, { auth: false });
    }

    async createTour(tourData) {
        return await this.request('/tours', {
            method: 'POST',
            body: JSON.stringify(tourData),
        });
    }

    async updateTour(id, tourData) {
        return await this.request(`/tours/${id}`, {
            method: 'PUT',
            body: JSON.stringify(tourData),
        });
    }

    async deleteTour(id) {
        return await this.request(`/tours/${id}`, {
            method: 'DELETE',
        });
    }

    async uploadTourImages(tourId, images) {
        const formData = new FormData();
        images.forEach(image => formData.append('files', image));

        const url = `${this.baseURL}/tours/${tourId}/upload-images`;
        const config = {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                // Don't set Content-Type for FormData - browser will set it automatically
            },
        };

        try {
            const response = await fetch(url, config);
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Tour images upload error:', error);
            throw error;
        }
    }

    // Enhanced Tours Methods
    async getToursForAdmin(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/tours/admin?${queryString}` : '/tours/admin';
        return await this.request(endpoint);
    }

    async updateTourStatus(tourId, status) {
        return await this.request(`/tours/${tourId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    async getToursByCategory(category, params = {}) {
        const queryString = new URLSearchParams({...params, category}).toString();
        return await this.request(`/tours/category?${queryString}`, { auth: false });
    }

    async getToursByPriceRange(minPrice, maxPrice, params = {}) {
        const queryString = new URLSearchParams({...params, minPrice, maxPrice}).toString();
        return await this.request(`/tours/price-range?${queryString}`, { auth: false });
    }

    async duplicateTour(tourId) {
        return await this.request(`/tours/${tourId}/duplicate`, {
            method: 'POST',
        });
    }

    async getTourStatistics(tourId) {
        return await this.request(`/tours/${tourId}/statistics`);
    }

    // Statistics Methods
    async getDashboard() {
        return await this.request('/statistics/dashboard');
    }

    async getMonthlyRevenue() {
        return await this.request('/statistics/revenue/monthly?year=' + new Date().getFullYear());
    }

    async getQuarterlyRevenue() {
        return await this.request('/statistics/revenue/quarterly?year=' + new Date().getFullYear());
    }

    async getTopBookedTours(limit = 10) {
        return await this.request(`/bookings/statistics/top-tours?limit=${limit}`);
    }

    // PDF Methods
    async getInvoicePDF(bookingId) {
        const response = await fetch(`${this.baseURL}/pdf/invoice/${bookingId}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to generate PDF');
        }

        return response.blob();
    }

    async getAdminInvoicePDF(bookingId) {
        const response = await fetch(`${this.baseURL}/pdf/admin/invoice/${bookingId}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to generate PDF');
        }

        return response.blob();
    }

    async getMonthlyRevenuePDF(year, month) {
        const response = await fetch(`${this.baseURL}/statistics/revenue/monthly/pdf?year=${year}&month=${month}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to generate PDF');
        }

        return response.blob();
    }

    // Utility Methods
    isAuthenticated() {
        if (!this.token) {
            return false;
        }
        
        // Check if token is expired (basic check)
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            
            if (payload.exp && payload.exp < currentTime) {
                console.log('Token expired');
                this.logout();
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error parsing token:', error);
            this.logout();
            return false;
        }
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    }    isAdmin() {
        return this.hasRole('ADMIN');
    }

    // Profile Management Methods
    async updateProfile(userData) {
        return await this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    // Helper method để download file
    downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    // Helper method to create full URL for images and static resources
    getFullImageUrl(relativePath) {
        console.log('getFullImageUrl called with:', relativePath);
        
        if (!relativePath) {
            console.log('No path provided, returning null');
            return null;
        }
        
        // If already a full URL, return as is
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
            console.log('Already full URL:', relativePath);
            return relativePath;
        }
        
        // If it's a relative path starting with /, add server URL
        if (relativePath.startsWith('/')) {
            const fullUrl = `${this.serverURL}${relativePath}`;
            console.log('Path starts with /, result:', fullUrl);
            return fullUrl;
        }
        
        // If it's a relative path starting with "uploads/", add server URL and leading slash
        if (relativePath.startsWith('uploads/')) {
            const fullUrl = `${this.serverURL}/${relativePath}`;
            console.log('Path starts with uploads/, result:', fullUrl);
            return fullUrl;
        }
        
        // If it's a relative path without /, treat as filename and add uploads path
        const fullUrl = `${this.serverURL}/uploads/${relativePath}`;
        console.log('Default case, result:', fullUrl);
        return fullUrl;
    }

    // Helper method to get first valid image from tour images array (enhanced)
    getTourImageUrl(tour) {
        if (!tour) return this.getDefaultTourImage();
        
        // Check mainImageUrl first (primary image from backend)
        if (tour.mainImageUrl) {
            return this.getFullImageUrl(tour.mainImageUrl);
        }
        
        // Handle different image field names
        let images = tour.images || tour.imageUrls || tour.tourImages || [];
        
        // If images is a string, convert to array
        if (typeof images === 'string') {
            try {
                images = JSON.parse(images);
            } catch (e) {
                images = [images];
            }
        }
        
        // If images is not an array, make it one
        if (!Array.isArray(images)) {
            images = images ? [images] : [];
        }
        
        // Get first valid image
        if (images.length > 0) {
            const firstImage = images[0];
            return this.getFullImageUrl(firstImage);
        }
        
        // Check single image field
        if (tour.image || tour.imageUrl) {
            return this.getFullImageUrl(tour.image || tour.imageUrl);
        }
        
        // Return default image
        return this.getDefaultTourImage();
    }

    // Helper method to get default tour image
    getDefaultTourImage() {
        return '../assets/images/default-tour.jpg';
    }

    async deleteTourImage(tourId, imageUrl) {
        return await this.request(`/tours/${tourId}/images?imageUrl=${encodeURIComponent(imageUrl)}`, {
            method: 'DELETE',
        });
    }

    async setMainImage(tourId, imageUrl) {
        return await this.request(`/tours/${tourId}/set-main-image?imageUrl=${encodeURIComponent(imageUrl)}`, {
            method: 'POST',
        });
    }
}

// Tạo instance global
window.apiClient = new APIClient();

// Export cho sử dụng trong modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}

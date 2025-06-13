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
    }    // Helper method để xử lý response
    async handleResponse(response) {
        if (!response.ok) {
            let errorMessage = 'Đã xảy ra lỗi';
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (parseError) {
                // If can't parse JSON error response
                if (response.status >= 500) {
                    errorMessage = 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.';
                } else if (response.status === 404) {
                    errorMessage = 'Không tìm thấy dữ liệu.';
                } else if (response.status === 403) {
                    errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
                } else if (response.status === 401) {
                    errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                } else {
                    errorMessage = `Lỗi HTTP ${response.status}`;
                }
            }
            
            throw new Error(errorMessage);
        }

        try {
            return await response.json();
        } catch (error) {
            // Handle empty response or non-JSON response
            console.warn('Response is not valid JSON:', error);
            return null;
        }
    }    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...this.getHeaders(),
                ...options.headers
            },
            ...options
        };

        if (options.body && config.method !== 'GET') {
            config.body = options.body;
        }        try {
            console.log(`API ${config.method} Request:`, url, options.body);
            const response = await fetch(url, config);
            const result = await this.handleResponse(response);
            console.log(`API ${config.method} Response:`, result);
            return result;
        } catch (error) {
            console.error('API Request Error:', error);
            
            // Add network error handling
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
            }
            
            throw error;
        }
    }// Authentication Methods
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
    }    async resetPassword(token, newPassword) {
        const params = new URLSearchParams();
        params.append('token', token);
        params.append('newPassword', newPassword);
        
        return await this.request(`/auth/reset-password?${params.toString()}`, {
            method: 'POST',
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
    }    async getUserComments(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/comments/my-comments?${queryString}` : '/comments/my-comments';
        return await this.request(endpoint);
    }

    // Admin Comments Methods
    async getAllComments(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/comments/admin?${queryString}` : '/comments/admin';
        return await this.request(endpoint);
    }

    async approveComment(id) {
        return await this.request(`/comments/${id}/approve`, {
            method: 'POST',
        });
    }    async rejectComment(id, reason) {
        const url = `/comments/${id}/reject${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`;
        return await this.request(url, {
            method: 'POST',
        });
    }// Alias method for consistency with admin-comments.js
    async get(endpoint) {
        return await this.request(endpoint);
    }    async post(endpoint, data = {}) {
        return await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }    async delete(endpoint) {
        return await this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // Articles Methods
    async getArticles(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/articles?${queryString}` : '/articles';
        return await this.request(endpoint, { auth: false });
    }

    async getAdminArticles(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/articles/admin?${queryString}` : '/articles/admin';
        return await this.request(endpoint);
    }

    async getArticle(slug) {
        return await this.request(`/articles/${slug}`, { auth: false });
    }

    async getArticleById(id) {
        return await this.request(`/articles/admin/${id}`);
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
    }    async publishArticle(id) {
        return await this.request(`/articles/${id}/publish`, {
            method: 'POST',
        });
    }

    async unpublishArticle(id) {
        return await this.request(`/articles/${id}/unpublish`, {
            method: 'POST',
        });
    }

    async uploadFeaturedImage(id, file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const url = `${this.baseURL}/articles/${id}/upload-featured-image`;
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
            console.error('Featured image upload error:', error);
            throw error;
        }
    }    // Additional Articles Methods
    async getArticleTags() {
        return await this.request('/articles/tags', { auth: false });
    }

    async uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const url = `${this.baseURL}/upload/image`;
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
            console.error('Image upload error:', error);
            throw error;
        }
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
    }    async updateBookingStatus(id, status, notes = null) {
        const params = new URLSearchParams({ status });
        if (notes) {
            params.append('notes', notes);
        }
        return await this.request(`/bookings/${id}/status?${params.toString()}`, {
            method: 'PUT',
        });
    }    async cancelBooking(id, reason = null) {
        const params = new URLSearchParams();
        if (reason) {
            params.append('reason', reason);
        }
        
        const endpoint = params.toString() ? `/bookings/${id}/cancel?${params.toString()}` : `/bookings/${id}/cancel`;
        return await this.request(endpoint, {
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
    }    async updateTourStatus(tourId, status) {
        return await this.request(`/tours/${tourId}/status?status=${encodeURIComponent(status)}`, {
            method: 'PUT',
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

    async getMonthlyRevenue(year = new Date().getFullYear()) {
        return await this.request(`/statistics/revenue/monthly?year=${year}`);
    }

    async getQuarterlyRevenue(year = new Date().getFullYear()) {
        return await this.request(`/statistics/revenue/quarterly?year=${year}`);
    }

    async getYearlyRevenue(year = new Date().getFullYear()) {
        return await this.request(`/statistics/revenue/yearly?year=${year}`);
    }

    async getUserStatsByMonth(year = new Date().getFullYear()) {
        return await this.request(`/statistics/users/monthly?year=${year}`);
    }

    async getTopBookedTours(limit = 10) {
        return await this.request(`/statistics/tours/top-booked?limit=${limit}`);
    }

    async getBookingStatsByStatus() {
        return await this.request('/statistics/bookings/status');
    }

    async getTourStatsByType() {
        return await this.request('/statistics/tours/type');
    }

    async getTourStatsByStatus() {
        return await this.request('/statistics/tours/status');
    }

    async getSystemActivityStats() {
        return await this.request('/statistics/system-activity');
    }

    async getMonthlyGrowthStats(year, month) {
        return await this.request(`/statistics/growth/monthly?year=${year}&month=${month}`);
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

    async getYearlyRevenuePDF(year) {
        const response = await fetch(`${this.baseURL}/statistics/revenue/yearly/pdf?year=${year}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to generate yearly PDF');
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

    // Categories Management APIs
    async getCategories(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/categories?${queryString}` : '/categories';
        return await this.request(endpoint, { auth: false });
    }

    async getCategoriesForAdmin(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/categories/admin?${queryString}` : '/categories/admin';
        return await this.request(endpoint);
    }

    async getCategoryById(id) {
        return await this.request(`/categories/${id}`, { auth: false });
    }

    async createCategory(categoryData) {
        return await this.request('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData),
        });
    }

    async updateCategory(id, categoryData) {
        return await this.request(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData),
        });
    }

    async deleteCategory(id) {
        return await this.request(`/categories/${id}`, {
            method: 'DELETE',
        });
    }

    async getCategoryStatistics() {
        return await this.request('/categories/statistics');
    }

    async updateCategoryStatus(categoryId, status) {
        return await this.request(`/categories/${categoryId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }
}

// Tạo instance global
window.apiClient = new APIClient();

// Export cho sử dụng trong modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}

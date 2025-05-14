// Profile Page JavaScript
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.currentPage = 1;
        this.bookingsPerPage = 10;
        this.init();
    }

    init() {
        // Check authentication
        this.checkAuthentication();
        
        // Initialize components
        this.initializeTabs();
        this.initializeProfile();
        this.initializePasswordToggle();
        this.initializeForms();
        this.initializeAvatarUpload();
        
        // Load user data
        this.loadUserProfile();
        this.loadUserBookings();
    }

    checkAuthentication() {
        if (!apiClient.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        this.currentUser = apiClient.getCurrentUser();
    }

    initializeTabs() {
        const tabButtons = document.querySelectorAll('.profile-nav-item');
        const tabContents = document.querySelectorAll('.profile-tab');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(tab => tab.classList.remove('active'));
                
                // Add active class to clicked button and corresponding tab
                button.classList.add('active');
                document.getElementById(`${tabId}Tab`).classList.add('active');
                
                // Load tab-specific data
                if (tabId === 'bookings') {
                    this.loadUserBookings();
                }
            });
        });
    }

    initializeProfile() {
        // Update header with user info
        if (this.currentUser) {
            const userName = document.getElementById('userName');
            const profileName = document.getElementById('profileName');
            const profileEmail = document.getElementById('profileEmail');
            
            if (userName) userName.textContent = this.currentUser.fullName || this.currentUser.username;
            if (profileName) profileName.textContent = this.currentUser.fullName || this.currentUser.username;
            if (profileEmail) profileEmail.textContent = this.currentUser.email;
        }
    }

    initializePasswordToggle() {
        const toggleButtons = document.querySelectorAll('.password-toggle');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const input = button.previousElementSibling;
                const icon = button.querySelector('ion-icon');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.name = 'eye-off-outline';
                } else {
                    input.type = 'password';
                    icon.name = 'eye-outline';
                }
            });
        });
    }

    initializeForms() {
        // Personal info form
        const personalForm = document.getElementById('personalInfoForm');
        if (personalForm) {
            personalForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleUpdateProfile(personalForm);
            });
        }

        // Change password form
        const passwordForm = document.getElementById('changePasswordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleChangePassword(passwordForm);
            });
        }

        // Booking status filter
        const statusFilter = document.getElementById('bookingStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.currentPage = 1;
                this.loadUserBookings();
            });
        }
    }

    initializeAvatarUpload() {
        const avatarUploadBtn = document.getElementById('avatarUploadBtn');
        const avatarInput = document.getElementById('avatarInput');
        
        if (avatarUploadBtn && avatarInput) {
            avatarUploadBtn.addEventListener('click', () => {
                avatarInput.click();
            });

            avatarInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await this.handleAvatarUpload(file);
                }
            });
        }
    }

    async loadUserProfile() {
        try {
            const userProfile = await apiClient.getUserProfile();
            this.fillProfileForm(userProfile);
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.showToast('Không thể tải thông tin người dùng', 'error');
        }
    }    fillProfileForm(userProfile) {
        // Fill personal information form
        const formFields = {
            'fullName': userProfile.fullName,
            'username': userProfile.username,
            'email': userProfile.email,
            'phone': userProfile.phone,
            'dateOfBirth': userProfile.birthDate,  // Map birthDate to dateOfBirth
            'gender': userProfile.gender,
            'address': userProfile.address
        };

        Object.entries(formFields).forEach(([fieldName, value]) => {
            const field = document.getElementById(fieldName);
            if (field && value) {
                field.value = value;
            }
        });

        // Update avatar if available
        if (userProfile.avatar) {
            const avatarImg = document.getElementById('avatarImage');
            if (avatarImg) {
                avatarImg.src = userProfile.avatar;
            }
        }
    }    async handleUpdateProfile(form) {
        const formData = new FormData(form);
        const userData = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            birthDate: formData.get('dateOfBirth'),  // Map dateOfBirth to birthDate
            gender: formData.get('gender'),
            address: formData.get('address')
        };

        // Validate form
        if (!this.validateProfileForm(userData)) {
            return;
        }

        const updateBtn = document.getElementById('updateProfileBtn');
        const btnText = updateBtn.querySelector('.btn-text');
        const btnLoading = updateBtn.querySelector('.btn-loading');

        try {
            // Show loading
            this.setButtonLoading(updateBtn, btnText, btnLoading, true);
            this.clearFormErrors();

            // Update profile
            const updatedUser = await apiClient.updateUserProfile(userData);
            
            // Update localStorage
            const currentUser = apiClient.getCurrentUser();
            const newUser = { ...currentUser, ...updatedUser };
            localStorage.setItem('user', JSON.stringify(newUser));
            
            // Update UI
            this.initializeProfile();
            this.showToast('Cập nhật thông tin thành công!', 'success');

        } catch (error) {
            console.error('Update profile error:', error);
            this.showToast(error.message || 'Cập nhật thông tin thất bại', 'error');
        } finally {
            this.setButtonLoading(updateBtn, btnText, btnLoading, false);
        }
    }

    async handleChangePassword(form) {
        const formData = new FormData(form);
        const passwordData = {
            currentPassword: formData.get('currentPassword'),
            newPassword: formData.get('newPassword'),
            confirmNewPassword: formData.get('confirmNewPassword')
        };

        // Validate password form
        if (!this.validatePasswordForm(passwordData)) {
            return;
        }

        const changeBtn = document.getElementById('changePasswordBtn');
        const btnText = changeBtn.querySelector('.btn-text');
        const btnLoading = changeBtn.querySelector('.btn-loading');

        try {
            // Show loading
            this.setButtonLoading(changeBtn, btnText, btnLoading, true);
            this.clearFormErrors();

            // Change password
            await apiClient.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            // Reset form
            form.reset();
            this.showToast('Đổi mật khẩu thành công!', 'success');

        } catch (error) {
            console.error('Change password error:', error);
            this.showToast(error.message || 'Đổi mật khẩu thất bại', 'error');
        } finally {
            this.setButtonLoading(changeBtn, btnText, btnLoading, false);
        }
    }

    async handleAvatarUpload(file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            this.showToast('Vui lòng chọn file hình ảnh', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            this.showToast('File không được vượt quá 5MB', 'error');
            return;
        }

        try {
            // Show loading
            const avatarUploadBtn = document.getElementById('avatarUploadBtn');
            avatarUploadBtn.style.opacity = '0.5';
            avatarUploadBtn.disabled = true;

            // Upload avatar
            const response = await apiClient.uploadAvatar(file);
            
            // Update avatar image
            const avatarImg = document.getElementById('avatarImage');
            if (avatarImg && response.avatarUrl) {
                avatarImg.src = response.avatarUrl;
            }

            this.showToast('Cập nhật ảnh đại diện thành công!', 'success');

        } catch (error) {
            console.error('Avatar upload error:', error);
            this.showToast(error.message || 'Tải lên ảnh đại diện thất bại', 'error');
        } finally {
            const avatarUploadBtn = document.getElementById('avatarUploadBtn');
            avatarUploadBtn.style.opacity = '1';
            avatarUploadBtn.disabled = false;
        }
    }    async loadUserBookings() {
        try {
            const statusFilter = document.getElementById('bookingStatusFilter');
            const status = statusFilter ? statusFilter.value : '';
            
            const params = {
                page: this.currentPage - 1,
                size: this.bookingsPerPage
            };
            
            if (status) {
                params.status = status;
            }

            const bookingsData = await apiClient.getUserBookings(params);
            this.renderBookings(bookingsData);

        } catch (error) {
            console.error('Error loading bookings:', error);
            this.showToast('Không thể tải lịch sử đặt tour', 'error');
        }
    }

    renderBookings(bookingsData) {
        const bookingsList = document.getElementById('bookingsList');
        if (!bookingsList) return;

        if (!bookingsData || bookingsData.length === 0) {
            bookingsList.innerHTML = `
                <div class="empty-state">
                    <ion-icon name="calendar-outline"></ion-icon>
                    <h3>Chưa có đặt tour nào</h3>
                    <p>Bạn chưa đặt tour nào. Hãy khám phá các tour du lịch tuyệt vời của chúng tôi!</p>
                    <a href="tours.html" class="btn btn-primary">Xem tour</a>
                </div>
            `;
            return;
        }

        const bookingsHTML = bookingsData.map(booking => this.createBookingCard(booking)).join('');
        bookingsList.innerHTML = bookingsHTML;
    }

    createBookingCard(booking) {
        const statusClass = this.getBookingStatusClass(booking.status);
        const statusText = this.getBookingStatusText(booking.status);
        
        return `
            <div class="booking-card">
                <div class="booking-header">
                    <div class="booking-info">
                        <h4 class="booking-tour-name">${booking.tour?.title || 'N/A'}</h4>
                        <p class="booking-code">Mã đặt tour: ${booking.bookingCode}</p>
                    </div>
                    <div class="booking-status ${statusClass}">
                        ${statusText}
                    </div>
                </div>
                
                <div class="booking-details">
                    <div class="booking-detail-item">
                        <ion-icon name="calendar-outline"></ion-icon>
                        <span>Ngày đặt: ${this.formatDate(booking.bookingDate)}</span>
                    </div>
                    <div class="booking-detail-item">
                        <ion-icon name="airplane-outline"></ion-icon>
                        <span>Ngày khởi hành: ${this.formatDate(booking.tour?.startDate)}</span>
                    </div>
                    <div class="booking-detail-item">
                        <ion-icon name="people-outline"></ion-icon>
                        <span>Số người: ${booking.numberOfPeople}</span>
                    </div>
                    <div class="booking-detail-item">
                        <ion-icon name="card-outline"></ion-icon>
                        <span>Tổng tiền: ${this.formatCurrency(booking.totalAmount)}</span>
                    </div>
                </div>
                
                <div class="booking-actions">
                    <button class="btn btn-outline btn-sm" onclick="profileManager.viewBookingDetails('${booking.id}')">
                        Xem chi tiết
                    </button>
                    ${booking.status === 'PENDING' ? `
                        <button class="btn btn-danger btn-sm" onclick="profileManager.cancelBooking('${booking.id}')">
                            Hủy đặt tour
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getBookingStatusClass(status) {
        const statusClasses = {
            'PENDING': 'status-pending',
            'CONFIRMED': 'status-confirmed',
            'CANCELLED': 'status-cancelled',
            'COMPLETED': 'status-completed'
        };
        return statusClasses[status] || 'status-default';
    }

    getBookingStatusText(status) {
        const statusTexts = {
            'PENDING': 'Chờ xử lý',
            'CONFIRMED': 'Đã xác nhận',
            'CANCELLED': 'Đã hủy',
            'COMPLETED': 'Hoàn thành'
        };
        return statusTexts[status] || status;
    }

    async viewBookingDetails(bookingId) {
        try {
            const booking = await apiClient.getBooking(bookingId);
            this.showBookingModal(booking);
        } catch (error) {
            console.error('Error loading booking details:', error);
            this.showToast('Không thể tải chi tiết đặt tour', 'error');
        }
    }

    async cancelBooking(bookingId) {
        if (!confirm('Bạn có chắc chắn muốn hủy đặt tour này?')) {
            return;
        }

        try {
            await apiClient.cancelBooking(bookingId);
            this.showToast('Hủy đặt tour thành công!', 'success');
            this.loadUserBookings(); // Reload bookings
        } catch (error) {
            console.error('Error cancelling booking:', error);
            this.showToast(error.message || 'Không thể hủy đặt tour', 'error');
        }
    }

    showBookingModal(booking) {
        // Create and show booking details modal
        const modalHTML = `
            <div class="modal-overlay" id="bookingModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Chi tiết đặt tour</h3>
                        <button class="modal-close" onclick="profileManager.closeModal('bookingModal')">
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="booking-detail-section">
                            <h4>Thông tin tour</h4>
                            <p><strong>Tên tour:</strong> ${booking.tour?.title || 'N/A'}</p>
                            <p><strong>Điểm đến:</strong> ${booking.tour?.destination || 'N/A'}</p>
                            <p><strong>Thời gian:</strong> ${booking.tour?.duration || 'N/A'}</p>
                        </div>
                        
                        <div class="booking-detail-section">
                            <h4>Thông tin đặt tour</h4>
                            <p><strong>Mã đặt tour:</strong> ${booking.bookingCode}</p>
                            <p><strong>Ngày đặt:</strong> ${this.formatDate(booking.bookingDate)}</p>
                            <p><strong>Số người:</strong> ${booking.numberOfPeople}</p>
                            <p><strong>Tổng tiền:</strong> ${this.formatCurrency(booking.totalAmount)}</p>
                            <p><strong>Trạng thái:</strong> ${this.getBookingStatusText(booking.status)}</p>
                        </div>
                        
                        ${booking.notes ? `
                            <div class="booking-detail-section">
                                <h4>Ghi chú</h4>
                                <p>${booking.notes}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }

    // Validation methods
    validateProfileForm(userData) {
        let isValid = true;

        if (!userData.fullName.trim()) {
            this.showFieldError('fullNameError', 'Vui lòng nhập họ và tên');
            isValid = false;
        }

        if (!userData.email.trim()) {
            this.showFieldError('emailError', 'Vui lòng nhập email');
            isValid = false;
        } else if (!this.validateEmail(userData.email)) {
            this.showFieldError('emailError', 'Email không hợp lệ');
            isValid = false;
        }

        if (userData.phone && !this.validatePhone(userData.phone)) {
            this.showFieldError('phoneError', 'Số điện thoại không hợp lệ');
            isValid = false;
        }

        return isValid;
    }

    validatePasswordForm(passwordData) {
        let isValid = true;

        if (!passwordData.currentPassword.trim()) {
            this.showFieldError('currentPasswordError', 'Vui lòng nhập mật khẩu hiện tại');
            isValid = false;
        }

        if (!passwordData.newPassword.trim()) {
            this.showFieldError('newPasswordError', 'Vui lòng nhập mật khẩu mới');
            isValid = false;
        } else if (passwordData.newPassword.length < 6) {
            this.showFieldError('newPasswordError', 'Mật khẩu phải có ít nhất 6 ký tự');
            isValid = false;
        }

        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            this.showFieldError('confirmNewPasswordError', 'Mật khẩu xác nhận không khớp');
            isValid = false;
        }

        return isValid;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePhone(phone) {
        const phoneRegex = /^[0-9+\-\s()]{10,}$/;
        return phoneRegex.test(phone);
    }

    // Utility methods
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    }

    formatCurrency(amount) {
        if (!amount) return '0 VNĐ';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    setButtonLoading(button, textElement, loadingElement, isLoading) {
        if (isLoading) {
            button.disabled = true;
            textElement.style.display = 'none';
            loadingElement.style.display = 'flex';
        } else {
            button.disabled = false;
            textElement.style.display = 'block';
            loadingElement.style.display = 'none';
        }
    }

    showFieldError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            const inputElement = errorElement.previousElementSibling;
            if (inputElement && inputElement.classList.contains('form-control')) {
                inputElement.classList.add('error');
            }
        }
    }

    clearFormErrors() {
        document.querySelectorAll('.error-message').forEach(element => {
            element.textContent = '';
        });
        document.querySelectorAll('.form-control.error').forEach(element => {
            element.classList.remove('error');
        });
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <ion-icon name="${type === 'success' ? 'checkmark-circle' : type === 'error' ? 'alert-circle' : 'information-circle'}-outline"></ion-icon>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Hide toast after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
});

// Initialize header manager
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing HeaderManager...');
    window.headerManager = new HeaderManager();
});

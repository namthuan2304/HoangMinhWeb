// Profile Page JavaScript
class ProfileManager {    constructor() {
        this.currentUser = null;
        this.init();
    }init() {
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
    }

    checkAuthentication() {
        if (!apiClient.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        this.currentUser = apiClient.getCurrentUser();
    }    initializeTabs() {
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
        }        // Booking status filter (removed - bookings moved to separate page)
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
            avatarUploadBtn.disabled = false;        }
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

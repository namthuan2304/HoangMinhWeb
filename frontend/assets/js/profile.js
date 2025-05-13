// Profile Page JavaScript
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.originalData = {};
        this.init();
    }

    init() {
        // Check authentication
        if (!apiClient.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        // Load user data
        this.loadUserData();
        
        // Initialize form handlers
        this.initializeProfileForm();
        this.initializePasswordForm();
        this.initializePasswordToggle();
        this.initializeSettings();
    }

    async loadUserData() {
        try {
            this.currentUser = apiClient.getCurrentUser();
            if (!this.currentUser) {
                // Try to fetch from API
                this.currentUser = await apiClient.getUserProfile();
            }

            if (this.currentUser) {
                this.populateForm();
                this.originalData = { ...this.currentUser };
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showToast('Không thể tải thông tin người dùng', 'error');
        }
    }

    populateForm() {
        const fields = ['fullName', 'username', 'email', 'phoneNumber', 'address'];
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && this.currentUser[field]) {
                element.value = this.currentUser[field];
            }
        });
    }

    initializeProfileForm() {
        const profileForm = document.getElementById('profileForm');
        if (!profileForm) return;

        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleProfileUpdate(profileForm);
        });

        // Cancel button
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.resetForm();
            });
        }
    }

    initializePasswordForm() {
        const passwordForm = document.getElementById('passwordForm');
        if (!passwordForm) return;

        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handlePasswordChange(passwordForm);
        });

        // Password confirmation validation
        const newPassword = document.getElementById('newPassword');
        const confirmNewPassword = document.getElementById('confirmNewPassword');
        
        if (confirmNewPassword) {
            confirmNewPassword.addEventListener('input', () => {
                this.validatePasswordMatch(newPassword.value, confirmNewPassword.value);
            });
        }
    }

    initializePasswordToggle() {
        const toggleButtons = document.querySelectorAll('.password-toggle');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const input = button.previousElementSibling || button.parentElement.querySelector('input');
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

    initializeSettings() {
        const settingsInputs = document.querySelectorAll('.settings-list input[type="checkbox"]');
        
        settingsInputs.forEach(input => {
            input.addEventListener('change', async () => {
                await this.handleSettingChange(input.id, input.checked);
            });
        });
    }

    async handleProfileUpdate(form) {
        const formData = new FormData(form);
        const updateData = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phoneNumber: formData.get('phoneNumber'),
            address: formData.get('address')
        };

        // Validate form
        if (!this.validateProfileForm(updateData)) {
            return;
        }

        const saveBtn = document.getElementById('saveBtn');
        const btnText = saveBtn.querySelector('.btn-text');
        const btnLoading = saveBtn.querySelector('.btn-loading');

        try {
            // Show loading
            this.setButtonLoading(saveBtn, btnText, btnLoading, true);
            
            // Clear previous errors
            this.clearFormErrors();

            // Update profile
            const response = await apiClient.updateProfile(updateData);
            
            // Update local user data
            this.currentUser = { ...this.currentUser, ...updateData };
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            this.originalData = { ...this.currentUser };

            // Update header if needed
            if (typeof HeaderManager !== 'undefined') {
                HeaderManager.triggerAuthStateChange();
            }

            this.showToast('Cập nhật thông tin thành công!', 'success');
            
        } catch (error) {
            console.error('Profile update error:', error);
            this.showToast(error.message || 'Cập nhật thông tin thất bại', 'error');
            
            // Handle specific field errors
            this.handleApiErrors(error);
        } finally {
            this.setButtonLoading(saveBtn, btnText, btnLoading, false);
        }
    }

    async handlePasswordChange(form) {
        const formData = new FormData(form);
        const passwordData = {
            currentPassword: formData.get('currentPassword'),
            newPassword: formData.get('newPassword'),
            confirmNewPassword: formData.get('confirmNewPassword')
        };

        // Validate passwords
        if (!this.validatePasswordForm(passwordData)) {
            return;
        }

        const changePasswordBtn = document.getElementById('changePasswordBtn');
        const btnText = changePasswordBtn.querySelector('.btn-text');
        const btnLoading = changePasswordBtn.querySelector('.btn-loading');

        try {
            // Show loading
            this.setButtonLoading(changePasswordBtn, btnText, btnLoading, true);
            
            // Clear previous errors
            this.clearFormErrors();

            // Change password
            await apiClient.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            // Clear form
            form.reset();
            
            this.showToast('Đổi mật khẩu thành công!', 'success');
            
        } catch (error) {
            console.error('Password change error:', error);
            this.showToast(error.message || 'Đổi mật khẩu thất bại', 'error');
            
            // Handle specific field errors
            if (error.message.includes('current password') || error.message.includes('mật khẩu hiện tại')) {
                this.showFieldError('currentPasswordError', 'Mật khẩu hiện tại không chính xác');
            }
        } finally {
            this.setButtonLoading(changePasswordBtn, btnText, btnLoading, false);
        }
    }

    async handleSettingChange(settingId, value) {
        try {
            const settings = {
                emailNotifications: value,
                smsNotifications: document.getElementById('smsNotifications')?.checked || false,
                marketingEmails: document.getElementById('marketingEmails')?.checked || false,
            };

            // Update the changed setting
            settings[settingId] = value;

            await apiClient.updateUserSettings(settings);
            
            this.showToast('Cài đặt đã được cập nhật', 'success');
        } catch (error) {
            console.error('Settings update error:', error);
            this.showToast('Không thể cập nhật cài đặt', 'error');
              // Revert the setting
            document.getElementById(settingId).checked = !value;
        }
    }

    // Validation Methods
    validateProfileForm(data) {
        let isValid = true;

        // Full name validation
        if (!data.fullName?.trim()) {
            this.showFieldError('fullNameError', 'Vui lòng nhập họ và tên');
            isValid = false;
        }

        // Email validation
        if (!data.email?.trim()) {
            this.showFieldError('emailError', 'Vui lòng nhập email');
            isValid = false;
        } else if (!this.validateEmail(data.email)) {
            this.showFieldError('emailError', 'Email không hợp lệ');
            isValid = false;
        }

        // Phone validation
        if (data.phoneNumber && !this.validatePhone(data.phoneNumber)) {
            this.showFieldError('phoneNumberError', 'Số điện thoại không hợp lệ');
            isValid = false;
        }

        return isValid;
    }

    validatePasswordForm(data) {
        let isValid = true;

        // Current password
        if (!data.currentPassword?.trim()) {
            this.showFieldError('currentPasswordError', 'Vui lòng nhập mật khẩu hiện tại');
            isValid = false;
        }

        // New password
        if (!data.newPassword?.trim()) {
            this.showFieldError('newPasswordError', 'Vui lòng nhập mật khẩu mới');
            isValid = false;
        } else if (data.newPassword.length < 6) {
            this.showFieldError('newPasswordError', 'Mật khẩu mới phải có ít nhất 6 ký tự');
            isValid = false;
        }

        // Confirm password
        if (!data.confirmNewPassword?.trim()) {
            this.showFieldError('confirmNewPasswordError', 'Vui lòng xác nhận mật khẩu mới');
            isValid = false;
        } else if (data.newPassword !== data.confirmNewPassword) {
            this.showFieldError('confirmNewPasswordError', 'Mật khẩu xác nhận không khớp');
            isValid = false;
        }

        // Check if new password is different from current
        if (data.currentPassword === data.newPassword) {
            this.showFieldError('newPasswordError', 'Mật khẩu mới phải khác mật khẩu hiện tại');
            isValid = false;
        }

        return isValid;
    }

    validatePasswordMatch(newPassword, confirmPassword) {
        const errorElement = document.getElementById('confirmNewPasswordError');
        if (newPassword !== confirmPassword && confirmPassword.length > 0) {
            this.showFieldError('confirmNewPasswordError', 'Mật khẩu xác nhận không khớp');
        } else {
            if (errorElement) errorElement.textContent = '';
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePhone(phone) {
        const phoneRegex = /^[0-9+\-\s()]{10,}$/;
        return phoneRegex.test(phone);
    }

    // Utility Methods
    resetForm() {
        this.populateForm();
        this.clearFormErrors();
        this.showToast('Đã khôi phục thông tin ban đầu', 'info');
    }

    setButtonLoading(button, textElement, loadingElement, isLoading) {
        if (isLoading) {
            button.disabled = true;
            if (textElement) textElement.style.display = 'none';
            if (loadingElement) loadingElement.style.display = 'flex';
        } else {
            button.disabled = false;
            if (textElement) textElement.style.display = 'block';
            if (loadingElement) loadingElement.style.display = 'none';
        }
    }

    showFieldError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            const inputElement = errorElement.previousElementSibling || 
                                document.querySelector(`[name="${elementId.replace('Error', '')}"]`);
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

    handleApiErrors(error) {
        if (error.field) {
            this.showFieldError(error.field + 'Error', error.message);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `toast ${type}`;
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Hide toast after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for API client to be available
    if (typeof apiClient !== 'undefined') {
        new ProfileManager();
    } else {
        // Retry after a short delay
        setTimeout(() => {
            if (typeof apiClient !== 'undefined') {
                new ProfileManager();
            }
        }, 100);
    }
});

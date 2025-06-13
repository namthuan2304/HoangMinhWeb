// Profile Page JavaScript
class ProfileManager {    constructor() {
        this.currentUser = null;
        this.serverBaseUrl = 'http://localhost:8080';
        this.init();
    }    // Utility method to create full URL for assets
    getFullUrl(relativePath) {
        if (!relativePath) return null;
        return relativePath.startsWith('http') 
            ? relativePath 
            : `${this.serverBaseUrl}${relativePath.startsWith('/') ? relativePath : '/' + relativePath}`;
    }init() {
        console.log('Initializing profile page...');
        
        // Check authentication first
        const isAuthenticated = this.checkAuthentication();
        if (!isAuthenticated) {
            console.log('Authentication failed, stopping initialization');
            return;
        }
          console.log('User is authenticated, initializing components');
        
        // Reset toast element to hidden state
        this.initializeToast();
        
        // Initialize components
        this.initializeTabs();
        this.initializeProfile();
        this.initializePasswordToggle();
        this.initializeForms();
        this.initializeAvatarUpload();
          // Load user data
        this.loadUserProfile();
        
        // Restore any preserved form data
        setTimeout(() => this.restoreTabData(), 500);
        
        console.log('Profile page initialization complete');
    }

    checkAuthentication() {
        console.log('Checking authentication...');
        try {
            if (!apiClient || !apiClient.isAuthenticated()) {
                console.log('User not authenticated, redirecting to login');
                window.location.href = 'login.html?redirect=profile.html';
                return false;
            }
            this.currentUser = apiClient.getCurrentUser();
            console.log('User authenticated:', this.currentUser ? this.currentUser.username : 'unknown');
            return true;
        } catch (error) {
            console.error('Error checking authentication:', error);
            // Give a small delay before redirecting
            setTimeout(() => {
                window.location.href = 'login.html?redirect=profile.html';
            }, 500);
            return false;        }
    }

    initializeToast() {
        console.log('Initializing toast element');
        const toast = document.getElementById('toast');
        if (toast) {
            // Reset toast to hidden state
            toast.className = 'toast';
            toast.innerHTML = '';
            console.log('Toast element reset to hidden state');
        }
    }

    initializeTabs() {
        console.log('Initializing profile tabs');
        const tabButtons = document.querySelectorAll('.profile-nav-item');
        const tabContents = document.querySelectorAll('.profile-tab');
        
        console.log('Found tab buttons:', tabButtons.length);
        console.log('Found tab contents:', tabContents.length);

        if (tabButtons.length === 0 || tabContents.length === 0) {
            console.warn('Tab elements not found. Will retry in 500ms.');
            setTimeout(() => this.initializeTabs(), 500);
            return;
        }        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = button.getAttribute('data-tab');
                console.log('Tab clicked:', tabId);
                
                // Preserve current tab data before switching
                this.preserveTabData();
                
                // Remove active class from all buttons
                tabButtons.forEach(btn => btn.classList.remove('active'));
                
                // Use the new method to handle tab switching
                if (this.activateTab(tabId)) {
                    // Add active class to clicked button
                    button.classList.add('active');
                    
                    // Restore data for the new tab
                    setTimeout(() => this.restoreTabData(), 100);
                }
            });
        });
        
        // Initialize first tab if none is active
        if (!document.querySelector('.profile-tab.active')) {
            const firstTab = tabButtons[0];
            if (firstTab) {
                firstTab.click();
                console.log('Auto-activated first tab');
            }
        }
        
        console.log('Tab initialization complete');
    }

    resetAllTabs() {
        const tabContents = document.querySelectorAll('.profile-tab');
        tabContents.forEach(tab => {
            tab.classList.remove('active');
            // Clear any inline styles that might interfere
            tab.style.cssText = '';
        });
    }    activateTab(tabId) {
        console.log('Activating tab:', tabId);
        
        // First reset all tabs
        this.resetAllTabs();
        
        // Then activate the target tab
        const targetTab = document.getElementById(`${tabId}Tab`);
        if (targetTab) {
            targetTab.classList.add('active');
            console.log('Successfully activated tab:', tabId);
            
            // Debug the state
            this.debugTabState();
            
            return true;
        } else {
            console.error('Tab not found:', `${tabId}Tab`);
            return false;
        }
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
        });        // Update avatar if available
        if (userProfile.avatarUrl) {
            const avatarImg = document.getElementById('avatarImage');
            if (avatarImg) {
                avatarImg.src = this.getFullUrl(userProfile.avatarUrl);
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
            avatarUploadBtn.disabled = true;            // Upload avatar
            const response = await apiClient.uploadAvatar(file);
              // Update avatar image immediately with response
            const avatarImg = document.getElementById('avatarImage');
            if (avatarImg && response.avatarUrl) {
                avatarImg.src = this.getFullUrl(response.avatarUrl);
            }

            // Also reload user profile to get updated data
            await this.loadUserProfile();

            this.showToast('Cập nhật ảnh đại diện thành công!', 'success');

        } catch (error) {
            console.error('Avatar upload error:', error);
            this.showToast(error.message || 'Tải lên ảnh đại diện thất bại', 'error');
        } finally {
            const avatarUploadBtn = document.getElementById('avatarUploadBtn');
            avatarUploadBtn.style.opacity = '1';
            avatarUploadBtn.disabled = false;        }
    }

    // Preserve form data when switching tabs
    preserveTabData() {
        const forms = document.querySelectorAll('.profile-tab form');
        forms.forEach(form => {
            const formData = new FormData(form);
            const tabId = form.closest('.profile-tab').id;
            
            // Store form data in session storage
            const dataObj = {};
            for (let [key, value] of formData.entries()) {
                dataObj[key] = value;
            }
            sessionStorage.setItem(`tabData_${tabId}`, JSON.stringify(dataObj));
        });
    }

    restoreTabData() {
        const forms = document.querySelectorAll('.profile-tab form');
        forms.forEach(form => {
            const tabId = form.closest('.profile-tab').id;
            const savedData = sessionStorage.getItem(`tabData_${tabId}`);
            
            if (savedData) {
                try {
                    const dataObj = JSON.parse(savedData);
                    Object.keys(dataObj).forEach(key => {
                        const field = form.querySelector(`[name="${key}"]`);
                        if (field && field.type !== 'password') {
                            field.value = dataObj[key];
                        }
                    });
                } catch (error) {
                    console.warn('Could not restore form data for', tabId, error);
                }
            }
        });
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
    }    showToast(message, type = 'info') {
        // Use existing toast element
        const toast = document.getElementById('toast');
        if (!toast) return;

        // Clear any existing content and classes
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-content">
                <ion-icon name="${type === 'success' ? 'checkmark-circle' : type === 'error' ? 'alert-circle' : 'information-circle'}-outline" class="toast-icon"></ion-icon>
                <span>${message}</span>
            </div>
        `;

        // Add type class
        toast.classList.add(`toast-${type}`);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Hide toast after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // Enhanced debugging for tab switching
    debugTabState() {
        const tabButtons = document.querySelectorAll('.profile-nav-item');
        const tabContents = document.querySelectorAll('.profile-tab');
        
        console.log('=== Tab State Debug ===');
        console.log('Active buttons:', Array.from(tabButtons).filter(btn => btn.classList.contains('active')).map(btn => btn.getAttribute('data-tab')));
        console.log('Active tabs:', Array.from(tabContents).filter(tab => tab.classList.contains('active')).map(tab => tab.id));
        console.log('Visible tabs:', Array.from(tabContents).filter(tab => {
            const computed = window.getComputedStyle(tab);
            return computed.display !== 'none' && computed.visibility !== 'hidden' && computed.opacity !== '0';
        }).map(tab => tab.id));
        console.log('=== End Debug ===');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing ProfileManager...');
    
    // Wait for API client to be available
    const initializeManagers = () => {
        if (typeof apiClient !== 'undefined' && apiClient) {
            // First initialize the profile manager
            window.profileManager = new ProfileManager();
            
            // Then check if header manager exists, if not create it
            if (!window.headerManager) {
                console.log('Initializing HeaderManager from profile page...');
                window.headerManager = new HeaderManager();
            }
        } else {
            console.log('Waiting for API client...');
            setTimeout(initializeManagers, 200);
        }
    };
    
    initializeManagers();
});

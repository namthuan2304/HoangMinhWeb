// Authentication JavaScript
class AuthManager {
    constructor() {
        this.initializeAuth();
    }

    initializeAuth() {
        // Check if user is already logged in
        if (apiClient.isAuthenticated()) {
            this.redirectIfAuthenticated();
        }

        // Initialize form handlers
        this.initializeLoginForm();
        this.initializeRegisterForm();
        this.initializeForgotPasswordForm();
        this.initializeResetPasswordForm();
        this.initializePasswordToggle();
    }    redirectIfAuthenticated() {
        const currentPage = window.location.pathname;
        const authPages = ['/login.html', '/register.html', '/forgot-password.html'];
        
        if (authPages.some(page => currentPage.includes(page))) {
            const user = apiClient.getCurrentUser();
            if (user && user.role === 'ADMIN') {
                window.location.href = 'admin/dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        }
    }

    initializeLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin(loginForm);
        });
    }

    initializeRegisterForm() {
        const registerForm = document.getElementById('registerForm');
        if (!registerForm) return;

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister(registerForm);
        });

        // Password validation
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        
        if (password) {
            // Add password validation on input
            password.addEventListener('input', () => {
                this.validatePasswordRealTime(password);
            });
            
            // Add password validation on blur
            password.addEventListener('blur', () => {
                this.validatePasswordRealTime(password);
            });
        }
        
        if (password && confirmPassword) {
            confirmPassword.addEventListener('input', () => {
                this.validatePasswordMatchRealTime(password, confirmPassword);
            });
        }
    }

    initializeForgotPasswordForm() {
        const forgotForm = document.getElementById('forgotPasswordForm');
        if (!forgotForm) return;

        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleForgotPassword(forgotForm);
        });
    }

    initializeResetPasswordForm() {
        const resetForm = document.getElementById('resetPasswordForm');
        if (!resetForm) return;

        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleResetPassword(resetForm);
        });

        // Password validation for reset form
        const newPassword = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        
        if (newPassword) {
            // Add password validation on input
            newPassword.addEventListener('input', () => {
                this.validatePasswordRealTime(newPassword);
            });
            
            // Add password validation on blur
            newPassword.addEventListener('blur', () => {
                this.validatePasswordRealTime(newPassword);
            });
        }
        
        if (newPassword && confirmPassword) {
            confirmPassword.addEventListener('input', () => {
                this.validatePasswordMatchRealTime(newPassword, confirmPassword);
            });
        }
    }    initializePasswordToggle() {
        const toggleButtons = document.querySelectorAll('.password-toggle');
        console.log('Found password toggle buttons:', toggleButtons.length);
        
        toggleButtons.forEach((button, index) => {
            console.log(`Setting up toggle button ${index + 1}`);
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const input = button.previousElementSibling;
                const icon = button.querySelector('ion-icon');
                
                console.log('Password toggle clicked', { input, icon });
                
                if (input && input.type === 'password') {
                    input.type = 'text';
                    if (icon) icon.name = 'eye-off-outline';
                    console.log('Password shown');
                } else if (input) {
                    input.type = 'password';
                    if (icon) icon.name = 'eye-outline';
                    console.log('Password hidden');
                }
            });
        });
    }

    async handleLogin(form) {
        const formData = new FormData(form);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        // Validate form
        if (!this.validateLoginForm(credentials)) {
            return;
        }

        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoading = loginBtn.querySelector('.btn-loading');

        try {
            // Show loading
            this.setButtonLoading(loginBtn, btnText, btnLoading, true);

            // Clear previous errors
            this.clearFormErrors();

            // Attempt login
            const response = await apiClient.login(credentials);

            // Show success message
            this.showToast('Đăng nhập thành công!', 'success');

            // Remember me
            if (formData.get('rememberMe')) {
                localStorage.setItem('rememberMe', 'true');
            }

            // Trigger auth state change event
            console.log('Login successful, triggering auth state change...');
            if (typeof HeaderManager !== 'undefined') {
                HeaderManager.triggerAuthStateChange();
            } else {
                window.dispatchEvent(new CustomEvent('authStateChanged'));
            }

            // Redirect based on user role
            setTimeout(() => {
                const user = apiClient.getCurrentUser();
                if (user && user.role === 'ADMIN') {
                    window.location.href = 'admin/dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1000);

        } catch (error) {
            console.error('Login error:', error);
            this.showFormError(error.message || 'Đăng nhập thất bại');
        } finally {
            // Hide loading
            this.setButtonLoading(loginBtn, btnText, btnLoading, false);
        }
    }

    async handleRegister(form) {
        const formData = new FormData(form);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            fullName: formData.get('fullName'),
            phoneNumber: formData.get('phoneNumber')
        };

        // Validate form
        const validationError = this.validateRegisterForm(userData, formData.get('confirmPassword'));
        if (validationError) {
            this.showFormError(validationError);
            return;
        }

        const registerBtn = document.getElementById('registerBtn');
        const btnText = registerBtn.querySelector('.btn-text');
        const btnLoading = registerBtn.querySelector('.btn-loading');

        try {
            // Show loading
            this.setButtonLoading(registerBtn, btnText, btnLoading, true);

            // Clear previous errors
            this.clearFormErrors();

            // Attempt registration
            await apiClient.register(userData);

            // Show success message
            this.showToast('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.', 'success');

            // Redirect to login
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            console.error('Register error:', error);
            this.showFormError(error.message || 'Đăng ký thất bại');
        } finally {
            // Hide loading
            this.setButtonLoading(registerBtn, btnText, btnLoading, false);
        }
    }

    async handleForgotPassword(form) {
        const formData = new FormData(form);
        const email = formData.get('email');

        if (!this.validateEmail(email)) {
            this.showFormError('Vui lòng nhập email hợp lệ');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        try {
            // Show loading
            this.setButtonLoading(submitBtn, btnText, btnLoading, true);

            // Clear previous errors
            this.clearFormErrors();

            // Send reset request
            await apiClient.forgotPassword(email);

            // Show success message
            this.showToast('Email khôi phục mật khẩu đã được gửi!', 'success');

            // Show success state
            document.querySelector('.auth-form').innerHTML = `
                <div class="success-message">
                    <ion-icon name="checkmark-circle" class="success-icon"></ion-icon>
                    <h3>Email đã được gửi!</h3>
                    <p>Vui lòng kiểm tra hộp thư email của bạn và làm theo hướng dẫn để đặt lại mật khẩu.</p>
                    <a href="login.html" class="btn btn-primary">Quay lại đăng nhập</a>
                </div>
            `;

        } catch (error) {
            console.error('Forgot password error:', error);
            this.showFormError(error.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            // Hide loading
            this.setButtonLoading(submitBtn, btnText, btnLoading, false);
        }
    }

    async handleResetPassword(form) {
        const formData = new FormData(form);
        const token = new URLSearchParams(window.location.search).get('token');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        if (!token) {
            this.showFormError('Token không hợp lệ');
            return;
        }

        const validationError = this.validatePasswordReset(newPassword, confirmPassword);
        if (validationError) {
            this.showFormError(validationError);
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        try {
            // Show loading
            this.setButtonLoading(submitBtn, btnText, btnLoading, true);

            // Clear previous errors
            this.clearFormErrors();

            // Reset password
            await apiClient.resetPassword(token, newPassword);

            // Show success message
            this.showToast('Mật khẩu đã được đặt lại thành công!', 'success');

            // Redirect to login
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            console.error('Reset password error:', error);
            this.showFormError(error.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            // Hide loading
            this.setButtonLoading(submitBtn, btnText, btnLoading, false);
        }
    }    // Google Sign-In Handler
    async handleGoogleSignIn(credential) {
        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn ? loginBtn.querySelector('.btn-text') : null;
        const btnLoading = loginBtn ? loginBtn.querySelector('.btn-loading') : null;
        const formError = document.getElementById('formError');
          try {
            if (loginBtn && btnText && btnLoading) {
                this.setButtonLoading(loginBtn, btnText, btnLoading, true);
            }
            
            // Clear previous errors
            this.clearFormErrors();

            const response = await apiClient.googleSignIn(credential);
            
            if (response.success) {
                this.showToast('Đăng nhập thành công!', 'success');
                
                // Trigger auth state change event
                if (typeof HeaderManager !== 'undefined') {
                    HeaderManager.triggerAuthStateChange();
                } else {
                    window.dispatchEvent(new CustomEvent('authStateChanged'));
                }
                
                // Redirect based on user role
                const user = apiClient.getCurrentUser();
                if (user && user.role === 'ADMIN') {
                    setTimeout(() => window.location.href = 'admin/dashboard.html', 1000);
                } else {
                    setTimeout(() => window.location.href = 'index.html', 1000);
                }
            } else {
                if (formError) {
                    this.showFormError(response.message);
                }
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
            if (formError) {
                this.showFormError('Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
            }
        } finally {
            if (loginBtn && btnText && btnLoading) {
                this.setButtonLoading(loginBtn, btnText, btnLoading, false);
            }
        }
    }
      // Google Sign-Up Handler
    async handleGoogleSignUp(credential) {
        const registerBtn = document.getElementById('registerBtn');
        const btnText = registerBtn ? registerBtn.querySelector('.btn-text') : null;
        const btnLoading = registerBtn ? registerBtn.querySelector('.btn-loading') : null;
        const formError = document.getElementById('formError');
          try {
            if (registerBtn && btnText && btnLoading) {
                this.setButtonLoading(registerBtn, btnText, btnLoading, true);
            }
            
            // Clear previous errors
            this.clearFormErrors();

            const response = await apiClient.googleSignUp(credential);
            
            if (response.success) {
                this.showToast('Đăng ký thành công!', 'success');
                
                // Trigger auth state change event
                if (typeof HeaderManager !== 'undefined') {
                    HeaderManager.triggerAuthStateChange();
                } else {
                    window.dispatchEvent(new CustomEvent('authStateChanged'));
                }
                
                // Redirect based on user role
                const user = apiClient.getCurrentUser();
                if (user && user.role === 'ADMIN') {
                    setTimeout(() => window.location.href = 'admin/dashboard.html', 1000);
                } else {
                    setTimeout(() => window.location.href = 'index.html', 1000);
                }
            } else {
                if (formError) {
                    this.showFormError(response.message);
                }
            }
        } catch (error) {
            console.error('Google sign-up error:', error);
            if (formError) {
                this.showFormError('Đăng ký bằng Google thất bại. Vui lòng thử lại.');
            }
        } finally {
            if (registerBtn && btnText && btnLoading) {
                this.setButtonLoading(registerBtn, btnText, btnLoading, false);
            }
        }
    }
    
    // Validation methods
    validateLoginForm(credentials) {
        if (!credentials.username.trim()) {
            this.showFormError('Vui lòng nhập tên đăng nhập');
            return false;
        }

        if (!credentials.password.trim()) {
            this.showFormError('Vui lòng nhập mật khẩu');
            return false;
        }

        return true;
    }

    validateRegisterForm(userData, confirmPassword) {
        // Username validation
        if (!userData.username.trim()) {
            return 'Vui lòng nhập tên đăng nhập';
        }
        if (userData.username.length < 3) {
            return 'Tên đăng nhập phải có ít nhất 3 ký tự';
        }

        // Email validation
        if (!userData.email.trim()) {
            return 'Vui lòng nhập email';
        }
        if (!this.validateEmail(userData.email)) {
            return 'Email không hợp lệ';
        }

        // Full name validation
        if (!userData.fullName.trim()) {
            return 'Vui lòng nhập họ và tên';
        }

        // Phone validation
        if (!userData.phoneNumber.trim()) {
            return 'Vui lòng nhập số điện thoại';
        }
        if (!this.validatePhone(userData.phoneNumber)) {
            return 'Số điện thoại không hợp lệ';
        }

        // Password validation
        if (!userData.password.trim()) {
            return 'Vui lòng nhập mật khẩu';
        }
        const passwordValidation = this.validatePassword(userData.password);
        if (passwordValidation !== true) {
            return passwordValidation;
        }

        // Confirm password validation
        if (!confirmPassword.trim()) {
            return 'Vui lòng xác nhận mật khẩu';
        }
        const passwordMatchValidation = this.validatePasswordMatch(userData.password, confirmPassword);
        if (passwordMatchValidation !== true) {
            return passwordMatchValidation;
        }

        return null;
    }

    validatePasswordReset(newPassword, confirmPassword) {
        if (!newPassword.trim()) {
            return 'Vui lòng nhập mật khẩu mới';
        }
        const passwordValidation = this.validatePassword(newPassword);
        if (passwordValidation !== true) {
            return passwordValidation;
        }

        if (!confirmPassword.trim()) {
            return 'Vui lòng xác nhận mật khẩu';
        }
        const passwordMatchValidation = this.validatePasswordMatch(newPassword, confirmPassword);
        if (passwordMatchValidation !== true) {
            return passwordMatchValidation;
        }

        return null;
    }

    validatePasswordMatch(password, confirmPassword) {
        if (password !== confirmPassword) {
            return 'Mật khẩu xác nhận không khớp';
        }
        return true;
    }

    validatePasswordMatchRealTime(passwordField, confirmPasswordField) {
        if (!passwordField || !confirmPasswordField) return;
        
        // Remove existing error message
        this.removeFieldError(confirmPasswordField);
        
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError(confirmPasswordField, 'Mật khẩu xác nhận không khớp');
        }
    }

    validatePasswordRealTime(passwordField) {
        if (!passwordField) return;
        
        // Remove existing error message
        this.removeFieldError(passwordField);
        
        const password = passwordField.value;
        if (password) {
            const validation = this.validatePassword(password);
            if (validation !== true) {
                this.showFieldError(passwordField, validation);
            }
        }
    }

    showFieldError(field, message) {
        // Remove existing error
        this.removeFieldError(field);
        
        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.color = '#e74c3c';
        errorElement.style.fontSize = '12px';
        errorElement.style.marginTop = '4px';
        
        // Insert after the field's parent (form-group)
        const formGroup = field.closest('.form-group') || field.parentElement;
        if (formGroup) {
            formGroup.appendChild(errorElement);
        }
        
        // Add error styling to field
        field.style.borderColor = '#e74c3c';
    }

    removeFieldError(field) {
        // Remove error styling from field
        field.style.borderColor = '';
        
        // Remove error message
        const formGroup = field.closest('.form-group') || field.parentElement;
        if (formGroup) {
            const existingError = formGroup.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }
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

    validatePassword(password) {
        if (!password || password.length < 8) {
            return 'Mật khẩu phải có ít nhất 8 ký tự';
        }
        
        // Check if password contains at least one letter
        if (!/[a-zA-Z]/.test(password)) {
            return 'Mật khẩu phải chứa ít nhất một chữ cái';
        }
        
        // Check if password contains at least one number
        if (!/[0-9]/.test(password)) {
            return 'Mật khẩu phải chứa ít nhất một chữ số';
        }
        
        return true;
    }

    // UI Helper methods
    setButtonLoading(button, textElement, loadingElement, isLoading) {
        if (isLoading) {
            button.disabled = true;
            textElement.style.display = 'none';
            loadingElement.style.display = 'block';
        } else {
            button.disabled = false;
            textElement.style.display = 'block';
            loadingElement.style.display = 'none';
        }
    }

    showFormError(message) {
        const errorElement = document.getElementById('formError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearFormErrors() {
        const errorElement = document.getElementById('formError');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        // Get icon based on type
        let iconName = 'information-circle-outline';
        switch (type) {
            case 'success':
                iconName = 'checkmark-circle-outline';
                break;
            case 'error':
                iconName = 'alert-circle-outline';
                break;
            case 'warning':
                iconName = 'warning-outline';
                break;
            case 'loading':
                iconName = 'sync-outline';
                break;
        }

        // Set toast content with proper structure
        toast.innerHTML = `
            <div class="toast-content">
                <ion-icon name="${iconName}" class="toast-icon"></ion-icon>
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        toast.className = `toast ${type}`;
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Hide toast after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }// Logout method
    async logout() {
        try {
            await apiClient.logout();
            // Always redirect to frontend home after successful logout
            window.location.href = '/frontend/';
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even if API call fails
            apiClient.token = null;
            apiClient.refreshToken = null;
            localStorage.clear();
            window.location.href = '/frontend/';
        }
    }
}

// Initialize when DOM is loaded
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
    window.authManager = authManager;
});

// Global function for Google Sign-In callback
window.handleGoogleSignIn = async (response) => {
    if (authManager) {
        await authManager.handleGoogleSignIn(response.credential);
    }
};

// Global function for Google Sign-Up callback
window.handleGoogleSignUp = async (response) => {
    if (authManager) {
        await authManager.handleGoogleSignUp(response.credential);
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

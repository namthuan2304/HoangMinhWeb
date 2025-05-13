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
            if (user && user.roles && user.roles.includes('ROLE_ADMIN')) {
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

        // Password confirmation validation
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        
        if (password && confirmPassword) {
            confirmPassword.addEventListener('input', () => {
                this.validatePasswordMatch(password.value, confirmPassword.value);
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
            const response = await apiClient.login(credentials);            // Show success message
            this.showToast('Đăng nhập thành công!', 'success');            // Remember me
            if (formData.get('rememberMe')) {
                localStorage.setItem('rememberMe', 'true');
            }            // Trigger auth state change event
            console.log('Login successful, triggering auth state change...');
            if (typeof HeaderManager !== 'undefined') {
                HeaderManager.triggerAuthStateChange();
            } else {
                window.dispatchEvent(new CustomEvent('authStateChanged'));
            }            // Redirect based on user role
            setTimeout(() => {
                const user = apiClient.getCurrentUser();
                console.log('Current user:', user); // Debug log
                if (user && user.roles && user.roles.includes('ROLE_ADMIN')) {
                    window.location.href = 'admin/dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1000);

        } catch (error) {
            console.error('Login error:', error);
            this.showToast(error.message || 'Đăng nhập thất bại', 'error');
            
            // Show field-specific errors
            if (error.message.includes('username') || error.message.includes('tên đăng nhập')) {
                this.showFieldError('usernameError', 'Tên đăng nhập không hợp lệ');
            }
            if (error.message.includes('password') || error.message.includes('mật khẩu')) {
                this.showFieldError('passwordError', 'Mật khẩu không chính xác');
            }
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
        if (!this.validateRegisterForm(userData, formData.get('confirmPassword'))) {
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
            this.showToast(error.message || 'Đăng ký thất bại', 'error');
        } finally {
            // Hide loading
            this.setButtonLoading(registerBtn, btnText, btnLoading, false);
        }
    }

    async handleForgotPassword(form) {
        const formData = new FormData(form);
        const email = formData.get('email');

        if (!this.validateEmail(email)) {
            this.showFieldError('emailError', 'Vui lòng nhập email hợp lệ');
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
            this.showToast(error.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error');
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
            this.showToast('Token không hợp lệ', 'error');
            return;
        }

        if (!this.validatePasswordReset(newPassword, confirmPassword)) {
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
            this.showToast(error.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error');
        } finally {
            // Hide loading
            this.setButtonLoading(submitBtn, btnText, btnLoading, false);
        }
    }

    // Validation methods
    validateLoginForm(credentials) {
        let isValid = true;

        if (!credentials.username.trim()) {
            this.showFieldError('usernameError', 'Vui lòng nhập tên đăng nhập');
            isValid = false;
        }

        if (!credentials.password.trim()) {
            this.showFieldError('passwordError', 'Vui lòng nhập mật khẩu');
            isValid = false;
        }

        return isValid;
    }

    validateRegisterForm(userData, confirmPassword) {
        let isValid = true;

        // Username validation
        if (!userData.username.trim()) {
            this.showFieldError('usernameError', 'Vui lòng nhập tên đăng nhập');
            isValid = false;
        } else if (userData.username.length < 3) {
            this.showFieldError('usernameError', 'Tên đăng nhập phải có ít nhất 3 ký tự');
            isValid = false;
        }

        // Email validation
        if (!userData.email.trim()) {
            this.showFieldError('emailError', 'Vui lòng nhập email');
            isValid = false;
        } else if (!this.validateEmail(userData.email)) {
            this.showFieldError('emailError', 'Email không hợp lệ');
            isValid = false;
        }

        // Full name validation
        if (!userData.fullName.trim()) {
            this.showFieldError('fullNameError', 'Vui lòng nhập họ và tên');
            isValid = false;
        }

        // Phone validation
        if (!userData.phoneNumber.trim()) {
            this.showFieldError('phoneNumberError', 'Vui lòng nhập số điện thoại');
            isValid = false;
        } else if (!this.validatePhone(userData.phoneNumber)) {
            this.showFieldError('phoneNumberError', 'Số điện thoại không hợp lệ');
            isValid = false;
        }

        // Password validation
        if (!userData.password.trim()) {
            this.showFieldError('passwordError', 'Vui lòng nhập mật khẩu');
            isValid = false;
        } else if (userData.password.length < 6) {
            this.showFieldError('passwordError', 'Mật khẩu phải có ít nhất 6 ký tự');
            isValid = false;
        }

        // Confirm password validation
        if (!confirmPassword.trim()) {
            this.showFieldError('confirmPasswordError', 'Vui lòng xác nhận mật khẩu');
            isValid = false;
        } else if (userData.password !== confirmPassword) {
            this.showFieldError('confirmPasswordError', 'Mật khẩu xác nhận không khớp');
            isValid = false;
        }

        return isValid;
    }

    validatePasswordReset(newPassword, confirmPassword) {
        let isValid = true;

        if (!newPassword.trim()) {
            this.showFieldError('newPasswordError', 'Vui lòng nhập mật khẩu mới');
            isValid = false;
        } else if (newPassword.length < 6) {
            this.showFieldError('newPasswordError', 'Mật khẩu phải có ít nhất 6 ký tự');
            isValid = false;
        }

        if (!confirmPassword.trim()) {
            this.showFieldError('confirmPasswordError', 'Vui lòng xác nhận mật khẩu');
            isValid = false;
        } else if (newPassword !== confirmPassword) {
            this.showFieldError('confirmPasswordError', 'Mật khẩu xác nhận không khớp');
            isValid = false;
        }

        return isValid;
    }

    validatePasswordMatch(password, confirmPassword) {
        const errorElement = document.getElementById('confirmPasswordError');
        if (password !== confirmPassword && confirmPassword.length > 0) {
            this.showFieldError('confirmPasswordError', 'Mật khẩu xác nhận không khớp');
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

    // Logout method
    async logout() {
        try {
            await apiClient.logout();
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even if API call fails
            apiClient.token = null;
            apiClient.refreshToken = null;
            localStorage.clear();
            window.location.href = '/';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

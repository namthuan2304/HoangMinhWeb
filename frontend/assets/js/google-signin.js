// Google Sign-In Configuration
class GoogleSignInConfig {
    constructor() {
        this.clientId = '182798155685-hrpfokla969lhmen4e39gg90s2etunu5.apps.googleusercontent.com'; // Google Client ID
        this.initializeGoogleSignIn();
    }

    initializeGoogleSignIn() {
        // Load Google Sign-In API
        if (typeof google !== 'undefined' && google.accounts) {
            this.configureGoogleSignIn();
        } else {
            // Retry sau 500ms nếu Google API chưa load
            setTimeout(() => this.initializeGoogleSignIn(), 500);
        }
    }    configureGoogleSignIn() {
        // Cấu hình Google Sign-In
        google.accounts.id.initialize({
            client_id: this.clientId,
            callback: this.handleCredentialResponse.bind(this)
        });

        // Render nút đăng nhập nếu có container
        const signInDiv = document.getElementById('g_id_signin');
        if (signInDiv) {
            // Xác định loại nút dựa trên trang hiện tại
            const isRegisterPage = window.location.pathname.includes('register');
            const buttonText = isRegisterPage ? 'signup_with' : 'sign_in_with';
            
            google.accounts.id.renderButton(
                signInDiv,
                {
                    theme: 'outline',
                    size: 'large',
                    type: 'standard',
                    text: buttonText,
                    shape: 'rectangular',
                    logo_alignment: 'left',
                    width: '100%'
                }
            );
        }

        // Tự động prompt nếu cần
        // google.accounts.id.prompt();
    }    handleCredentialResponse(response) {
        console.log('Google Sign-In Response:', response);
        
        // Debug token
        if (response.credential) {
            this.debugGoogleToken(response.credential);
        }
        
        // Xử lý response từ Google dựa trên trang hiện tại
        const isRegisterPage = window.location.pathname.includes('register');
        
        if (isRegisterPage && window.handleGoogleSignUp) {
            window.handleGoogleSignUp(response);
        } else if (!isRegisterPage && window.handleGoogleSignIn) {
            window.handleGoogleSignIn(response);
        } else {
            console.error('No appropriate Google Sign-In handler found');
        }
    }

    // Method để lấy thông tin user từ credential token (decode JWT)
    decodeJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding JWT:', error);
            return null;
        }
    }

    // Debug method để kiểm tra token
    debugGoogleToken(credential) {
        try {
            const payload = this.decodeJWT(credential);
            console.log('Google Token Payload:', payload);
            return payload;
        } catch (error) {
            console.error('Error decoding Google token:', error);
            return null;
        }
    }
}

// Initialize Google Sign-In when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo Google Sign-In config
    window.googleSignInConfig = new GoogleSignInConfig();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleSignInConfig;
}

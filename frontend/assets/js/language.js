// Hệ thống đa ngôn ngữ
class LanguageManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('language') || 'vi';
        this.translations = {
            vi: {
                // Header
                'helpline_title': 'Để biết thêm thông tin:',
                'search': 'Tìm kiếm',
                'open_menu': 'Mở menu',
                'close_menu': 'Đóng menu',
                
                // Navigation
                'home': 'Trang chủ',
                'about_us': 'Về chúng tôi',
                'destination': 'Điểm đến',
                'packages': 'Gói tour',
                'gallery': 'Thư viện ảnh',
                'contact_us': 'Liên hệ',
                'book_now': 'Đặt ngay',
                'login': 'Đăng nhập',
                'register': 'Đăng ký',
                'profile': 'Hồ sơ',
                'logout': 'Đăng xuất',
                'articles': 'Bài viết',
                
                // Hero Section
                'hero_title': 'Khám phá thế giới cùng chúng tôi',
                'hero_subtitle': 'Trải nghiệm những chuyến du lịch tuyệt vời với dịch vụ chuyên nghiệp',
                'plan_trip': 'Lên kế hoạch du lịch',
                'book_trip': 'Đặt chuyến đi',
                
                // About Section
                'about_title': 'Về chúng tôi',
                'about_subtitle': 'Chúng tôi mang đến những trải nghiệm du lịch tuyệt vời',
                'about_description': 'Với hơn 10 năm kinh nghiệm trong lĩnh vực du lịch, chúng tôi cam kết mang đến cho bạn những chuyến đi đáng nhớ nhất.',
                'years_experience': 'Năm kinh nghiệm',
                'happy_customers': 'Khách hàng hài lòng',
                'destinations': 'Điểm đến',
                'tour_packages': 'Gói tour',
                
                // Popular Destinations
                'popular_destinations': 'Điểm đến phổ biến',
                'popular_subtitle': 'Những điểm đến được yêu thích nhất',
                'view_all': 'Xem tất cả',
                'learn_more': 'Tìm hiểu thêm',
                
                // Tour Packages
                'tour_packages_title': 'Gói tour du lịch',
                'tour_packages_subtitle': 'Chọn gói tour phù hợp với bạn',
                'per_person': '/người',
                'days': 'ngày',
                'nights': 'đêm',
                'book_tour': 'Đặt tour',
                'view_details': 'Xem chi tiết',
                'from': 'Từ',
                'to': 'Đến',
                'duration': 'Thời gian',
                'price': 'Giá',
                'availability': 'Còn chỗ',
                'rating': 'Đánh giá',
                'tour_type': 'Loại tour',
                
                // Gallery
                'gallery_title': 'Thư viện ảnh',
                'gallery_subtitle': 'Những khoảnh khắc đẹp từ các chuyến đi',
                
                // Contact
                'contact_title': 'Liên hệ với chúng tôi',
                'contact_subtitle': 'Chúng tôi luôn sẵn sàng hỗ trợ bạn',
                'address': 'Địa chỉ',
                'phone': 'Điện thoại',
                'email': 'Email',
                'send_message': 'Gửi tin nhắn',
                'full_name': 'Họ và tên',
                'email_address': 'Địa chỉ email',
                'phone_number': 'Số điện thoại',
                'message': 'Tin nhắn',
                'send': 'Gửi',
                
                // Footer
                'quick_links': 'Liên kết nhanh',
                'contact_info': 'Thông tin liên hệ',
                'follow_us': 'Theo dõi chúng tôi',
                'newsletter': 'Đăng ký nhận tin',
                'newsletter_text': 'Đăng ký để nhận thông tin về các tour du lịch mới nhất',
                'subscribe': 'Đăng ký',
                'all_rights_reserved': 'Tất cả quyền được bảo lưu',
                
                // Booking
                'booking_form': 'Biểu mẫu đặt tour',
                'select_tour': 'Chọn tour',
                'departure_date': 'Ngày khởi hành',
                'number_of_people': 'Số người',
                'adults': 'Người lớn',
                'children': 'Trẻ em',
                'special_requests': 'Yêu cầu đặc biệt',
                'total_price': 'Tổng giá',
                'confirm_booking': 'Xác nhận đặt tour',
                'my_bookings': 'Đặt chỗ của tôi',
                'favorites': 'Yêu thích',
                
                // Authentication
                'signin': 'Đăng nhập',
                'signup': 'Đăng ký',
                'username': 'Tên đăng nhập',
                'password': 'Mật khẩu',
                'confirm_password': 'Xác nhận mật khẩu',
                'forgot_password': 'Quên mật khẩu?',
                'remember_me': 'Ghi nhớ đăng nhập',
                'dont_have_account': 'Chưa có tài khoản?',
                'already_have_account': 'Đã có tài khoản?',
                'reset_password': 'Đặt lại mật khẩu',
                
                // Profile
                'my_profile': 'Hồ sơ của tôi',
                'edit_profile': 'Chỉnh sửa hồ sơ',
                'change_password': 'Đổi mật khẩu',
                'booking_history': 'Lịch sử đặt tour',
                'personal_info': 'Thông tin cá nhân',
                'save_changes': 'Lưu thay đổi',
                'cancel': 'Hủy',
                'settings': 'Cài đặt',
                'update_personal_info': 'Cập nhật thông tin cá nhân của bạn',
                'saving': 'Đang lưu...',
                
                // Booking Status
                'pending': 'Chờ xử lý',
                'confirmed': 'Đã xác nhận',
                'cancelled': 'Đã hủy',
                'completed': 'Hoàn thành',
                
                // Messages
                'success': 'Thành công',
                'error': 'Lỗi',
                'loading': 'Đang tải...',
                'no_data': 'Không có dữ liệu',
                'confirm': 'Xác nhận',
                'delete': 'Xóa',
                'edit': 'Chỉnh sửa',
                'save': 'Lưu',
                'close': 'Đóng',
                
                // Validation
                'required_field': 'Trường này là bắt buộc',
                'invalid_email': 'Email không hợp lệ',
                'password_mismatch': 'Mật khẩu không khớp',
                'min_length': 'Tối thiểu {0} ký tự',
                'max_length': 'Tối đa {0} ký tự',
                
                // Time
                'today': 'Hôm nay',
                'yesterday': 'Hôm qua',
                'tomorrow': 'Ngày mai',
                'this_week': 'Tuần này',
                'this_month': 'Tháng này',
                'this_year': 'Năm này',
                
                // Common
                'search_placeholder': 'Tìm kiếm...',
                'select_option': 'Chọn tùy chọn...',
                'no_results': 'Không tìm thấy kết quả',
                'load_more': 'Tải thêm',
                'show_more': 'Hiển thị thêm',
                'show_less': 'Hiển thị ít hơn',
                'back_to_articles': 'Trở về danh sách bài viết',
                
                // Articles
                'articles_title': 'Bài viết du lịch',
                'articles_subtitle': 'Khám phá những câu chuyện, kinh nghiệm và bí quyết du lịch từ các chuyên gia',
                'featured_articles_title': 'Bài viết nổi bật',
                'featured_articles_subtitle': 'Khám phá những câu chuyện, kinh nghiệm và bí quyết du lịch từ các chuyên gia để có những chuyến đi trọn vẹn nhất.',
                'view_all_articles': 'Xem tất cả bài viết',
                'popular_articles': 'Bài viết phổ biến',
                'latest_articles': 'Bài viết mới nhất',
                'related_articles': 'Bài viết liên quan',
                'article_not_found': 'Không tìm thấy bài viết',
                'article_not_found_desc': 'Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.',
                'about_author': 'Về tác giả',
                'share_article': 'Chia sẻ bài viết',
                'copy_link': 'Sao chép liên kết',
                'filter_by_tag': 'Lọc theo chủ đề:',
                'sort_by': 'Sắp xếp theo:',
                'latest': 'Mới nhất',
                'most_popular': 'Phổ biến nhất',
                'alphabetical': 'Theo tên A-Z',
                'all': 'Tất cả',
                'no_articles_found': 'Không tìm thấy bài viết nào',
                'try_different_search': 'Hãy thử tìm kiếm với từ khóa khác',
                'related_tours': 'Tours liên quan',
                
                // Tour Detail & Booking
                'tour_overview': 'Tổng quan tour',
                'tour_highlights': 'Điểm nổi bật',
                'tour_itinerary': 'Lịch trình tour',
                'tour_includes': 'Bao gồm',
                'tour_excludes': 'Không bao gồm',
                'tour_notes': 'Ghi chú',
                'customer_reviews': 'Đánh giá khách hàng',
                'write_review': 'Viết đánh giá',
                'booking_summary': 'Tóm tắt đặt tour',
                'guest_information': 'Thông tin khách',
                'payment_method': 'Phương thức thanh toán',
                'terms_conditions': 'Điều khoản và điều kiện',
                'i_agree': 'Tôi đồng ý với',
                'proceed_payment': 'Tiến hành thanh toán',
                
                // Filter & Search
                'filter_results': 'Lọc kết quả',
                'clear_filters': 'Xóa bộ lọc',
                'price_range': 'Khoảng giá',
                'duration_range': 'Thời gian',
                'departure_location': 'Nơi khởi hành',
                'sort_options': 'Tùy chọn sắp xếp',
                'newest': 'Mới nhất',
                'oldest': 'Cũ nhất',
                'price_low_high': 'Giá thấp đến cao',
                'price_high_low': 'Giá cao đến thấp',
                'rating_high_low': 'Đánh giá cao nhất',
                'popular': 'Phổ biến nhất'
            },
            en: {
                // Header
                'helpline_title': 'For Further Inquires:',
                'search': 'Search',
                'open_menu': 'Open Menu',
                'close_menu': 'Close Menu',
                
                // Navigation
                'home': 'Home',
                'about_us': 'About Us',
                'destination': 'Destination',
                'packages': 'Packages',
                'gallery': 'Gallery',
                'contact_us': 'Contact Us',
                'book_now': 'Book Now',
                'login': 'Login',
                'register': 'Register',
                'profile': 'Profile',
                'logout': 'Logout',
                'articles': 'Articles',
                
                // Hero Section
                'hero_title': 'Explore the world with us',
                'hero_subtitle': 'Experience amazing trips with professional service',
                'plan_trip': 'Plan Trip',
                'book_trip': 'Book Trip',
                
                // About Section
                'about_title': 'About Us',
                'about_subtitle': 'We bring you amazing travel experiences',
                'about_description': 'With over 10 years of experience in tourism, we are committed to bringing you the most memorable trips.',
                'years_experience': 'Years Experience',
                'happy_customers': 'Happy Customers',
                'destinations': 'Destinations',
                'tour_packages': 'Tour Packages',
                
                // Popular Destinations
                'popular_destinations': 'Popular Destinations',
                'popular_subtitle': 'Most loved destinations',
                'view_all': 'View All',
                'learn_more': 'Learn More',
                
                // Tour Packages
                'tour_packages_title': 'Tour Packages',
                'tour_packages_subtitle': 'Choose the perfect tour package for you',
                'per_person': '/person',
                'days': 'days',
                'nights': 'nights',
                'book_tour': 'Book Tour',
                'view_details': 'View Details',
                'from': 'From',
                'to': 'To',
                'duration': 'Duration',
                'price': 'Price',
                'availability': 'Available',
                'rating': 'Rating',
                'tour_type': 'Tour Type',
                
                // Gallery
                'gallery_title': 'Gallery',
                'gallery_subtitle': 'Beautiful moments from our trips',
                
                // Contact
                'contact_title': 'Contact Us',
                'contact_subtitle': 'We are always ready to help you',
                'address': 'Address',
                'phone': 'Phone',
                'email': 'Email',
                'send_message': 'Send Message',
                'full_name': 'Full Name',
                'email_address': 'Email Address',
                'phone_number': 'Phone Number',
                'message': 'Message',
                'send': 'Send',
                
                // Footer
                'quick_links': 'Quick Links',
                'contact_info': 'Contact Info',
                'follow_us': 'Follow Us',
                'newsletter': 'Newsletter',
                'newsletter_text': 'Subscribe to receive information about the latest tours',
                'subscribe': 'Subscribe',
                'all_rights_reserved': 'All rights reserved',
                
                // Booking
                'booking_form': 'Booking Form',
                'select_tour': 'Select Tour',
                'departure_date': 'Departure Date',
                'number_of_people': 'Number of People',
                'adults': 'Adults',
                'children': 'Children',
                'special_requests': 'Special Requests',
                'total_price': 'Total Price',
                'confirm_booking': 'Confirm Booking',
                'my_bookings': 'My Bookings',
                'favorites': 'Favorites',
                
                // Authentication
                'signin': 'Sign In',
                'signup': 'Sign Up',
                'username': 'Username',
                'password': 'Password',
                'confirm_password': 'Confirm Password',
                'forgot_password': 'Forgot Password?',
                'remember_me': 'Remember Me',
                'dont_have_account': "Don't have an account?",
                'already_have_account': 'Already have an account?',
                'reset_password': 'Reset Password',
                
                // Profile
                'my_profile': 'My Profile',
                'edit_profile': 'Edit Profile',
                'change_password': 'Change Password',
                'booking_history': 'Booking History',
                'personal_info': 'Personal Information',
                'save_changes': 'Save Changes',
                'cancel': 'Cancel',
                'settings': 'Settings',
                'update_personal_info': 'Update your personal information',
                'saving': 'Saving...',
                
                // Booking Status
                'pending': 'Pending',
                'confirmed': 'Confirmed',
                'cancelled': 'Cancelled',
                'completed': 'Completed',
                
                // Messages
                'success': 'Success',
                'error': 'Error',
                'loading': 'Loading...',
                'no_data': 'No Data',
                'confirm': 'Confirm',
                'delete': 'Delete',
                'edit': 'Edit',
                'save': 'Save',
                'close': 'Close',
                
                // Validation
                'required_field': 'This field is required',
                'invalid_email': 'Invalid email',
                'password_mismatch': 'Passwords do not match',
                'min_length': 'Minimum {0} characters',
                'max_length': 'Maximum {0} characters',
                
                // Time
                'today': 'Today',
                'yesterday': 'Yesterday',
                'tomorrow': 'Tomorrow',
                'this_week': 'This Week',
                'this_month': 'This Month',
                'this_year': 'This Year',
                
                // Common
                'search_placeholder': 'Search...',
                'select_option': 'Select option...',
                'no_results': 'No results found',
                'load_more': 'Load More',
                'show_more': 'Show More',
                'show_less': 'Show Less',
                'back_to_articles': 'Back to Articles',
                
                // Articles
                'articles_title': 'Travel Articles',
                'articles_subtitle': 'Discover stories, experiences and travel tips from experts',
                'featured_articles_title': 'Featured Articles',
                'featured_articles_subtitle': 'Discover stories, experiences and travel tips from experts to have the most complete trips.',
                'view_all_articles': 'View All Articles',
                'popular_articles': 'Popular Articles',
                'latest_articles': 'Latest Articles',
                'related_articles': 'Related Articles',
                'article_not_found': 'Article Not Found',
                'article_not_found_desc': 'The article you are looking for does not exist or has been deleted.',
                'about_author': 'About Author',
                'share_article': 'Share Article',
                'copy_link': 'Copy Link',
                'filter_by_tag': 'Filter by topic:',
                'sort_by': 'Sort by:',
                'latest': 'Latest',
                'most_popular': 'Most Popular',
                'alphabetical': 'Alphabetical A-Z',
                'all': 'All',
                'no_articles_found': 'No articles found',
                'try_different_search': 'Try searching with different keywords',
                'related_tours': 'Related Tours',
                
                // Tour Detail & Booking
                'tour_overview': 'Tour Overview',
                'tour_highlights': 'Tour Highlights',
                'tour_itinerary': 'Tour Itinerary',
                'tour_includes': 'Includes',
                'tour_excludes': 'Excludes',
                'tour_notes': 'Notes',
                'customer_reviews': 'Customer Reviews',
                'write_review': 'Write Review',
                'booking_summary': 'Booking Summary',
                'guest_information': 'Guest Information',
                'payment_method': 'Payment Method',
                'terms_conditions': 'Terms and Conditions',
                'i_agree': 'I agree to',
                'proceed_payment': 'Proceed to Payment',
                
                // Filter & Search
                'filter_results': 'Filter Results',
                'clear_filters': 'Clear Filters',
                'price_range': 'Price Range',
                'duration_range': 'Duration',
                'departure_location': 'Departure Location',
                'sort_options': 'Sort Options',
                'newest': 'Newest',
                'oldest': 'Oldest',
                'price_low_high': 'Price Low to High',
                'price_high_low': 'Price High to Low',
                'rating_high_low': 'Highest Rating',
                'popular': 'Most Popular'
            }
        };
        this.init();
    }

    init() {
        this.addLanguageSelector();
        this.translatePage();
    }

    addLanguageSelector() {
        // Tạo language selector trong header
        const headerBtnGroup = document.querySelector('.header-btn-group');
        if (headerBtnGroup) {
            const languageSelector = document.createElement('div');
            languageSelector.className = 'language-selector';
            languageSelector.innerHTML = `
                <button class="language-btn" id="languageBtn">
                    <ion-icon name="globe-outline"></ion-icon>
                    <span>${this.currentLanguage.toUpperCase()}</span>
                </button>
                <div class="language-dropdown" id="languageDropdown">
                    <a href="#" data-lang="vi" class="${this.currentLanguage === 'vi' ? 'active' : ''}">
                        <img src="https://flagcdn.com/w20/vn.png" alt="Vietnamese">
                        Tiếng Việt
                    </a>
                    <a href="#" data-lang="en" class="${this.currentLanguage === 'en' ? 'active' : ''}">
                        <img src="https://flagcdn.com/w20/us.png" alt="English">
                        English
                    </a>
                </div>
            `;
            
            headerBtnGroup.insertBefore(languageSelector, headerBtnGroup.firstChild);
            
            // Event listeners
            const languageBtn = document.getElementById('languageBtn');
            const languageDropdown = document.getElementById('languageDropdown');
            
            languageBtn.addEventListener('click', (e) => {
                e.preventDefault();
                languageDropdown.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!languageSelector.contains(e.target)) {
                    languageDropdown.classList.remove('show');
                }
            });

            // Language selection
            languageDropdown.addEventListener('click', (e) => {
                e.preventDefault();
                const langOption = e.target.closest('[data-lang]');
                if (langOption) {
                    const selectedLang = langOption.getAttribute('data-lang');
                    this.changeLanguage(selectedLang);
                }
            });
        }
    }

    changeLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('language', lang);
            
            // Update button text
            const languageBtn = document.querySelector('#languageBtn span');
            if (languageBtn) {
                languageBtn.textContent = lang.toUpperCase();
            }
            
            // Update active state
            document.querySelectorAll('[data-lang]').forEach(option => {
                option.classList.toggle('active', option.getAttribute('data-lang') === lang);
            });
            
            // Close dropdown
            document.getElementById('languageDropdown').classList.remove('show');
            
            // Translate page
            this.translatePage();
            
            // Update HTML lang attribute
            document.documentElement.setAttribute('lang', lang);
        }
    }

    translatePage() {
        // Translate elements with data-translate attribute
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.getTranslation(key);
            if (translation) {
                if (element.tagName === 'INPUT' && element.type === 'text') {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Translate placeholders
        document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            const translation = this.getTranslation(key);
            if (translation) {
                element.placeholder = translation;
            }
        });

        // Translate titles and alt attributes
        document.querySelectorAll('[data-translate-title]').forEach(element => {
            const key = element.getAttribute('data-translate-title');
            const translation = this.getTranslation(key);
            if (translation) {
                element.title = translation;
            }
        });

        document.querySelectorAll('[data-translate-alt]').forEach(element => {
            const key = element.getAttribute('data-translate-alt');
            const translation = this.getTranslation(key);
            if (translation) {
                element.alt = translation;
            }
        });
    }

    getTranslation(key) {
        return this.translations[this.currentLanguage][key] || key;
    }

    t(key, ...args) {
        let translation = this.getTranslation(key);
        
        // Replace placeholders {0}, {1}, etc.
        if (args.length > 0) {
            args.forEach((arg, index) => {
                translation = translation.replace(`{${index}}`, arg);
            });
        }
        
        return translation;
    }
}

// Initialize language manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.languageManager = new LanguageManager();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LanguageManager;
}

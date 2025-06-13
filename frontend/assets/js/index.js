// JavaScript cho trang Index - Kết nối với API
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Khởi tạo trang
        await initIndexPage();
    } catch (error) {
        console.error('Error initializing index page:', error);
    }
});

// Khởi tạo trang index
async function initIndexPage() {
    // Hiển thị loading state
    showPageLoading();
    
    // Kiểm tra trạng thái đăng nhập
    checkAuthStatus();
    
    // Initialize analytics
    initPageAnalytics();
      try {
        // Test API connection first
        const isApiOnline = await testApiConnection();
        
        if (isApiOnline) {            // Tải dữ liệu từ API song song
            const promises = [
                loadPopularDestinations(),
                loadFeaturedTours(),
                loadFeaturedArticles(),
                loadGalleryImages()
            ];
            
            // Đợi tất cả promises hoàn thành, nhưng không fail nếu một cái lỗi
            const results = await Promise.allSettled(promises);
            
            // Log kết quả
            results.forEach((result, index) => {
                const names = ['Popular Destinations', 'Featured Tours', 'Featured Articles', 'Gallery Images'];
                if (result.status === 'rejected') {
                    console.error(`Failed to load ${names[index]}:`, result.reason);
                } else {
                    console.log(`Successfully loaded ${names[index]}`);
                }
            });
        } else {
            // Load fallback data if API is not available
            loadFallbackData();
        }
        
    } catch (error) {
        console.error('Error loading page data:', error);
        
        // Load fallback data on error
        loadFallbackData();
        
        if (IndexUtils) {
            IndexUtils.showToast('Đang hiển thị dữ liệu mẫu do lỗi kết nối', 'warning');
        }
    } finally {
        // Ẩn loading state
        hidePageLoading();
    }
    
    // Thiết lập event listeners
    setupEventListeners();
    
    // Initialize lazy loading
    if (IndexUtils) {
        IndexUtils.initLazyLoading();
    }
}

// Kiểm tra trạng thái đăng nhập và cập nhật UI
function checkAuthStatus() {
    try {
        const isAuthenticated = window.apiClient && window.apiClient.isAuthenticated();
        const user = isAuthenticated ? window.apiClient.getCurrentUser() : null;
        
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        
        if (isAuthenticated && user) {
            // Hiển thị user menu, ẩn auth buttons
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            if (userName) userName.textContent = user.fullName || user.username || 'User';
        } else {
            // Hiển thị auth buttons, ẩn user menu
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        // Fallback to showing auth buttons
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// Tải điểm đến phổ biến từ API
async function loadPopularDestinations() {
    const popularList = document.getElementById('popularDestinationsList') || document.querySelector('.popular-list');
    if (!popularList) return;
    
    try {
        // Show loading state
        if (IndexUtils) IndexUtils.showLoading(popularList);
        
        // Check if API client is available
        if (!window.apiClient) {
            throw new Error('API client not available');
        }
        
        const response = await window.apiClient.getTours({
            page: 0,
            size: 3,
            sort: 'bookingCount,desc',
            status: 'ACTIVE'
        });
        
        if (response && response.content && response.content.length > 0) {
            updatePopularDestinations(response.content);
            if (IndexUtils) IndexUtils.trackEvent('popular_destinations_loaded', { count: response.content.length });
        } else {
            // No data found, keep default content
            console.log('No popular destinations found, keeping default content');
        }
    } catch (error) {
        console.error('Error loading popular destinations:', error);
        
        // For development, keep the static content instead of showing error
        console.log('Keeping static popular destinations content');
        
        // Optional: show a subtle notification that data is static
        if (IndexUtils && window.location.hostname !== 'localhost') {
            IndexUtils.showToast('Đang hiển thị dữ liệu mẫu', 'info');
        }
    } finally {
        // Hide loading state
        if (IndexUtils) IndexUtils.hideLoading(popularList);
    }
}

// Cập nhật section điểm đến phổ biến
function updatePopularDestinations(destinations) {
    const popularList = document.getElementById('popularDestinationsList') || document.querySelector('.popular-list');
    if (!popularList || destinations.length === 0) return;
    
    popularList.innerHTML = '';
      destinations.forEach(destination => {
        const listItem = document.createElement('li');        const imageUrl = destination.imageUrls && destination.imageUrls.length > 0 
            ? (window.apiClient ? window.apiClient.getFullImageUrl(destination.imageUrls[0]) : destination.imageUrls[0])
            : (destination.mainImageUrl ? 
                (window.apiClient ? window.apiClient.getFullImageUrl(destination.mainImageUrl) : destination.mainImageUrl) 
                : './assets/images/popular-1.jpg');
        const description = IndexUtils 
            ? IndexUtils.truncateText(destination.description || '', 120)
            : (destination.description || 'Khám phá điểm đến tuyệt vời này.');
            
        listItem.innerHTML = `
            <div class="popular-card">
                <figure class="card-img">
                    <img src="${imageUrl}" 
                         alt="${destination.name}" 
                         loading="lazy"
                         onerror="this.src='./assets/images/popular-1.jpg'">
                </figure>
                
                <div class="card-content">                    <div class="card-rating">
                        ${generateStarRating(destination.ratingAverage || 5)}
                    </div>
                    
                    <p class="card-subtitle">
                        <a href="#">${destination.destination || 'Việt Nam'}</a>
                    </p>
                    
                    <h3 class="h3 card-title">
                        <a href="tour-detail.html?id=${destination.id}">${destination.name}</a>
                    </h3>
                    
                    <p class="card-text">
                        ${description}
                    </p>
                </div>
            </div>
        `;
        popularList.appendChild(listItem);
    });
}

// Tải tour nổi bật từ API
async function loadFeaturedTours() {
    const packageList = document.getElementById('featuredToursList') || document.querySelector('.package-list');
    if (!packageList) return;
    
    try {
        // Show loading state
        if (IndexUtils) IndexUtils.showLoading(packageList);
        
        // Check if API client is available
        if (!window.apiClient) {
            throw new Error('API client not available');
        }
        
        const response = await window.apiClient.getFeaturedTours();
        
        if (response && response.length > 0) {
            updateFeaturedTours(response.slice(0, 3)); // Lấy 3 tour đầu tiên
            if (IndexUtils) IndexUtils.trackEvent('featured_tours_loaded', { count: response.length });
        } else {
            // Nếu không có featured tours, lấy tours thông thường
            const toursResponse = await window.apiClient.getTours({
                page: 0,
                size: 3,
                sort: 'createdAt,desc',
                status: 'ACTIVE'
            });
            
            if (toursResponse && toursResponse.content && toursResponse.content.length > 0) {
                updateFeaturedTours(toursResponse.content);
                if (IndexUtils) IndexUtils.trackEvent('regular_tours_loaded_as_featured', { count: toursResponse.content.length });
            } else {
                // Keep default content
                console.log('No tours found, keeping default content');
            }
        }
    } catch (error) {
        console.error('Error loading featured tours:', error);
        
        // For development, keep the static content instead of showing error
        console.log('Keeping static featured tours content');
        
        // Optional: show a subtle notification that data is static
        if (IndexUtils && window.location.hostname !== 'localhost') {
            IndexUtils.showToast('Đang hiển thị dữ liệu mẫu', 'info');
        }
    } finally {
        // Hide loading state
        if (IndexUtils) IndexUtils.hideLoading(packageList);
    }
}

// Cập nhật section tour packages
function updateFeaturedTours(tours) {
    const packageList = document.getElementById('featuredToursList') || document.querySelector('.package-list');
    if (!packageList || tours.length === 0) return;
    
    console.log('Updating featured tours with data:', tours); // Debug log
    
    packageList.innerHTML = '';
    
    tours.forEach(tour => {
        console.log('Processing tour:', tour); // Debug log
        
        const listItem = document.createElement('li');        const formattedPrice = formatCurrency(tour.price);
        const duration = tour.durationDays || 7; // Backend sử dụng durationDays
        const imageUrl = tour.imageUrls && tour.imageUrls.length > 0 
            ? apiClient.getFullImageUrl(tour.imageUrls[0])
            : (apiClient.getFullImageUrl(tour.mainImageUrl) || './assets/images/packege-1.jpg');
        const description = IndexUtils 
            ? IndexUtils.truncateText(tour.description || '', 150)
            : (tour.description || 'Trải nghiệm du lịch tuyệt vời.');// Debug rating data
        console.log('Tour rating data:', {
            ratingAverage: tour.ratingAverage,
            totalBookings: tour.totalBookings
        });
          
        listItem.innerHTML = `
            <div class="package-card">
                <figure class="card-banner">
                    <img src="${imageUrl}" 
                         alt="${tour.name}" 
                         loading="lazy"
                         onerror="this.src='./assets/images/packege-1.jpg'">
                </figure>
                
                <div class="card-content">
                    <h3 class="h3 card-title">${tour.name}</h3>
                    
                    <p class="card-text">
                        ${description}
                    </p>
                      <ul class="card-meta-list">
                        <li class="card-meta-item">
                            <div class="meta-box">
                                <ion-icon name="time"></ion-icon>
                                <p class="text">${duration} <span data-translate="days">ngày</span>/${duration - 1} <span data-translate="nights">đêm</span></p>
                            </div>
                        </li>
                        
                        <li class="card-meta-item">
                            <div class="meta-box">
                                <ion-icon name="people"></ion-icon>
                                <p class="text">Tối đa: ${tour.maxParticipants || 10} người</p>
                            </div>
                        </li>
                        
                        <li class="card-meta-item">
                            <div class="meta-box">
                                <ion-icon name="location"></ion-icon>
                                <p class="text">${tour.destination}</p>
                            </div>
                        </li>
                    </ul>
                </div>
                  <div class="card-price">
                    <div class="wrapper">                        <p class="reviews">(${tour.totalBookings || 0} đánh giá)</p>
                        
                        <div class="card-rating">
                            ${generateStarRating(tour.ratingAverage || 0)}
                        </div>
                    </div>
                    
                    <p class="price">
                        ${formattedPrice}
                        <span data-translate="per_person">/ người</span>
                    </p>
                    
                    <button class="btn btn-secondary book-now-btn" 
                            data-tour-id="${tour.id}" 
                            data-tour-name="${tour.name}"
                            data-translate="book_now">Đặt ngay</button>
                </div>
            </div>
        `;
        packageList.appendChild(listItem);
    });
    
    // Thêm event listeners cho nút đặt tour
    setupBookingButtons();
}

// Tạo HTML cho đánh giá sao
function generateStarRating(rating) {
    return IndexUtils ? IndexUtils.generateStarRating(rating) : createFallbackStars(rating);
}

// Fallback function if IndexUtils is not available
function createFallbackStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHTML = '';
    
    // Thêm sao đầy
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<ion-icon name="star"></ion-icon>';
    }
    
    // Thêm sao nửa (nếu có)
    if (hasHalfStar) {
        starsHTML += '<ion-icon name="star-half"></ion-icon>';
    }
    
    // Thêm sao rỗng
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<ion-icon name="star-outline"></ion-icon>';
    }
    
    return starsHTML;
}

// Định dạng tiền tệ
function formatCurrency(amount) {
    return IndexUtils ? IndexUtils.formatPrice(amount) : new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Tải hình ảnh gallery (có thể từ API hoặc giữ nguyên)
async function loadGalleryImages() {
    try {
        // Có thể implement API để lấy gallery images trong tương lai
        // Hiện tại giữ nguyên images có sẵn
        console.log('Gallery images loaded from static files');
    } catch (error) {
        console.error('Error loading gallery images:', error);
    }
}

// Tải bài viết nổi bật từ API
async function loadFeaturedArticles() {
    const featuredList = document.getElementById('featuredArticlesList');
    if (!featuredList) return;
    
    try {
        // Show loading state
        if (IndexUtils) IndexUtils.showLoading(featuredList);
        
        const response = await fetch(`${API_BASE_URL}/api/articles?size=3&sort=viewCount:desc`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch featured articles');
        }

        const data = await response.json();
        const articles = data.content || [];
        
        renderFeaturedArticles(articles);
        
    } catch (error) {
        console.error('Error loading featured articles:', error);
        // Show fallback articles or hide section
        renderFallbackArticles();
    } finally {
        if (IndexUtils) IndexUtils.hideLoading(featuredList);
    }
}

// Render bài viết nổi bật
function renderFeaturedArticles(articles) {
    const featuredList = document.getElementById('featuredArticlesList');
    if (!featuredList) return;
    
    if (articles.length === 0) {
        renderFallbackArticles();
        return;
    }
    
    featuredList.innerHTML = '';
    
    articles.forEach(article => {
        const listItem = document.createElement('li');
        
        const publishedDate = new Date(article.publishedAt || article.createdAt).toLocaleDateString('vi-VN');
        const defaultImage = './assets/images/img8.jpg';
        const articleImage = article.featuredImageUrl ? `${API_BASE_URL}${article.featuredImageUrl}` : defaultImage;
        
        // Safely get author name
        const authorName = article.author?.fullName || article.author?.username || 'Admin';
        
        // Safely get excerpt/summary
        const excerpt = article.summary || article.excerpt || 
                       (article.content ? article.content.substring(0, 150) + '...' : 'Đọc để khám phá nội dung thú vị...');
        
        listItem.innerHTML = `
            <div class="featured-article-card" onclick="window.location.href='article-detail.html?slug=${article.slug}'">
                <figure class="card-banner">
                    <img src="${articleImage}" 
                         alt="${article.title}" 
                         loading="lazy"
                         onerror="this.src='${defaultImage}'">
                    ${article.isFeatured ? '<div class="card-badge">Nổi bật</div>' : ''}
                </figure>
                
                <div class="card-content">
                    <div class="card-meta">
                        <div class="meta-item">
                            <ion-icon name="calendar-outline"></ion-icon>
                            <span>${publishedDate}</span>
                        </div>
                        <div class="meta-item">
                            <ion-icon name="person-outline"></ion-icon>
                            <span>${authorName}</span>
                        </div>
                        <div class="meta-item">
                            <ion-icon name="eye-outline"></ion-icon>
                            <span>${article.viewCount || 0}</span>
                        </div>
                    </div>
                    
                    <h3 class="card-title">
                        <a href="article-detail.html?slug=${article.slug}">${article.title}</a>
                    </h3>
                    
                    <p class="card-text">${excerpt}</p>
                    
                    <div class="card-footer">
                        <a href="article-detail.html?slug=${article.slug}" class="read-more">
                            Đọc thêm
                        </a>
                        <div class="view-count">
                            <ion-icon name="eye-outline"></ion-icon>
                            <span>${article.viewCount || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        featuredList.appendChild(listItem);
    });
}

// Cập nhật fallback articles để sử dụng cùng structure
function renderFallbackArticles() {
    const featuredList = document.getElementById('featuredArticlesList');
    if (!featuredList) return;
    
    const fallbackArticles = [
        {
            slug: 'kinh-nghiem-du-lich-ha-long',
            title: 'Kinh nghiệm du lịch Hạ Long - Những điều cần biết',
            summary: 'Khám phá vẻ đẹp kỳ thú của Vịnh Hạ Long với những hang động tuyệt đẹp và hoạt động thú vị...',
            author: { fullName: 'Admin' },
            publishedAt: new Date().toISOString(),
            viewCount: 1250,
            featuredImageUrl: './assets/images/gallery-1.jpg',
            isFeatured: true
        },
        {
            slug: 'am-thuc-viet-nam',
            title: 'Ẩm thực Việt Nam - Hành trình khám phá hương vị',
            summary: 'Từ phở Hà Nội đến bánh mì Sài Gòn, cùng khám phá tinh hoa ẩm thực ba miền đất nước...',
            author: { fullName: 'Admin' }, 
            publishedAt: new Date().toISOString(),
            viewCount: 980,
            featuredImageUrl: './assets/images/gallery-2.jpg',
            isFeatured: false
        },
        {
            slug: 'meo-du-lich-tiet-kiem',
            title: 'Mẹo du lịch tiết kiệm cho sinh viên',
            summary: 'Những bí quyết giúp bạn có thể vi vu khắp nơi mà vẫn tiết kiệm được chi phí...',
            author: { fullName: 'Admin' },
            publishedAt: new Date().toISOString(), 
            viewCount: 750,
            featuredImageUrl: './assets/images/gallery-3.jpg',
            isFeatured: false
        }
    ];
    
    renderFeaturedArticles(fallbackArticles);
}

// Thiết lập event listeners
function setupEventListeners() {
    // Tour search form
    const tourSearchForm = document.querySelector('.tour-search-form');
    if (tourSearchForm) {
        tourSearchForm.addEventListener('submit', handleTourSearch);
    }
    
    // User menu dropdown
    const userTrigger = document.getElementById('userTrigger');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    
    if (userTrigger && userDropdownMenu) {
        userTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            userDropdownMenu.classList.toggle('show');
        });
        
        // Đóng dropdown khi click outside
        document.addEventListener('click', function(e) {
            if (!userTrigger.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.classList.remove('show');
            }
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // View all buttons
    const viewAllButtons = document.querySelectorAll('.btn[data-translate="view_all"]');
    viewAllButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = btn.closest('section');
            if (section && section.id === 'articles') {
                // For articles section, go to articles page
                window.location.href = 'articles.html';
            } else {
                // For other sections, go to tours page
                window.location.href = 'tours.html';
            }
        });
    });
    
    // Learn more button
    const learnMoreBtn = document.querySelector('.btn[data-translate="learn_more"]');
    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', function() {
            const aboutSection = document.getElementById('about');
            if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Book now button in hero section
    const heroBookBtn = document.querySelector('.hero .btn[data-translate="book_now"]');
    if (heroBookBtn) {
        heroBookBtn.addEventListener('click', function() {
            const packageSection = document.getElementById('package');
            if (packageSection) {
                packageSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Articles navigation handling
    const articlesNavLink = document.querySelector('a[href="#articles"]');
    if (articlesNavLink) {
        articlesNavLink.addEventListener('click', function(e) {
            e.preventDefault();
            const articlesSection = document.getElementById('articles');
            if (articlesSection) {
                articlesSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Close mobile menu if open
                const navbar = document.querySelector("[data-navbar]");
                const overlay = document.querySelector("[data-overlay]");
                if (navbar && overlay) {
                    navbar.classList.remove("active");
                    overlay.classList.remove("active");
                }
            }
        });
    }
}

// Xử lý tìm kiếm tour
async function handleTourSearch(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const destination = formData.get('destination');
    const people = formData.get('people');
    const checkin = formData.get('checkin');
    const checkout = formData.get('checkout');
    
    // Validation
    const errors = [];
    
    if (!destination || destination.trim().length < 2) {
        errors.push('Vui lòng nhập điểm đến (ít nhất 2 ký tự)');
    }
    
    if (!people || people < 1) {
        errors.push('Số người phải lớn hơn 0');
    }
    
    if (!checkin) {
        errors.push('Vui lòng chọn ngày khởi hành');
    }
    
    if (!checkout) {
        errors.push('Vui lòng chọn ngày kết thúc');
    }
    
    if (checkin && checkout) {
        const checkinDate = new Date(checkin);
        const checkoutDate = new Date(checkout);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (checkinDate < today) {
            errors.push('Ngày khởi hành không thể là ngày trong quá khứ');
        }
        
        if (checkoutDate <= checkinDate) {
            errors.push('Ngày kết thúc phải sau ngày khởi hành');
        }
    }
    
    // Show errors if any
    if (errors.length > 0) {
        if (IndexUtils) {
            IndexUtils.showToast(errors[0], 'error');
        } else {
            alert(errors[0]);
        }
        return;
    }
    
    const searchParams = {
        destination: destination.trim(),
        minParticipants: people,
        startDate: checkin,
        endDate: checkout
    };
    
    // Track search
    if (IndexUtils) {
        IndexUtils.trackEvent('tour_search', {
            destination: destination.trim(),
            people: people,
            source: 'homepage'
        });
        
        // Lưu search params vào sessionStorage
        IndexUtils.setSessionItem('tourSearchParams', searchParams);
    } else {
        sessionStorage.setItem('tourSearchParams', JSON.stringify(searchParams));
    }
    
    // Show success message
    if (IndexUtils) {
        IndexUtils.showToast('Đang tìm kiếm tour phù hợp...', 'info');
    }
    
    // Chuyển đến trang tours với kết quả tìm kiếm
    setTimeout(() => {
        window.location.href = 'tours.html';
    }, 1000);
}

// Thiết lập event listeners cho nút đặt tour
function setupBookingButtons() {
    const bookingButtons = document.querySelectorAll('.book-now-btn');
    
    bookingButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tourId = this.getAttribute('data-tour-id');
            handleBookTour(tourId);
        });
    });
}

// Xử lý đặt tour
function handleBookTour(tourId) {
    const tourButton = document.querySelector(`[data-tour-id="${tourId}"]`);
    const tourName = tourButton ? tourButton.getAttribute('data-tour-name') : 'Unknown';
    
    // Track booking attempt
    if (IndexUtils) {
        IndexUtils.trackEvent('tour_booking_attempt', {
            tourId: tourId,
            tourName: tourName,
            source: 'homepage'
        });
    }
    
    // Kiểm tra API client và đăng nhập
    if (!window.apiClient) {
        if (IndexUtils) {
            IndexUtils.showToast('Hệ thống đang bảo trì, vui lòng thử lại sau', 'error');
        } else {
            alert('Hệ thống đang bảo trì, vui lòng thử lại sau');
        }
        return;
    }
    
    if (!window.apiClient.isAuthenticated()) {
        // Lưu tourId để redirect sau khi đăng nhập
        if (IndexUtils) {
            IndexUtils.setSessionItem('pendingBookingTourId', tourId);
            IndexUtils.setSessionItem('pendingBookingSource', 'homepage');
        } else {
            sessionStorage.setItem('pendingBookingTourId', tourId);
            sessionStorage.setItem('pendingBookingSource', 'homepage');
        }
        
        // Show notification and redirect to login
        if (IndexUtils) {
            IndexUtils.showToast('Vui lòng đăng nhập để đặt tour', 'info');
        }
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    // Chuyển đến trang chi tiết tour để đặt
    window.location.href = `tour-detail.html?id=${tourId}`;
}

// Xử lý đăng xuất
async function handleLogout() {
    try {
        if (window.apiClient) {
            await window.apiClient.logout();
        } else {
            // Fallback logout
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
        }
        // API client sẽ tự động redirect về trang chủ
    } catch (error) {
        console.error('Error during logout:', error);
        // Vẫn đăng xuất phía client nếu có lỗi
        if (window.apiClient) {
            window.apiClient.logout();
        } else {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
        }
    }
}

// Xử lý sau khi đăng nhập thành công (được gọi từ trang login)
function handleLoginSuccess() {
    // Kiểm tra có tour nào đang chờ đặt không
    const pendingTourId = sessionStorage.getItem('pendingBookingTourId');
    if (pendingTourId) {
        sessionStorage.removeItem('pendingBookingTourId');
        window.location.href = `tour-detail.html?id=${pendingTourId}`;
        return;
    }
    
    // Refresh trang để cập nhật trạng thái đăng nhập
    checkAuthStatus();
}

// Export cho sử dụng từ các trang khác
window.handleLoginSuccess = handleLoginSuccess;

// Show error message with retry button
function showErrorMessage(container, message, retryCallback) {
    if (!container) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <p>${message}</p>
        <button class="retry-btn" onclick="handleRetry(this)">Thử lại</button>
    `;
    
    // Store retry callback
    errorDiv.querySelector('.retry-btn')._retryCallback = retryCallback;
    
    container.innerHTML = '';
    container.appendChild(errorDiv);
}

// Handle retry button click
function handleRetry(button) {
    if (button._retryCallback) {
        button._retryCallback();
    }
}

// Show page loading state
function showPageLoading() {
    const sections = [
        document.querySelector('.popular-list'),
        document.querySelector('.package-list')
    ];
    
    sections.forEach(section => {
        if (section && IndexUtils) {
            IndexUtils.showLoading(section);
        }
    });
}

// Hide page loading state
function hidePageLoading() {
    const sections = [
        document.querySelector('.popular-list'),
        document.querySelector('.package-list')
    ];
    
    sections.forEach(section => {
        if (section && IndexUtils) {
            IndexUtils.hideLoading(section);
        }
    });
}

// API Status Management
let apiStatusIndicator = null;

function createApiStatusIndicator() {
    if (apiStatusIndicator) return;
    
    apiStatusIndicator = document.createElement('div');
    apiStatusIndicator.className = 'api-status';
    apiStatusIndicator.innerHTML = '<span>API: Đang kết nối...</span>';
    document.body.appendChild(apiStatusIndicator);
}

function updateApiStatus(isOnline) {
    if (!apiStatusIndicator) createApiStatusIndicator();
    
    apiStatusIndicator.className = `api-status ${isOnline ? 'online' : 'offline'}`;
    apiStatusIndicator.innerHTML = `<span>API: ${isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}</span>`;
    
    // Show for 3 seconds then hide
    apiStatusIndicator.style.display = 'block';
    setTimeout(() => {
        if (apiStatusIndicator) {
            apiStatusIndicator.style.display = 'none';
        }
    }, 3000);
}

// Test API connection
async function testApiConnection() {
    try {
        if (!window.apiClient) {
            updateApiStatus(false);
            return false;
        }
        
        // Try a simple API call to test connection
        await window.apiClient.getTours({ page: 0, size: 1 });
        updateApiStatus(true);
        return true;
    } catch (error) {
        console.error('API connection test failed:', error);
        updateApiStatus(false);
        return false;
    }
}

// Initialize page analytics
function initPageAnalytics() {
    if (IndexUtils) {
        IndexUtils.trackPageView('homepage');
        
        // Track user engagement
        let scrollDepth = 0;
        const trackScrollDepth = IndexUtils.debounce(() => {
            const currentScroll = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (currentScroll > scrollDepth && currentScroll % 25 === 0) {
                scrollDepth = currentScroll;
                IndexUtils.trackEvent('scroll_depth', { depth: scrollDepth });
            }
        }, 100);
        
        window.addEventListener('scroll', trackScrollDepth);
    }
}

// Fallback data khi API không hoạt động
const fallbackTours = [
    {
        id: 'fallback-1',
        name: 'Tour Hạ Long - Sapa 5 ngày 4 đêm',
        description: 'Khám phá vẻ đẹp thiên nhiên hùng vĩ của Vịnh Hạ Long và cao nguyên Sapa với những trải nghiệm không thể quên.',
        price: 8500000,
        durationDays: 5,
        destination: 'Hạ Long - Sapa',
        maxParticipants: 25,
        ratingAverage: 4.8,
        totalBookings: 120,
        imageUrls: ['./assets/images/packege-1.jpg'],
        mainImageUrl: './assets/images/packege-1.jpg'
    },
    {
        id: 'fallback-2',
        name: 'Tour Phú Quốc 4 ngày 3 đêm',
        description: 'Thư giãn tại đảo ngọc Phú Quốc với những bãi biển tuyệt đẹp và ẩm thực hải sản tươi ngon.',
        price: 6200000,
        durationDays: 4,
        destination: 'Phú Quốc',
        maxParticipants: 20,
        ratingAverage: 4.6,
        totalBookings: 85,
        imageUrls: ['./assets/images/packege-2.jpg'],
        mainImageUrl: './assets/images/packege-2.jpg'
    },
    {
        id: 'fallback-3',
        name: 'Tour Đà Nẵng - Hội An 3 ngày 2 đêm',
        description: 'Khám phá thành phố Đà Nẵng hiện đại và phố cổ Hội An với văn hóa truyền thống đặc sắc.',
        price: 4500000,
        durationDays: 3,
        destination: 'Đà Nẵng - Hội An',
        maxParticipants: 30,
        ratingAverage: 4.7,
        totalBookings: 95,
        imageUrls: ['./assets/images/packege-3.jpg'],
        mainImageUrl: './assets/images/packege-3.jpg'
    }
];

const fallbackDestinations = [
    {
        id: 'dest-1',
        name: 'Vịnh Hạ Long',
        description: 'Di sản thiên nhiên thế giới với hàng nghìn hòn đảo đá vôi tuyệt đẹp.',
        destination: 'Quảng Ninh',
        ratingAverage: 4.9,
        imageUrls: ['./assets/images/popular-1.jpg'],
        mainImageUrl: './assets/images/popular-1.jpg'
    },
    {
        id: 'dest-2',
        name: 'Sapa',
        description: 'Cao nguyên mờ sương với ruộng bậc thang và văn hóa dân tộc đa dạng.',
        destination: 'Lào Cai',
        ratingAverage: 4.8,
        imageUrls: ['./assets/images/popular-2.jpg'],
        mainImageUrl: './assets/images/popular-2.jpg'
    },
    {
        id: 'dest-3',
        name: 'Phố cổ Hội An',
        description: 'Thành phố cổ với kiến trúc độc đáo và nền ẩm thực phong phú.',
        destination: 'Quảng Nam',
        ratingAverage: 4.7,
        imageUrls: ['./assets/images/popular-3.jpg'],
        mainImageUrl: './assets/images/popular-3.jpg'
    }
];

// Function để load fallback data
function loadFallbackData() {
    console.log('Loading fallback data...');
      // Load fallback tours for featured section
    const packageList = document.getElementById('featuredToursList') || document.querySelector('.package-list');
    if (packageList && fallbackTours.length > 0) {
        updateFeaturedTours(fallbackTours);
        console.log('Loaded fallback featured tours');
    }
      // Load fallback destinations for popular section
    const popularList = document.getElementById('popularDestinationsList') || document.querySelector('.popular-list');
    if (popularList && fallbackDestinations.length > 0) {
        updatePopularDestinations(fallbackDestinations);
        console.log('Loaded fallback popular destinations');
    }
    
    // Show notification that fallback data is being used
    if (IndexUtils) {
        IndexUtils.showToast('Đang hiển thị dữ liệu mẫu do không kết nối được API', 'warning');
    }
}

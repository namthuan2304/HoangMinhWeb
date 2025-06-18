# Admin SPA (Single Page Application)

## Tổng quan

Admin SPA là một ứng dụng quản trị dựa trên kiến trúc Single Page Application, được xây dựng với vanilla JavaScript để quản lý hệ thống đặt tour du lịch.

## Tính năng chính

### 🚀 **Core Features**
- **Router System**: Điều hướng client-side với hỗ trợ back/forward
- **Component-based Architecture**: Tổ chức code theo từng component
- **Authentication Middleware**: Tự động kiểm tra quyền truy cập
- **Loading States**: Hiển thị trạng thái loading khi chuyển trang
- **Error Handling**: Xử lý lỗi toàn cục và hiển thị thông báo
- **Modal System**: Hệ thống modal/dialog tái sử dụng

### 📊 **Dashboard**
- Tổng quan thống kê (tours, bookings, users, revenue)
- Biểu đồ doanh thu và đặt tour theo tháng
- Danh sách hoạt động gần đây
- Real-time data loading

### 🗺️ **Tour Management**
- Danh sách tours với phân trang và lọc
- Thêm/sửa/xóa tours
- Upload hình ảnh
- Quản lý trạng thái tours

### 📅 **Booking Management**
- Danh sách đặt tour với filter
- Chi tiết đặt tour
- Cập nhật trạng thái booking
- Xem thông tin khách hàng

### 👥 **User Management**
- Quản lý người dùng
- Phân quyền user/admin
- Thống kê người dùng

### 📝 **Content Management**
- Quản lý bài viết
- Quản lý bình luận
- Upload media files

### 📈 **Reports**
- Báo cáo doanh thu
- Báo cáo tours
- Báo cáo người dùng
- Export data

## Cấu trúc Project

```
frontend/admin/
├── spa.html                    # Main SPA file
└── assets/js/
    ├── admin-spa-main.js      # Entry point & initialization
    ├── admin-spa-router.js    # Client-side routing
    ├── admin-spa-core.js      # Core functionality
    └── admin-spa-components.js # Page components
```

## Kiến trúc

### **Router System**
```javascript
// Đăng ký route
adminRouter.register('tours/:id/edit', (path, params) => {
    return adminComponents.loadTourEdit(params.id);
}, { title: 'Chỉnh sửa Tour' });

// Điều hướng
adminRouter.navigate('tours/123/edit');
```

### **Component System**
```javascript
// Load component
async loadTours() {
    const html = `<div>Tours content</div>`;
    this.render(html);
    await this.loadToursData();
}
```

### **API Integration**
```javascript
// Sử dụng API client
const tours = await adminCore.api.request('/tours/admin');
```

## Cách sử dụng

### 1. **Truy cập Admin SPA**
```
http://localhost:3000/frontend/admin/spa.html
```

### 2. **Đăng nhập**
- Cần tài khoản với role ADMIN
- SPA sẽ tự động kiểm tra authentication

### 3. **Điều hướng**
- Click trên sidebar menu
- Sử dụng browser back/forward
- URL sẽ tự động cập nhật: `#dashboard`, `#tours`, etc.

### 4. **Keyboard Shortcuts**
- `Ctrl/Cmd + K`: Quick search (coming soon)
- `Alt + D`: Go to dashboard
- `Escape`: Close modal/dropdown

## Development

### **Thêm Route mới**
```javascript
// Trong admin-spa-router.js
this.register('new-page', () => {
    return adminComponents.loadNewPage();
}, { title: 'New Page' });
```

### **Thêm Component mới**
```javascript
// Trong admin-spa-components.js
async loadNewPage() {
    const html = `<div>New page content</div>`;
    this.render(html);
    // Load data, bind events, etc.
}
```

### **Thêm Middleware**
```javascript
// Authentication middleware
adminRouter.use(async (path, route) => {
    if (!isAuthenticated()) {
        adminRouter.navigate('login', true);
        return false; // Block route
    }
    return true;
});
```

### **Xử lý Form**
```javascript
// Đánh dấu form có thay đổi
form.classList.add('form-dirty');

// Kiểm tra unsaved changes
const hasUnsavedChanges = document.querySelector('.form-dirty');
```

## API Endpoints

### **Dashboard**
- `GET /admin/dashboard/stats` - Thống kê tổng quan
- `GET /bookings/revenue-by-month?year=2024` - Doanh thu theo tháng
- `GET /bookings/stats-by-month?year=2024` - Thống kê booking

### **Tours**
- `GET /tours/admin` - Danh sách tours (admin)
- `POST /tours` - Tạo tour mới
- `PUT /tours/{id}` - Cập nhật tour
- `DELETE /tours/{id}` - Xóa tour

### **Bookings**
- `GET /bookings/admin` - Danh sách booking (admin)
- `GET /bookings/{id}` - Chi tiết booking
- `PUT /bookings/{id}/status` - Cập nhật trạng thái

### **Users**
- `GET /users` - Danh sách users
- `PUT /users/{id}` - Cập nhật user
- `DELETE /users/{id}` - Xóa user

## Performance

### **Optimizations**
- Component caching
- Lazy loading
- Debounced search
- Pagination
- Image lazy loading

### **Bundle Size**
- No external frameworks (vanilla JS)
- Modular architecture
- CSS/JS minification ready

## Browser Support

- Modern browsers với ES6+ support
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Security

### **Authentication**
- JWT token trong localStorage
- Automatic token refresh
- Role-based access control

### **CSRF Protection**
- API requests với proper headers
- Token validation

### **XSS Prevention**
- HTML escaping
- CSP headers (recommended)

## Troubleshooting

### **Common Issues**

1. **Trang trắng khi load**
   - Kiểm tra console errors
   - Verify API endpoints
   - Check authentication token

2. **Router không hoạt động**
   - Kiểm tra hash trong URL
   - Verify route registration
   - Check middleware blocking

3. **API errors**
   - Check network tab
   - Verify CORS settings
   - Check authentication headers

### **Debug Mode**
```javascript
// Trong console browser
window.spa.getInfo(); // Xem thông tin SPA
window.adminRouter.currentRoute; // Route hiện tại
window.adminCore.currentUser; // User hiện tại
```

## Roadmap

### **Phase 1** ✅
- [x] Basic SPA architecture
- [x] Router system
- [x] Dashboard
- [x] Tours management
- [x] Authentication

### **Phase 2** 🚧
- [ ] Complete all CRUD operations
- [ ] Advanced filters and search
- [ ] File upload with drag & drop
- [ ] Real-time notifications

### **Phase 3** 📋
- [ ] PWA capabilities
- [ ] Offline support
- [ ] Advanced reporting
- [ ] Multi-language support

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include loading states
4. Test cross-browser compatibility
5. Document new features

## License

Private project - All rights reserved

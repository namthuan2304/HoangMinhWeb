# Travel Booking System - Backend

Hệ thống đặt tour du lịch được xây dựng bằng Spring Boot với đầy đủ các tính năng quản lý tour, đặt tour, người dùng và báo cáo.

## 🚀 Công nghệ sử dụng

- **Spring Boot 3.x** - Framework chính
- **Spring Security 6.x** - Bảo mật với JWT
- **Spring Data JPA** - ORM và quản lý database  
- **MySQL** - Database chính
- **Spring Mail** - Gửi email
- **Spring Validation** - Validate dữ liệu
- **ModelMapper** - Mapping DTO
- **Swagger/OpenAPI 3** - API Documentation
- **Java 21** - Ngôn ngữ lập trình

## 📋 Tính năng chính

### 🔐 Authentication & Security
- Đăng ký/đăng nhập với JWT
- Xác thực email
- Quên mật khẩu qua email
- Phân quyền ADMIN/USER

### 👥 Quản lý người dùng
- CRUD operations cho admin
- Phân trang và tìm kiếm users
- Soft delete users
- Reset mật khẩu
- Thống kê users

### 🏖️ Quản lý Tour
- CRUD operations cho tours
- Upload/delete multiple ảnh
- Tìm kiếm và filter tours
- Phân loại trong nước/nước ngoài
- Tours hot (được đặt nhiều)

### 📅 Quản lý đặt Tour
- Đặt tour với validation
- Quản lý trạng thái booking
- Hủy đặt tour
- Thống kê doanh thu
- Xuất hóa đơn PDF

### 👤 User Profile
- Cập nhật thông tin cá nhân
- Đổi mật khẩu
- Upload ảnh đại diện
- Lịch sử đặt tour
- Đánh giá tours

### 💬 Hệ thống bình luận
- Bình luận và rating tours
- Phân trang comments
- Quản lý comments
- Thống kê rating

### 📝 Quản lý bài viết
- CMS cho bài viết du lịch
- CRUD operations
- Liên kết bài viết với tours
- Tìm kiếm bài viết

### 📊 Thống kê & Báo cáo
- Dashboard tổng quan
- Thống kê doanh thu
- Báo cáo PDF
- Top tours, users stats

## 🛠️ Cài đặt và chạy

### Yêu cầu hệ thống
- Java 21+
- Maven 3.6+
- MySQL 8.0+

### Bước 1: Clone project
```bash
git clone <repository-url>
cd travel-booking/backend
```

### Bước 2: Cấu hình database
Tạo database MySQL:
```sql
CREATE DATABASE travel_booking_db;
```

Cập nhật file `application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/travel_booking_db
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### Bước 3: Cấu hình email (optional)
```properties
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

### Bước 4: Build và chạy
```bash
mvn clean install
mvn spring-boot:run
```

Ứng dụng sẽ chạy tại: `http://localhost:8080`

## 📚 API Documentation

Sau khi chạy ứng dụng, truy cập:
- **Swagger UI**: `http://localhost:8080/swagger-ui/index.html`
- **API Docs**: `http://localhost:8080/v3/api-docs`

## 🔑 Tài khoản mặc định

Hệ thống tự động tạo các tài khoản sau:

**Admin:**
- Username: `admin`
- Password: `admin123`

**Demo User:**
- Username: `demo`  
- Password: `demo123`

## 🗂️ Cấu trúc API

### Authentication
```
POST /api/auth/signin - Đăng nhập
POST /api/auth/signup - Đăng ký
POST /api/auth/signout - Đăng xuất
POST /api/auth/refresh-token - Refresh token
GET  /api/auth/verify-email - Xác thực email
POST /api/auth/forgot-password - Quên mật khẩu
POST /api/auth/reset-password - Reset mật khẩu
```

### Users Management
```
GET    /api/users - Lấy danh sách users (Admin)
GET    /api/users/{id} - Chi tiết user (Admin)
PUT    /api/users/{id} - Cập nhật user (Admin)
DELETE /api/users/{id} - Xóa user (Admin)
GET    /api/users/profile - Thông tin cá nhân
PUT    /api/users/profile - Cập nhật profile
POST   /api/users/change-password - Đổi mật khẩu
POST   /api/users/upload-avatar - Upload avatar
```

### Tours Management
```
GET    /api/tours - Danh sách tours
GET    /api/tours/{id} - Chi tiết tour
POST   /api/tours - Tạo tour (Admin)
PUT    /api/tours/{id} - Cập nhật tour (Admin)  
DELETE /api/tours/{id} - Xóa tour (Admin)
POST   /api/tours/{id}/upload-images - Upload ảnh
GET    /api/tours/search - Tìm kiếm tours
GET    /api/tours/featured - Tours nổi bật
```

### Booking Management
```
POST   /api/bookings - Đặt tour
GET    /api/bookings - Danh sách bookings (Admin)
GET    /api/bookings/{id} - Chi tiết booking
PUT    /api/bookings/{id}/status - Cập nhật trạng thái (Admin)
POST   /api/bookings/{id}/cancel - Hủy booking
GET    /api/bookings/user - Lịch sử đặt tour user
```

### Comments & Reviews
```
POST   /api/comments - Thêm bình luận
GET    /api/comments/tour/{tourId} - Bình luận theo tour
PUT    /api/comments/{id} - Sửa bình luận
DELETE /api/comments/{id} - Xóa bình luận
```

### Articles Management
```
GET    /api/articles - Danh sách bài viết
GET    /api/articles/{slug} - Chi tiết bài viết
POST   /api/articles - Tạo bài viết (Admin)
PUT    /api/articles/{id} - Cập nhật bài viết (Admin)
DELETE /api/articles/{id} - Xóa bài viết (Admin)
POST   /api/articles/{id}/publish - Xuất bản (Admin)
```

### Statistics & Reports
```
GET    /api/statistics/dashboard - Dashboard tổng quan
GET    /api/statistics/revenue/monthly - Doanh thu theo tháng
GET    /api/statistics/revenue/quarterly - Doanh thu theo quý
GET    /api/statistics/tours/top-booked - Top tours
GET    /api/statistics/revenue/monthly/pdf - Xuất báo cáo PDF
```

### PDF Export
```
GET    /api/pdf/invoice/{bookingId} - Xuất hóa đơn PDF
GET    /api/pdf/admin/invoice/{bookingId} - Xuất hóa đơn (Admin)
```

## 📁 Cấu trúc thư mục

```
src/main/java/com/travel/
├── config/          # Cấu hình Spring
├── controller/      # REST Controllers
├── dto/            # Data Transfer Objects
├── entity/         # JPA Entities
├── enums/          # Enums
├── exception/      # Exception handlers
├── repository/     # JPA Repositories  
├── security/       # Security configs
└── service/        # Business logic
```

## 🔧 Cấu hình môi trường

### Development
```properties
spring.profiles.active=dev
spring.jpa.show-sql=true
logging.level.com.travel=DEBUG
```

### Production
```properties
spring.profiles.active=prod
spring.jpa.show-sql=false
logging.level.com.travel=INFO
```

## 🐛 Troubleshooting

### Lỗi kết nối database
1. Kiểm tra MySQL service đã chạy
2. Xác nhận username/password đúng
3. Đảm bảo database đã được tạo

### Lỗi upload file
1. Kiểm tra quyền ghi thư mục uploads
2. Tạo thư mục uploads nếu chưa có
3. Kiểm tra dung lượng file

### Lỗi gửi email
1. Bật 2-factor authentication Gmail
2. Tạo App Password
3. Cập nhật cấu hình email

## 📞 Hỗ trợ

- Email: support@travelbooking.com
- Documentation: [API Docs](http://localhost:8080/swagger-ui/index.html)

## 📄 License

Copyright © 2024 Travel Booking System. All rights reserved.

# Travel Booking System

Hệ thống đặt tour du lịch với backend Spring Boot và frontend HTML/CSS/JavaScript.

## Cấu trúc project

- `backend/` - Spring Boot application
- `frontend/` - Static web files (HTML, CSS, JavaScript)

## Backend (Spring Boot)

### Yêu cầu
- Java 11 hoặc cao hơn
- Maven 3.6+

### Chạy ứng dụng
```bash
cd backend
mvn spring-boot:run
```

Ứng dụng sẽ chạy trên http://localhost:8080

### Tính năng
- Quản lý tour du lịch
- Đặt tour
- Quản lý người dùng
- Authentication & Authorization
- API Documentation với Swagger

## Frontend

### Cấu trúc
- `index.html` - Trang chủ
- `assets/css/` - File CSS
- `assets/js/` - File JavaScript
- `assets/images/` - Hình ảnh

### Chạy frontend
Mở file `frontend/index.html` trong trình duyệt hoặc sử dụng web server.

## Cài đặt và chạy

1. Clone repository:
```bash
git clone <repository-url>
cd HoangMinhWeb
```

2. Chạy backend:
```bash
cd backend
mvn spring-boot:run
```

3. Mở frontend trong trình duyệt:
```bash
cd frontend
# Mở index.html trong trình duyệt
```

## Công nghệ sử dụng

### Backend
- Spring Boot
- Spring Security
- Spring Data JPA
- MySQL/H2 Database
- Maven
- Swagger/OpenAPI

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)
- Responsive Design

## Đóng góp

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

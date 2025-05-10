package com.travel.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO cho request đăng ký
 */
public class SignupRequest {

    @NotBlank(message = "Tên người dùng không được để trống")
    @Size(min = 3, max = 20, message = "Tên người dùng phải từ 3-20 ký tự")
    private String username;

    @NotBlank(message = "Email không được để trống")
    @Size(max = 50)
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, max = 40, message = "Mật khẩu phải từ 6-40 ký tự")
    private String password;

    private String fullName;
    private String phone;

    // Constructors
    public SignupRequest() {}

    public SignupRequest(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }

    // Getters and Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}

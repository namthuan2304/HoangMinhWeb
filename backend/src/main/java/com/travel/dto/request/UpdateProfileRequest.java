package com.travel.dto.request;

import com.travel.enums.UserRole;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * DTO request cập nhật thông tin cá nhân
 */
public class UpdateProfileRequest {

    @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
    private String fullName;

    @Pattern(regexp = "^[0-9]{10,11}$", message = "Số điện thoại phải có 10-11 chữ số")
    private String phone;

    @Size(max = 255, message = "Địa chỉ không được vượt quá 255 ký tự")
    private String address;    @Past(message = "Ngày sinh phải là ngày trong quá khứ")
    private LocalDate birthDate;    @Size(max = 10, message = "Giới tính không được vượt quá 10 ký tự")
    private String gender;

    private Boolean isActive;

    private UserRole role;

    // Constructors
    public UpdateProfileRequest() {}public UpdateProfileRequest(String fullName, String phone, String address, LocalDate birthDate, String gender) {
        this.fullName = fullName;
        this.phone = phone;
        this.address = address;
        this.birthDate = birthDate;
        this.gender = gender;
    }

    // Getters and Setters
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public Boolean getIsActive() {
        return isActive;
    }    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public UserRole getRole() {
        return role;
    }    public void setRole(UserRole role) {
        this.role = role;
    }

    // Helper method để set role từ string
    public void setRole(String roleString) {
        if (roleString != null) {
            try {
                this.role = UserRole.valueOf(roleString.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore invalid role values
                this.role = null;
            }
        }
    }
}

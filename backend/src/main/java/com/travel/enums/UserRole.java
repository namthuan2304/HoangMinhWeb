package com.travel.enums;

/**
 * Enum định nghĩa các vai trò người dùng trong hệ thống
 */
public enum UserRole {
    ADMIN("ADMIN", "Quản trị viên"),
    USER("USER", "Người dùng");

    private final String code;
    private final String description;

    UserRole(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    @Override
    public String toString() {
        return code;
    }
}

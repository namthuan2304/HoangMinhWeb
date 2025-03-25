package com.travel.enums;

/**
 * Enum định nghĩa trạng thái đặt tour
 */
public enum BookingStatus {
    PENDING("PENDING", "Chờ xác nhận"),
    CONFIRMED("CONFIRMED", "Đã xác nhận"),
    CANCELLED("CANCELLED", "Đã hủy"),
    COMPLETED("COMPLETED", "Đã hoàn thành");

    private final String code;
    private final String description;

    BookingStatus(String code, String description) {
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

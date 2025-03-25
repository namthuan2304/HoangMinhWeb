package com.travel.enums;

/**
 * Enum định nghĩa trạng thái của tour
 */
public enum TourStatus {
    ACTIVE("ACTIVE", "Đang hoạt động"),
    INACTIVE("INACTIVE", "Tạm dừng"),
    FULL("FULL", "Đã đầy chỗ"),
    CANCELLED("CANCELLED", "Đã hủy"),
    COMPLETED("COMPLETED", "Đã hoàn thành");

    private final String code;
    private final String description;

    TourStatus(String code, String description) {
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

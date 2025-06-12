package com.travel.enums;

/**
 * Enum định nghĩa trạng thái bình luận
 */
public enum CommentStatus {
    PENDING("PENDING", "Chờ duyệt"),
    APPROVED("APPROVED", "Đã duyệt"), 
    REJECTED("REJECTED", "Đã từ chối");

    private final String code;
    private final String description;

    CommentStatus(String code, String description) {
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

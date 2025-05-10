package com.travel.enums;

/**
 * Enum định nghĩa loại tour
 */
public enum TourType {
    DOMESTIC("DOMESTIC", "Trong nước"),
    INTERNATIONAL("INTERNATIONAL", "Nước ngoài");

    private final String code;
    private final String description;

    TourType(String code, String description) {
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

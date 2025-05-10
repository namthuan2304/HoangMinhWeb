package com.travel.dto.request;

import jakarta.validation.constraints.*;


/**
 * DTO request đặt tour
 */
public class BookingTourRequest {

    @NotNull(message = "ID tour không được để trống")
    private Long tourId;

    @NotNull(message = "Số lượng người không được để trống")
    @Min(value = 1, message = "Số lượng người phải lớn hơn 0")
    private Integer participantsCount;

    @NotBlank(message = "Tên liên hệ không được để trống")
    @Size(max = 100, message = "Tên liên hệ không được vượt quá 100 ký tự")
    private String contactName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{10,11}$", message = "Số điện thoại phải có 10-11 chữ số")
    private String contactPhone;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String contactEmail;

    @Size(max = 500, message = "Yêu cầu đặc biệt không được vượt quá 500 ký tự")
    private String specialRequests;

    // Constructors
    public BookingTourRequest() {}

    public BookingTourRequest(Long tourId, Integer participantsCount, String contactName, 
                             String contactPhone, String contactEmail) {
        this.tourId = tourId;
        this.participantsCount = participantsCount;
        this.contactName = contactName;
        this.contactPhone = contactPhone;
        this.contactEmail = contactEmail;
    }

    // Getters and Setters
    public Long getTourId() {
        return tourId;
    }

    public void setTourId(Long tourId) {
        this.tourId = tourId;
    }

    public Integer getParticipantsCount() {
        return participantsCount;
    }

    public void setParticipantsCount(Integer participantsCount) {
        this.participantsCount = participantsCount;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getSpecialRequests() {
        return specialRequests;
    }

    public void setSpecialRequests(String specialRequests) {
        this.specialRequests = specialRequests;
    }
}

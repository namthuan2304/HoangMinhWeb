package com.travel.dto.request;

import com.travel.enums.TourStatus;
import com.travel.enums.TourType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO request tạo/cập nhật tour
 */
public class TourRequest {

    @NotBlank(message = "Tên tour không được để trống")
    @Size(max = 200, message = "Tên tour không được vượt quá 200 ký tự")
    private String name;

    @Size(max = 2000, message = "Mô tả không được vượt quá 2000 ký tự")
    private String description;

    @NotNull(message = "Giá tour không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá tour phải lớn hơn 0")
    private BigDecimal price;

    @NotNull(message = "Ngày khởi hành không được để trống")
    @Future(message = "Ngày khởi hành phải là ngày trong tương lai")
    private LocalDate departureDate;

    private LocalDate returnDate;

    @NotBlank(message = "Điểm đến không được để trống")
    @Size(max = 200, message = "Điểm đến không được vượt quá 200 ký tự")
    private String destination;

    @Size(max = 200, message = "Điểm khởi hành không được vượt quá 200 ký tự")
    private String departureLocation;

    @NotNull(message = "Số chỗ tối đa không được để trống")
    @Min(value = 1, message = "Số chỗ tối đa phải lớn hơn 0")
    private Integer maxParticipants;

    private TourStatus status = TourStatus.ACTIVE;

    @NotNull(message = "Loại tour không được để trống")
    private TourType tourType;

    @Min(value = 1, message = "Số ngày tour phải lớn hơn 0")
    private Integer durationDays;

    @Size(max = 5000, message = "Lịch trình không được vượt quá 5000 ký tự")
    private String itinerary;

    @Size(max = 2000, message = "Bao gồm không được vượt quá 2000 ký tự")
    private String includes;

    @Size(max = 2000, message = "Không bao gồm không được vượt quá 2000 ký tự")
    private String excludes;

    @Size(max = 3000, message = "Điều khoản không được vậy quá 3000 ký tự")
    private String termsConditions;

    private Boolean isFeatured = false;

    // Constructors
    public TourRequest() {}

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public LocalDate getDepartureDate() {
        return departureDate;
    }

    public void setDepartureDate(LocalDate departureDate) {
        this.departureDate = departureDate;
    }

    public LocalDate getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public String getDepartureLocation() {
        return departureLocation;
    }

    public void setDepartureLocation(String departureLocation) {
        this.departureLocation = departureLocation;
    }

    public Integer getMaxParticipants() {
        return maxParticipants;
    }

    public void setMaxParticipants(Integer maxParticipants) {
        this.maxParticipants = maxParticipants;
    }

    public TourStatus getStatus() {
        return status;
    }

    public void setStatus(TourStatus status) {
        this.status = status;
    }

    public TourType getTourType() {
        return tourType;
    }

    public void setTourType(TourType tourType) {
        this.tourType = tourType;
    }

    public Integer getDurationDays() {
        return durationDays;
    }

    public void setDurationDays(Integer durationDays) {
        this.durationDays = durationDays;
    }

    public String getItinerary() {
        return itinerary;
    }

    public void setItinerary(String itinerary) {
        this.itinerary = itinerary;
    }

    public String getIncludes() {
        return includes;
    }

    public void setIncludes(String includes) {
        this.includes = includes;
    }

    public String getExcludes() {
        return excludes;
    }

    public void setExcludes(String excludes) {
        this.excludes = excludes;
    }

    public String getTermsConditions() {
        return termsConditions;
    }

    public void setTermsConditions(String termsConditions) {
        this.termsConditions = termsConditions;
    }

    public Boolean getIsFeatured() {
        return isFeatured;
    }

    public void setIsFeatured(Boolean isFeatured) {
        this.isFeatured = isFeatured;
    }
}

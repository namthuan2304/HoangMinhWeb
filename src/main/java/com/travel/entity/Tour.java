package com.travel.entity;

import com.travel.enums.TourStatus;
import com.travel.enums.TourType;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity tour du lịch
 */
@Entity
@Table(name = "tours")
public class Tour extends BaseEntity {

    @NotBlank(message = "Tên tour không được để trống")
    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Giá tour không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá tour phải lớn hơn 0")
    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @NotNull(message = "Ngày khởi hành không được để trống")
    @Column(name = "departure_date", nullable = false)
    private LocalDate departureDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @NotBlank(message = "Điểm đến không được để trống")
    @Column(name = "destination", nullable = false)
    private String destination;

    @Column(name = "departure_location")
    private String departureLocation;

    @NotNull(message = "Số chỗ không được để trống")
    @Min(value = 1, message = "Số chỗ phải lớn hơn 0")
    @Column(name = "max_participants", nullable = false)
    private Integer maxParticipants;

    @Column(name = "current_participants")
    private Integer currentParticipants = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TourStatus status = TourStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "tour_type", nullable = false)
    private TourType tourType = TourType.DOMESTIC;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "itinerary", columnDefinition = "TEXT")
    private String itinerary;

    @Column(name = "includes", columnDefinition = "TEXT")
    private String includes;

    @Column(name = "excludes", columnDefinition = "TEXT")
    private String excludes;

    @Column(name = "terms_conditions", columnDefinition = "TEXT")
    private String termsConditions;

    @Column(name = "main_image_url")
    private String mainImageUrl;

    @ElementCollection
    @CollectionTable(name = "tour_images", joinColumns = @JoinColumn(name = "tour_id"))
    @Column(name = "image_url")
    private List<String> imageUrls = new ArrayList<>();

    @Column(name = "rating_average")
    private Double ratingAverage = 0.0;

    @Column(name = "total_bookings")
    private Integer totalBookings = 0;

    @Column(name = "is_featured")
    private Boolean isFeatured = false;

    // Constructors
    public Tour() {}

    public Tour(String name, String description, BigDecimal price, LocalDate departureDate, String destination) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.departureDate = departureDate;
        this.destination = destination;
    }

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

    public Integer getCurrentParticipants() {
        return currentParticipants;
    }

    public void setCurrentParticipants(Integer currentParticipants) {
        this.currentParticipants = currentParticipants;
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

    public String getMainImageUrl() {
        return mainImageUrl;
    }

    public void setMainImageUrl(String mainImageUrl) {
        this.mainImageUrl = mainImageUrl;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public Double getRatingAverage() {
        return ratingAverage;
    }

    public void setRatingAverage(Double ratingAverage) {
        this.ratingAverage = ratingAverage;
    }

    public Integer getTotalBookings() {
        return totalBookings;
    }

    public void setTotalBookings(Integer totalBookings) {
        this.totalBookings = totalBookings;
    }

    public Boolean getIsFeatured() {
        return isFeatured;
    }

    public void setIsFeatured(Boolean isFeatured) {
        this.isFeatured = isFeatured;
    }

    /**
     * Kiểm tra tour có còn chỗ trống hay không
     */
    public boolean hasAvailableSlots() {
        return currentParticipants < maxParticipants;
    }

    /**
     * Lấy số chỗ còn trống
     */
    public int getAvailableSlots() {
        return maxParticipants - currentParticipants;
    }

    /**
     * Tăng số lượng người tham gia
     */
    public void increaseParticipants(int count) {
        this.currentParticipants += count;
        if (this.currentParticipants >= maxParticipants) {
            this.status = TourStatus.FULL;
        }
    }

    /**
     * Giảm số lượng người tham gia
     */
    public void decreaseParticipants(int count) {
        this.currentParticipants -= count;
        if (this.currentParticipants < 0) {
            this.currentParticipants = 0;
        }
        if (this.status == TourStatus.FULL && hasAvailableSlots()) {
            this.status = TourStatus.ACTIVE;
        }
    }

    /**
     * Tăng tổng số lượt đặt
     */
    public void increaseTotalBookings() {
        this.totalBookings++;
    }
}

// Admin Tour Create Management - Optimized Version
class AdminTourCreate {
    constructor() {
        // Constants
        this.CONSTANTS = {
            MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
            MAX_IMAGES: 10,
            ACCEPTED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
            DEBOUNCE_DELAY: 300,
            TOAST_DURATION: 3000
        };

        // State
        this.state = {
            isLoading: false,
            isDraft: false,
            images: [],
            validationErrors: new Map(),
            debounceTimers: new Map()
        };

        // Elements cache
        this.elements = {};
        
        this.init();
    }

    async init() {
        console.log('Initializing Admin Tour Create...');
        
        try {
            // Check admin authentication
            if (!this.checkAdminAuth()) return;

            // Initialize elements with error handling
            if (!await this.initializeElements()) {
                throw new Error('Failed to initialize UI elements');
            }
            
            this.bindEvents();
            this.setupFormDefaults();
            
            console.log('Admin Tour Create initialized successfully');
        } catch (error) {
            console.error('Failed to initialize tour create:', error);
            this.showToast('Có lỗi khi khởi tạo trang: ' + error.message, 'error');
        }
    }

    checkAdminAuth() {
        try {
            if (!apiClient?.isAuthenticated()) {
                this.redirectTo('../login.html');
                return false;
            }

            const user = apiClient.getCurrentUser();
            if (!user || user.role !== 'ADMIN') {
                this.showToast('Bạn không có quyền truy cập trang này!', 'error');
                this.redirectTo('../index.html');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Auth check failed:', error);
            this.redirectTo('../login.html');
            return false;
        }
    }

    async initializeElements() {
        // Define required elements
        const requiredElements = {
            form: 'tourCreateForm',
            createTourBtn: 'createTourBtn',
            saveDraftBtn: 'saveDraftBtn',
            loadingOverlay: 'loadingOverlay',
            imageInput: 'imageInput',
            imageUploadArea: 'imageUploadArea',
            imagesPreview: 'imagesPreview'
        };

        // Optional elements
        const optionalElements = {
            createTourBtn2: 'createTourBtn2',
            saveDraftBtn2: 'saveDraftBtn2'
        };

        // Get required elements
        for (const [key, id] of Object.entries(requiredElements)) {
            this.elements[key] = document.getElementById(id);
            if (!this.elements[key]) {
                throw new Error(`Required element not found: ${id}`);
            }
        }

        // Get optional elements
        for (const [key, id] of Object.entries(optionalElements)) {
            this.elements[key] = document.getElementById(id);
        }

        return true;
    }

    bindEvents() {
        // Form submission with error handling
        this.addEventListener(this.elements.form, 'submit', this.handleFormSubmit.bind(this));

        // Button events
        this.addEventListener(this.elements.createTourBtn, 'click', () => this.createTour());
        this.addEventListener(this.elements.saveDraftBtn, 'click', () => this.saveDraft());
        
        if (this.elements.createTourBtn2) {
            this.addEventListener(this.elements.createTourBtn2, 'click', () => this.createTour());
        }
        if (this.elements.saveDraftBtn2) {
            this.addEventListener(this.elements.saveDraftBtn2, 'click', () => this.saveDraft());
        }

        // Image upload events
        this.addEventListener(this.elements.imageInput, 'change', this.handleImageUpload.bind(this));
        this.setupDragAndDrop();

        // Form validation and auto-calculation
        this.setupFormValidation();
        this.setupDateValidation();
        this.setupDurationCalculation();
    }

    setupFormDefaults() {
        // Set minimum departure date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const departureDateInput = document.getElementById('departureDate');
        if (departureDateInput) {
            departureDateInput.min = tomorrow.toISOString().split('T')[0];
        }
    }

    setupDragAndDrop() {
        const events = ['dragover', 'dragleave', 'drop'];
        
        events.forEach(eventName => {
            this.addEventListener(this.elements.imageUploadArea, eventName, (e) => {
                e.preventDefault();
                
                switch (eventName) {
                    case 'dragover':
                        this.elements.imageUploadArea.classList.add('dragover');
                        break;
                    case 'dragleave':
                        this.elements.imageUploadArea.classList.remove('dragover');
                        break;
                    case 'drop':
                        this.elements.imageUploadArea.classList.remove('dragover');
                        this.handleImageDrop(e);
                        break;
                }
            });
        });
    }

    setupDateValidation() {
        const departureDate = document.getElementById('departureDate');
        const returnDate = document.getElementById('returnDate');

        if (departureDate) {
            this.addEventListener(departureDate, 'change', () => {
                this.validateDates();
                this.calculateDuration();
            });
        }

        if (returnDate) {
            this.addEventListener(returnDate, 'change', () => {
                this.validateDates();
                this.calculateDuration();
            });
        }
    }

    setupDurationCalculation() {
        const durationInput = document.getElementById('durationDays');
        const departureDate = document.getElementById('departureDate');
        const returnDate = document.getElementById('returnDate');

        if (durationInput) {
            this.addEventListener(durationInput, 'input', this.debounce(() => {
                if (departureDate?.value && durationInput.value) {
                    const departure = new Date(departureDate.value);
                    const calculatedReturn = new Date(departure);
                    calculatedReturn.setDate(departure.getDate() + parseInt(durationInput.value) - 1);
                    
                    if (returnDate) {
                        returnDate.value = calculatedReturn.toISOString().split('T')[0];
                    }
                }
            }, this.CONSTANTS.DEBOUNCE_DELAY));
        }
    }

    setupFormValidation() {
        const requiredFields = [
            'tourName', 'tourType', 'destination', 'departureDate',
            'durationDays', 'price', 'maxParticipants'
        ];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                this.addEventListener(field, 'blur', () => this.validateField(fieldId));
                this.addEventListener(field, 'input', this.debounce(() => {
                    this.clearFieldError(fieldId);
                }, this.CONSTANTS.DEBOUNCE_DELAY));
            }
        });
    }

    validateDates() {
        const departureDate = document.getElementById('departureDate');
        const returnDate = document.getElementById('returnDate');

        if (!departureDate || !returnDate) return;

        // Clear previous validation
        this.clearFieldError('departureDate');
        this.clearFieldError('returnDate');

        if (departureDate.value) {
            const departure = new Date(departureDate.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (departure <= today) {
                this.showFieldError('departureDate', 'Ngày khởi hành phải là ngày trong tương lai');
                return false;
            }

            // Update return date minimum
            const minReturn = new Date(departure);
            minReturn.setDate(minReturn.getDate() + 1);
            returnDate.min = minReturn.toISOString().split('T')[0];
        }

        if (departureDate.value && returnDate.value) {
            if (new Date(returnDate.value) <= new Date(departureDate.value)) {
                this.showFieldError('returnDate', 'Ngày kết thúc phải sau ngày khởi hành');
                return false;
            }
        }

        return true;
    }

    calculateDuration() {
        const departureDate = document.getElementById('departureDate');
        const returnDate = document.getElementById('returnDate');
        const durationInput = document.getElementById('durationDays');

        if (departureDate?.value && returnDate?.value && durationInput) {
            const departure = new Date(departureDate.value);
            const returnD = new Date(returnDate.value);
            const diffTime = Math.abs(returnD - departure);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            durationInput.value = diffDays;
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        this.createTour();
    }

    handleImageUpload(event) {
        const files = Array.from(event.target.files);
        this.processImages(files);
        event.target.value = ''; // Clear input
    }

    handleImageDrop(event) {
        const files = Array.from(event.dataTransfer.files);
        this.processImages(files);
    }

    async processImages(files) {
        try {
            // Filter valid image files
            const validFiles = files.filter(file => this.validateImageFile(file));
            
            if (validFiles.length === 0) {
                this.showToast('Không có file hình ảnh hợp lệ nào được chọn', 'warning');
                return;
            }

            // Check total image limit
            if (this.state.images.length + validFiles.length > this.CONSTANTS.MAX_IMAGES) {
                this.showToast(`Chỉ được tải lên tối đa ${this.CONSTANTS.MAX_IMAGES} hình ảnh`, 'error');
                return;
            }

            // Process files with loading indication
            this.showImageProcessing(true);

            const processedImages = await Promise.all(validFiles.map(file => this.createImageData(file)));
            
            // Remove duplicates and add to state
            const newImages = processedImages.filter(newImg => 
                !this.state.images.some(existingImg => 
                    existingImg.file.name === newImg.file.name && 
                    existingImg.file.size === newImg.file.size
                )
            );

            this.state.images.push(...newImages);
            this.renderImagePreviews();
            this.clearFieldError('images');

            if (newImages.length > 0) {
                this.showToast(`Đã thêm ${newImages.length} hình ảnh`, 'success');
            }

        } catch (error) {
            console.error('Error processing images:', error);
            this.showToast('Có lỗi khi xử lý hình ảnh: ' + error.message, 'error');
        } finally {
            this.showImageProcessing(false);
        }
    }

    validateImageFile(file) {
        if (!this.CONSTANTS.ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
            this.showToast(`File ${file.name} không phải định dạng hình ảnh hợp lệ`, 'error');
            return false;
        }

        if (file.size > this.CONSTANTS.MAX_FILE_SIZE) {
            this.showToast(`File ${file.name} quá lớn (tối đa 5MB)`, 'error');
            return false;
        }

        return true;
    }

    async createImageData(file) {
        return new Promise((resolve) => {
            const imageData = {
                file: file,
                preview: URL.createObjectURL(file),
                id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            resolve(imageData);
        });
    }

    renderImagePreviews() {
        if (this.state.images.length === 0) {
            this.elements.imagesPreview.innerHTML = '';
            return;
        }

        const fragment = document.createDocumentFragment();
        
        this.state.images.forEach((image, index) => {
            const imageItem = this.createImagePreviewElement(image, index);
            fragment.appendChild(imageItem);
        });

        this.elements.imagesPreview.innerHTML = '';
        this.elements.imagesPreview.appendChild(fragment);
    }

    createImagePreviewElement(image, index) {
        const div = document.createElement('div');
        div.className = 'image-item';
        div.dataset.id = image.id;
        
        div.innerHTML = `
            <img src="${image.preview}" alt="${this.escapeHtml(image.file.name)}" loading="lazy">
            <div class="image-actions">
                <button type="button" class="btn-icon btn-success" data-action="setMain" data-id="${image.id}" title="Đặt làm ảnh chính">
                    <ion-icon name="star-outline"></ion-icon>
                </button>
                <button type="button" class="btn-icon btn-danger" data-action="remove" data-id="${image.id}" title="Xóa">
                    <ion-icon name="trash-outline"></ion-icon>
                </button>
            </div>
            ${index === 0 ? '<div class="main-image-badge">Ảnh chính</div>' : ''}
            <div class="image-name">${this.escapeHtml(image.file.name)}</div>
        `;

        // Add event listeners
        div.addEventListener('click', this.handleImageAction.bind(this));

        return div;
    }

    handleImageAction(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const imageId = button.dataset.id;

        switch (action) {
            case 'setMain':
                this.setMainImage(imageId);
                break;
            case 'remove':
                this.removeImage(imageId);
                break;
        }
    }

    setMainImage(imageId) {
        const imageIndex = this.state.images.findIndex(img => img.id === imageId);
        if (imageIndex > 0) {
            const [image] = this.state.images.splice(imageIndex, 1);
            this.state.images.unshift(image);
            this.renderImagePreviews();
            this.showToast('Đã đặt làm ảnh chính', 'success');
        }
    }

    removeImage(imageId) {
        const imageIndex = this.state.images.findIndex(img => img.id === imageId);
        if (imageIndex > -1) {
            const [removedImage] = this.state.images.splice(imageIndex, 1);
            URL.revokeObjectURL(removedImage.preview);
            this.renderImagePreviews();
            this.showToast('Đã xóa hình ảnh', 'success');
        }
    }

    async saveDraft() {
        this.state.isDraft = true;
        await this.submitForm('INACTIVE');
    }

    async createTour() {
        this.state.isDraft = false;
        const statusSelect = document.getElementById('status');
        const status = statusSelect?.value || 'ACTIVE';
        await this.submitForm(status);
    }

    async submitForm(status = 'ACTIVE') {
        if (this.state.isLoading) return;

        try {
            this.state.isLoading = true;
            this.updateButtonStates();
            this.showLoading(true);

            // Validate form for non-draft submissions
            if (!this.state.isDraft && !this.validateForm()) {
                return;
            }

            // Get and prepare form data
            const formData = this.getFormData();
            formData.status = status;

            console.log('Creating tour with data:', formData);
            
            // Create tour
            const createdTour = await apiClient.createTour(formData);
            
            // Upload images if any
            if (this.state.images.length > 0) {
                await this.uploadTourImages(createdTour.id);
            }

            const actionText = this.state.isDraft ? 'Lưu nháp' : 'Tạo tour';
            this.showToast(`${actionText} thành công!`, 'success');

            // Redirect after delay
            setTimeout(() => {
                const redirectUrl = this.state.isDraft ? 'tours.html' : `tour-edit.html?id=${createdTour.id}`;
                this.redirectTo(redirectUrl);
            }, 1500);

        } catch (error) {
            console.error('Error submitting form:', error);
            const actionText = this.state.isDraft ? 'lưu nháp' : 'tạo tour';
            this.showToast(`Có lỗi khi ${actionText}: ${error.message}`, 'error');
        } finally {
            this.state.isLoading = false;
            this.updateButtonStates();
            this.showLoading(false);
        }
    }

    async uploadTourImages(tourId) {
        try {
            const imageFiles = this.state.images.map(img => img.file);
            console.log(`Uploading ${imageFiles.length} images...`);
            
            const uploadResult = await apiClient.uploadTourImages(tourId, imageFiles);
            console.log('Images uploaded successfully:', uploadResult);

            // Set main image after a delay to allow processing
            if (imageFiles.length > 0) {
                setTimeout(async () => {
                    try {
                        const updatedTour = await apiClient.getTour(tourId);
                        if (updatedTour.imageUrls?.length > 0) {
                            await apiClient.setMainImage(tourId, updatedTour.imageUrls[0]);
                            console.log('Main image set successfully');
                        }
                    } catch (error) {
                        console.error('Error setting main image:', error);
                    }
                }, 1000);
            }

        } catch (error) {
            console.error('Error uploading images:', error);
            this.showToast('Tour đã được tạo nhưng có lỗi khi tải ảnh lên: ' + error.message, 'warning');
        }
    }

    validateForm() {
        const errors = new Map();

        // Required fields validation
        const requiredFields = [
            { id: 'tourName', key: 'name', message: 'Tên tour là bắt buộc' },
            { id: 'tourType', key: 'tourType', message: 'Loại tour là bắt buộc' },
            { id: 'destination', key: 'destination', message: 'Điểm đến là bắt buộc' },
            { id: 'departureDate', key: 'departureDate', message: 'Ngày khởi hành là bắt buộc' },
            { id: 'durationDays', key: 'durationDays', message: 'Số ngày tour là bắt buộc' },
            { id: 'price', key: 'price', message: 'Giá tour là bắt buộc' },
            { id: 'maxParticipants', key: 'maxParticipants', message: 'Số người tối đa là bắt buộc' }
        ];

        requiredFields.forEach(field => {
            const input = document.getElementById(field.id);
            if (!input?.value?.trim()) {
                errors.set(field.key, field.message);
            }
        });

        // Numeric validations
        this.validateNumericFields(errors);
        
        // Date validations
        if (!this.validateDates()) {
            // Errors already set by validateDates
        }

        // Display all errors
        this.displayValidationErrors(errors);

        return errors.size === 0;
    }

    validateNumericFields(errors) {
        const numericFields = [
            { id: 'price', key: 'price', min: 0, message: 'Giá tour phải lớn hơn 0' },
            { id: 'maxParticipants', key: 'maxParticipants', min: 1, message: 'Số người tối đa phải lớn hơn 0' },
            { id: 'durationDays', key: 'durationDays', min: 1, message: 'Số ngày tour phải lớn hơn 0' }
        ];

        numericFields.forEach(field => {
            const input = document.getElementById(field.id);
            const value = parseFloat(input?.value);
            
            if (input?.value && (!isNaN(value) && value <= field.min)) {
                errors.set(field.key, field.message);
            }
        });
    }

    validateField(fieldId) {
        const fieldMap = {
            'tourName': 'name',
            'tourType': 'tourType',
            'destination': 'destination',
            'departureDate': 'departureDate',
            'durationDays': 'durationDays',
            'price': 'price',
            'maxParticipants': 'maxParticipants'
        };

        const fieldKey = fieldMap[fieldId];
        const input = document.getElementById(fieldId);
        
        if (!input?.value?.trim()) {
            this.showFieldError(fieldKey, 'Trường này là bắt buộc');
            return false;
        }

        this.clearFieldError(fieldKey);
        return true;
    }

    displayValidationErrors(errors) {
        // Clear previous errors
        document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('error'));

        // Display new errors
        errors.forEach((message, field) => {
            this.showFieldError(field, message);
        });
    }

    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(fieldName + 'Error');
        const inputElement = document.getElementById(fieldName === 'name' ? 'tourName' : fieldName);
        
        if (errorElement) errorElement.textContent = message;
        if (inputElement) inputElement.classList.add('error');
    }

    clearFieldError(fieldName) {
        const errorElement = document.getElementById(fieldName + 'Error');
        const inputElement = document.getElementById(fieldName === 'name' ? 'tourName' : fieldName);
        
        if (errorElement) errorElement.textContent = '';
        if (inputElement) inputElement.classList.remove('error');
    }

    getFormData() {
        const formData = new FormData(this.elements.form);
        
        return {
            name: formData.get('name')?.trim(),
            description: formData.get('description')?.trim(),
            destination: formData.get('destination')?.trim(),
            departureLocation: formData.get('departureLocation')?.trim(),
            departureDate: formData.get('departureDate'),
            returnDate: formData.get('returnDate'),
            durationDays: parseInt(formData.get('durationDays')) || 0,
            price: parseFloat(formData.get('price')) || 0,
            maxParticipants: parseInt(formData.get('maxParticipants')) || 0,
            tourType: formData.get('tourType'),
            status: formData.get('status'),
            itinerary: formData.get('itinerary')?.trim(),
            includes: formData.get('includes')?.trim(),
            excludes: formData.get('excludes')?.trim(),
            termsConditions: formData.get('termsConditions')?.trim(),
            isFeatured: formData.get('isFeatured') === 'on'
        };
    }

    updateButtonStates() {
        const buttons = [
            this.elements.createTourBtn,
            this.elements.createTourBtn2,
            this.elements.saveDraftBtn,
            this.elements.saveDraftBtn2
        ].filter(Boolean);
        
        buttons.forEach(btn => {
            btn.disabled = this.state.isLoading;
            btn.classList.toggle('loading', this.state.isLoading);
        });
    }

    showLoading(show) {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    showImageProcessing(show) {
        // Add visual feedback for image processing
        if (this.elements.imageUploadArea) {
            this.elements.imageUploadArea.classList.toggle('processing', show);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconMap = {
            success: 'checkmark-circle-outline',
            error: 'alert-circle-outline',
            warning: 'warning-outline',
            info: 'information-circle-outline'
        };
        
        toast.innerHTML = `
            <div class="toast-content">
                <ion-icon name="${iconMap[type] || iconMap.info}"></ion-icon>
                <span>${this.escapeHtml(message)}</span>
            </div>
        `;

        document.body.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, this.CONSTANTS.TOAST_DURATION);
    }

    // Utility methods
    debounce(func, wait) {
        return (...args) => {
            const key = func.toString();
            clearTimeout(this.state.debounceTimers.get(key));
            this.state.debounceTimers.set(key, setTimeout(() => func.apply(this, args), wait));
        };
    }

    addEventListener(element, event, handler) {
        if (element && typeof handler === 'function') {
            element.addEventListener(event, handler);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    redirectTo(url) {
        window.location.href = url;
    }

    // Cleanup method
    destroy() {
        // Clear debounce timers
        this.state.debounceTimers.forEach(timer => clearTimeout(timer));
        this.state.debounceTimers.clear();
        
        // Revoke blob URLs to free memory
        this.state.images.forEach(image => {
            if (image.preview) {
                URL.revokeObjectURL(image.preview);
            }
        });
        
        this.state.images = [];
        console.log('AdminTourCreate cleaned up');
    }
}

// Global functions for backward compatibility
window.adminTourCreate = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const initTourCreate = () => {
        if (typeof apiClient !== 'undefined' && apiClient) {
            window.adminTourCreate = new AdminTourCreate();
        } else {
            setTimeout(initTourCreate, 100);
        }
    };
    
    initTourCreate();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.adminTourCreate) {
        window.adminTourCreate.destroy();
    }
});

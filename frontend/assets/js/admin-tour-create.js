// Admin Tour Create Management
class AdminTourCreate {
    constructor() {
        this.isLoading = false;
        this.images = [];
        this.isDraft = false;
        
        this.init();
    }

    async init() {
        console.log('Initializing Admin Tour Create...');
        
        // Check admin authentication
        if (!this.checkAdminAuth()) {
            return;
        }

        // Initialize elements
        this.initializeElements();
        this.bindEvents();
        
        // Set minimum departure date to today
        this.setMinDepartureDate();
        
        console.log('Admin Tour Create initialized successfully');
    }

    checkAdminAuth() {
        if (!apiClient.isAuthenticated()) {
            window.location.href = '../login.html';
            return false;
        }

        const user = apiClient.getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            alert('Bạn không có quyền truy cập trang này!');
            window.location.href = '../index.html';
            return false;
        }

        return true;
    }

    initializeElements() {
        this.form = document.getElementById('tourCreateForm');
        this.createTourBtn = document.getElementById('createTourBtn');
        this.createTourBtn2 = document.getElementById('createTourBtn2');
        this.saveDraftBtn = document.getElementById('saveDraftBtn');
        this.saveDraftBtn2 = document.getElementById('saveDraftBtn2');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        // Image upload elements
        this.imageInput = document.getElementById('imageInput');
        this.imageUploadArea = document.getElementById('imageUploadArea');
        this.imagesPreview = document.getElementById('imagesPreview');
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTour();
        });

        // Create tour buttons
        this.createTourBtn.addEventListener('click', () => this.createTour());
        this.createTourBtn2.addEventListener('click', () => this.createTour());

        // Save draft buttons
        this.saveDraftBtn.addEventListener('click', () => this.saveDraft());
        this.saveDraftBtn2.addEventListener('click', () => this.saveDraft());

        // Image upload
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));

        // Drag and drop for images
        this.imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.imageUploadArea.classList.add('dragover');
        });

        this.imageUploadArea.addEventListener('dragleave', () => {
            this.imageUploadArea.classList.remove('dragover');
        });

        this.imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.imageUploadArea.classList.remove('dragover');
            this.handleImageDrop(e);
        });

        // Date validation
        this.setupDateValidation();

        // Auto-calculate duration
        this.setupDurationCalculation();

        // Form validation on input
        this.setupFormValidation();
    }

    setMinDepartureDate() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const departureDateInput = document.getElementById('departureDate');
        departureDateInput.min = tomorrow.toISOString().split('T')[0];
    }

    setupDateValidation() {
        const departureDate = document.getElementById('departureDate');
        const returnDate = document.getElementById('returnDate');

        departureDate.addEventListener('change', () => {
            if (returnDate.value && returnDate.value <= departureDate.value) {
                returnDate.value = '';
            }
            
            if (departureDate.value) {
                const minReturnDate = new Date(departureDate.value);
                minReturnDate.setDate(minReturnDate.getDate() + 1);
                returnDate.min = minReturnDate.toISOString().split('T')[0];
            }

            this.calculateDuration();
        });

        returnDate.addEventListener('change', () => {
            this.calculateDuration();
        });
    }

    setupDurationCalculation() {
        const durationInput = document.getElementById('durationDays');
        const departureDate = document.getElementById('departureDate');
        const returnDate = document.getElementById('returnDate');

        durationInput.addEventListener('input', () => {
            if (departureDate.value && durationInput.value) {
                const departure = new Date(departureDate.value);
                const returnDateCalc = new Date(departure);
                returnDateCalc.setDate(departure.getDate() + parseInt(durationInput.value) - 1);
                
                returnDate.value = returnDateCalc.toISOString().split('T')[0];
            }
        });
    }

    calculateDuration() {
        const departureDate = document.getElementById('departureDate');
        const returnDate = document.getElementById('returnDate');
        const durationInput = document.getElementById('durationDays');

        if (departureDate.value && returnDate.value) {
            const departure = new Date(departureDate.value);
            const returnD = new Date(returnDate.value);
            const diffTime = Math.abs(returnD - departure);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            durationInput.value = diffDays;
        }
    }

    setupFormValidation() {
        // Real-time validation for required fields
        const requiredFields = ['tourName', 'tourType', 'destination', 'departureDate', 'durationDays', 'price', 'maxParticipants'];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validateField(fieldId));
                field.addEventListener('input', () => this.clearFieldError(fieldId));
            }
        });
    }

    handleImageUpload(event) {
        const files = Array.from(event.target.files);
        this.processImages(files);
    }

    handleImageDrop(event) {
        const files = Array.from(event.dataTransfer.files);
        this.processImages(files);
    }

    processImages(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            this.showToast('Vui lòng chọn file hình ảnh hợp lệ', 'error');
            return;
        }

        imageFiles.forEach(file => {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                this.showToast(`File ${file.name} quá lớn (tối đa 5MB)`, 'error');
                return;
            }

            // Check if file already exists
            const existingFile = this.images.find(img => 
                img.file.name === file.name && img.file.size === file.size
            );
            
            if (existingFile) {
                this.showToast(`File ${file.name} đã được chọn`, 'warning');
                return;
            }

            this.images.push({
                file: file,
                preview: URL.createObjectURL(file),
                id: Date.now() + Math.random()
            });
        });

        this.renderImagePreviews();
        this.clearFieldError('images');
        
        // Clear the file input
        this.imageInput.value = '';
    }

    renderImagePreviews() {
        if (this.images.length === 0) {
            this.imagesPreview.innerHTML = '';
            return;
        }

        const html = this.images.map((image, index) => `
            <div class="image-item" data-id="${image.id}">
                <img src="${image.preview}" alt="${image.file.name}">
                <div class="image-actions">
                    <button type="button" class="btn-icon btn-success" onclick="adminTourCreate.setMainImage('${image.id}')" title="Đặt làm ảnh chính">
                        <ion-icon name="star-outline"></ion-icon>
                    </button>
                    <button type="button" class="btn-icon btn-danger" onclick="adminTourCreate.removeImage('${image.id}')" title="Xóa">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>
                ${index === 0 ? '<div class="main-image-badge">Ảnh chính</div>' : ''}
                <div class="image-name">${image.file.name}</div>
            </div>
        `).join('');

        this.imagesPreview.innerHTML = html;
    }

    setMainImage(imageId) {
        // Find the image and move it to first position
        const imageIndex = this.images.findIndex(img => img.id === imageId);
        if (imageIndex > -1) {
            const [image] = this.images.splice(imageIndex, 1);
            this.images.unshift(image);
            this.renderImagePreviews();
            this.showToast('Đã đặt làm ảnh chính', 'success');
        }
    }

    removeImage(imageId) {
        // Remove image from array
        this.images = this.images.filter(img => img.id !== imageId);
        
        // Revoke the blob URL to free memory
        const imageToRemove = this.images.find(img => img.id === imageId);
        if (imageToRemove) {
            URL.revokeObjectURL(imageToRemove.preview);
        }
        
        this.renderImagePreviews();
        this.clearFieldError('images');
    }

    async saveDraft() {
        this.isDraft = true;
        await this.submitForm('DRAFT');
    }

    async createTour() {
        this.isDraft = false;
        const statusSelect = document.getElementById('status');
        const status = statusSelect.value || 'ACTIVE';
        await this.submitForm(status);
    }

    async submitForm(status = 'ACTIVE') {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            this.updateButtonStates();
            this.showLoading(true);

            // Validate form
            if (!this.isDraft && !this.validateForm()) {
                return;
            }

            // Get form data
            const formData = this.getFormData();
            formData.status = status;

            // Create tour
            console.log('Creating tour with data:', formData);
            const createdTour = await apiClient.createTour(formData);

            // Upload images if any
            if (this.images.length > 0) {
                try {
                    const imageFiles = this.images.map(img => img.file);
                    await apiClient.uploadTourImages(createdTour.id, imageFiles);
                    
                    // Set the first image as main image after upload
                    if (imageFiles.length > 0) {
                        // Wait a bit for images to be processed
                        setTimeout(async () => {
                            try {
                                // Get the updated tour to get the uploaded image URLs
                                const updatedTour = await apiClient.getTour(createdTour.id);
                                if (updatedTour.imageUrls && updatedTour.imageUrls.length > 0) {
                                    // Set first image as main
                                    await apiClient.setMainImage(createdTour.id, updatedTour.imageUrls[0]);
                                }
                            } catch (error) {
                                console.error('Error setting main image:', error);
                            }
                        }, 1000);
                    }
                } catch (error) {
                    console.error('Error uploading images:', error);
                    this.showToast('Tour đã được tạo nhưng có lỗi khi tải ảnh lên', 'warning');
                }
            }

            const actionText = this.isDraft ? 'lưu nháp' : 'tạo';
            this.showToast(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} tour thành công!`, 'success');

            // Redirect to tour list or edit page
            setTimeout(() => {
                window.location.href = this.isDraft ? 'tours.html' : `tour-edit.html?id=${createdTour.id}`;
            }, 1500);

        } catch (error) {
            console.error('Error creating tour:', error);
            const actionText = this.isDraft ? 'lưu nháp' : 'tạo';
            this.showToast(`Có lỗi khi ${actionText} tour: ` + error.message, 'error');
        } finally {
            this.isLoading = false;
            this.updateButtonStates();
            this.showLoading(false);
        }
    }

    validateForm() {
        let isValid = true;
        const errors = {};

        // Required fields validation
        const requiredFields = [
            { id: 'tourName', name: 'name', message: 'Tên tour là bắt buộc' },
            { id: 'tourType', name: 'tourType', message: 'Loại tour là bắt buộc' },
            { id: 'destination', name: 'destination', message: 'Điểm đến là bắt buộc' },
            { id: 'departureDate', name: 'departureDate', message: 'Ngày khởi hành là bắt buộc' },
            { id: 'durationDays', name: 'durationDays', message: 'Số ngày tour là bắt buộc' },
            { id: 'price', name: 'price', message: 'Giá tour là bắt buộc' },
            { id: 'maxParticipants', name: 'maxParticipants', message: 'Số người tối đa là bắt buộc' }
        ];

        requiredFields.forEach(field => {
            const input = document.getElementById(field.id);
            if (!input.value.trim()) {
                errors[field.name] = field.message;
                isValid = false;
            }
        });

        // Price validation
        const price = document.getElementById('price');
        if (price.value && parseInt(price.value) <= 0) {
            errors.price = 'Giá tour phải lớn hơn 0';
            isValid = false;
        }

        // Max participants validation
        const maxParticipants = document.getElementById('maxParticipants');
        if (maxParticipants.value && parseInt(maxParticipants.value) <= 0) {
            errors.maxParticipants = 'Số người tối đa phải lớn hơn 0';
            isValid = false;
        }

        // Duration validation
        const durationDays = document.getElementById('durationDays');
        if (durationDays.value && parseInt(durationDays.value) <= 0) {
            errors.durationDays = 'Số ngày tour phải lớn hơn 0';
            isValid = false;
        }

        // Date validation
        const departureDate = document.getElementById('departureDate');
        const returnDate = document.getElementById('returnDate');
        if (departureDate.value && returnDate.value) {
            if (new Date(returnDate.value) <= new Date(departureDate.value)) {
                errors.returnDate = 'Ngày kết thúc phải sau ngày khởi hành';
                isValid = false;
            }
        }

        // Departure date must be in future
        if (departureDate.value) {
            const departure = new Date(departureDate.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (departure <= today) {
                errors.departureDate = 'Ngày khởi hành phải là ngày trong tương lai';
                isValid = false;
            }
        }

        // Display errors
        this.displayValidationErrors(errors);

        return isValid;
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

        const fieldName = fieldMap[fieldId];
        const input = document.getElementById(fieldId);
        
        if (!input.value.trim()) {
            this.showFieldError(fieldName, 'Trường này là bắt buộc');
            return false;
        }

        this.clearFieldError(fieldName);
        return true;
    }

    displayValidationErrors(errors) {
        // Clear previous errors
        document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('error'));

        // Display new errors
        Object.keys(errors).forEach(field => {
            this.showFieldError(field, errors[field]);
        });
    }

    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(fieldName + 'Error');
        const inputElement = document.getElementById(fieldName === 'name' ? 'tourName' : fieldName);
        
        if (errorElement) {
            errorElement.textContent = message;
        }
        if (inputElement) {
            inputElement.classList.add('error');
        }
    }

    clearFieldError(fieldName) {
        const errorElement = document.getElementById(fieldName + 'Error');
        const inputElement = document.getElementById(fieldName === 'name' ? 'tourName' : fieldName);
        
        if (errorElement) {
            errorElement.textContent = '';
        }
        if (inputElement) {
            inputElement.classList.remove('error');
        }
    }

    getFormData() {
        const formData = new FormData(this.form);
        
        return {
            name: formData.get('name'),
            description: formData.get('description'),
            destination: formData.get('destination'),
            departureLocation: formData.get('departureLocation'),
            departureDate: formData.get('departureDate'),
            returnDate: formData.get('returnDate'),
            durationDays: parseInt(formData.get('durationDays')),
            price: parseFloat(formData.get('price')),
            maxParticipants: parseInt(formData.get('maxParticipants')),
            tourType: formData.get('tourType'),
            status: formData.get('status'),
            itinerary: formData.get('itinerary'),
            includes: formData.get('includes'),
            excludes: formData.get('excludes'),
            termsConditions: formData.get('termsConditions'),
            isFeatured: formData.get('isFeatured') === 'on'
        };
    }

    updateButtonStates() {
        const buttons = [this.createTourBtn, this.createTourBtn2, this.saveDraftBtn, this.saveDraftBtn2];
        
        buttons.forEach(btn => {
            if (btn) {
                btn.disabled = this.isLoading;
                btn.classList.toggle('loading', this.isLoading);
            }
        });
    }

    showLoading(show) {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <ion-icon name="${type === 'success' ? 'checkmark-circle-outline' : type === 'error' ? 'alert-circle-outline' : 'information-circle-outline'}"></ion-icon>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for API client to be available
    const initTourCreate = () => {
        if (typeof apiClient !== 'undefined' && apiClient) {
            window.adminTourCreate = new AdminTourCreate();
        } else {
            setTimeout(initTourCreate, 100);
        }
    };
    
    initTourCreate();
});

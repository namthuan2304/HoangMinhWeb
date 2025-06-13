// Admin Tour Edit Management
class AdminTourEdit {
    constructor() {
        this.tourId = null;
        this.tour = null;
        this.isLoading = false;
        this.hasChanges = false;
        this.existingImages = [];
        this.newImages = [];
        this.imagesToDelete = [];
        
        this.init();
    }

    async init() {
        console.log('Initializing Admin Tour Edit...');
        
        // Check admin authentication
        if (!this.checkAdminAuth()) {
            return;
        }

        // Get tour ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.tourId = urlParams.get('id');
        
        if (!this.tourId) {
            this.showError('Không tìm thấy thông tin tour');
            return;
        }

        // Initialize elements
        this.initializeElements();
        this.bindEvents();
        
        // Load tour data
        await this.loadTourData();
        
        console.log('Admin Tour Edit initialized successfully');
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
        this.wrapper = document.getElementById('tourEditWrapper');
        this.saveTourBtn = document.getElementById('saveTourBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        // Save button
        if (this.saveTourBtn) {
            this.saveTourBtn.addEventListener('click', () => this.saveTour());
        }

        // Prevent navigation when there are unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.hasChanges) {
                e.preventDefault();
                e.returnValue = 'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang?';
            }
        });
    }    async loadTourData() {
        this.showLoading(true);
        
        try {
            this.tour = await apiClient.getTour(this.tourId);
              // Combine mainImageUrl and imageUrls properly
            this.existingImages = [];
            
            // Priority 1: Add mainImageUrl first if it exists
            if (this.tour.mainImageUrl) {
                this.existingImages.push(this.tour.mainImageUrl);
            }
            
            // Priority 2: Add other images from imageUrls, excluding mainImageUrl to avoid duplicates
            if (this.tour.imageUrls && this.tour.imageUrls.length > 0) {
                const otherImages = this.tour.imageUrls.filter(url => url !== this.tour.mainImageUrl);
                this.existingImages.push(...otherImages);
            }
            
            // If no mainImageUrl but have imageUrls, set first imageUrl as main
            if (!this.tour.mainImageUrl && this.tour.imageUrls && this.tour.imageUrls.length > 0) {
                this.tour.mainImageUrl = this.tour.imageUrls[0];
            }              console.log('Loaded tour images:', {
                mainImageUrl: this.tour.mainImageUrl,
                imageUrls: this.tour.imageUrls,
                existingImages: this.existingImages
            });
            
            // Debug tour images to verify proper handling of mainImageUrl
            this.debugTourImages();
            
            this.renderTourEditForm();
        } catch (error) {
            console.error('Error loading tour data:', error);
            this.showError('Có lỗi khi tải thông tin tour');
        } finally {
            this.showLoading(false);
        }
    }

    renderTourEditForm() {
        if (!this.tour) {
            this.showError('Không tìm thấy thông tin tour');
            return;
        }

        const html = `
            <form id="tourEditForm" class="tour-form">
                <!-- Tour Status Card -->
                <div class="form-card">
                    <div class="card-header">
                        <h3>
                            <ion-icon name="information-circle-outline"></ion-icon>
                            Trạng thái Tour
                        </h3>
                    </div>
                    <div class="card-content">
                        <div class="status-info">
                            <div class="status-badge">
                                <span class="badge badge-${this.getStatusColor(this.tour.status)}">
                                    ${this.getStatusText(this.tour.status)}
                                </span>
                            </div>
                            <div class="tour-meta">
                                <p><strong>ID:</strong> ${this.tour.id}</p>
                                <p><strong>Ngày tạo:</strong> ${this.formatDateTime(this.tour.createdAt)}</p>
                                <p><strong>Cập nhật lần cuối:</strong> ${this.formatDateTime(this.tour.updatedAt)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Basic Information -->
                <div class="form-card">
                    <div class="card-header">
                        <h3>
                            <ion-icon name="document-text-outline"></ion-icon>
                            Thông tin cơ bản
                        </h3>
                    </div>
                    <div class="card-content">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="tourName">Tên tour <span class="required">*</span></label>
                                <input type="text" id="tourName" name="name" class="form-input" 
                                       value="${this.tour.name || ''}" required>
                                <div class="form-error" id="nameError"></div>
                            </div>

                            <div class="form-group">
                                <label for="tourType">Loại tour <span class="required">*</span></label>
                                <select id="tourType" name="tourType" class="form-select" required>
                                    <option value="">Chọn loại tour</option>
                                    <option value="DOMESTIC" ${this.tour.tourType === 'DOMESTIC' ? 'selected' : ''}>Tour trong nước</option>
                                    <option value="INTERNATIONAL" ${this.tour.tourType === 'INTERNATIONAL' ? 'selected' : ''}>Tour quốc tế</option>
                                    <option value="ADVENTURE" ${this.tour.tourType === 'ADVENTURE' ? 'selected' : ''}>Tour phiêu lưu</option>
                                    <option value="CULTURAL" ${this.tour.tourType === 'CULTURAL' ? 'selected' : ''}>Tour văn hóa</option>
                                </select>
                                <div class="form-error" id="tourTypeError"></div>
                            </div>

                            <div class="form-group full-width">
                                <label for="description">Mô tả tour</label>
                                <textarea id="description" name="description" class="form-textarea" rows="4"
                                         placeholder="Nhập mô tả chi tiết về tour...">${this.tour.description || ''}</textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Location and Schedule -->
                <div class="form-card">
                    <div class="card-header">
                        <h3>
                            <ion-icon name="location-outline"></ion-icon>
                            Địa điểm và Lịch trình
                        </h3>
                    </div>
                    <div class="card-content">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="destination">Điểm đến <span class="required">*</span></label>
                                <input type="text" id="destination" name="destination" class="form-input" 
                                       value="${this.tour.destination || ''}" required>
                                <div class="form-error" id="destinationError"></div>
                            </div>

                            <div class="form-group">
                                <label for="departureLocation">Điểm khởi hành</label>
                                <input type="text" id="departureLocation" name="departureLocation" class="form-input" 
                                       value="${this.tour.departureLocation || ''}">
                            </div>

                            <div class="form-group">
                                <label for="departureDate">Ngày khởi hành <span class="required">*</span></label>
                                <input type="date" id="departureDate" name="departureDate" class="form-input" 
                                       value="${this.tour.departureDate || ''}" required>
                                <div class="form-error" id="departureDateError"></div>
                            </div>

                            <div class="form-group">
                                <label for="returnDate">Ngày kết thúc</label>
                                <input type="date" id="returnDate" name="returnDate" class="form-input" 
                                       value="${this.tour.returnDate || ''}">
                            </div>

                            <div class="form-group">
                                <label for="durationDays">Số ngày <span class="required">*</span></label>
                                <input type="number" id="durationDays" name="durationDays" class="form-input" 
                                       value="${this.tour.durationDays || ''}" min="1" required>
                                <div class="form-error" id="durationDaysError"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pricing and Capacity -->
                <div class="form-card">
                    <div class="card-header">
                        <h3>
                            <ion-icon name="cash-outline"></ion-icon>
                            Giá cả và Sức chứa
                        </h3>
                    </div>
                    <div class="card-content">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="price">Giá tour (VNĐ) <span class="required">*</span></label>
                                <input type="number" id="price" name="price" class="form-input" 
                                       value="${this.tour.price || ''}" min="0" step="1000" required>
                                <div class="form-error" id="priceError"></div>
                            </div>

                            <div class="form-group">
                                <label for="maxParticipants">Số người tối đa <span class="required">*</span></label>
                                <input type="number" id="maxParticipants" name="maxParticipants" class="form-input" 
                                       value="${this.tour.maxParticipants || ''}" min="1" required>
                                <div class="form-error" id="maxParticipantsError"></div>
                            </div>                            <div class="form-group">
                                <label for="status">Trạng thái tour</label>
                                <select id="status" name="status" class="form-select">
                                    <option value="ACTIVE" ${this.tour.status === 'ACTIVE' ? 'selected' : ''}>Hoạt động</option>
                                    <option value="INACTIVE" ${this.tour.status === 'INACTIVE' ? 'selected' : ''}>Ngừng hoạt động</option>
                                    <option value="CANCELLED" ${this.tour.status === 'CANCELLED' ? 'selected' : ''}>Đã hủy</option>
                                    <option value="COMPLETED" ${this.tour.status === 'COMPLETED' ? 'selected' : ''}>Hoàn thành</option>
                                    <option value="FULL" ${this.tour.status === 'FULL' ? 'selected' : ''}>Đã đầy</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="isFeatured" name="isFeatured" ${this.tour.isFeatured ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Tour nổi bật
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Detailed Information -->
                <div class="form-card">
                    <div class="card-header">
                        <h3>
                            <ion-icon name="list-outline"></ion-icon>
                            Thông tin chi tiết
                        </h3>
                    </div>
                    <div class="card-content">
                        <div class="form-group">
                            <label for="itinerary">Lịch trình tour</label>
                            <textarea id="itinerary" name="itinerary" class="form-textarea" rows="6"
                                     placeholder="Nhập lịch trình chi tiết theo từng ngày...">${this.tour.itinerary || ''}</textarea>
                        </div>

                        <div class="form-group">
                            <label for="includes">Bao gồm</label>
                            <textarea id="includes" name="includes" class="form-textarea" rows="3"
                                     placeholder="Các dịch vụ được bao gồm trong tour...">${this.tour.includes || ''}</textarea>
                        </div>

                        <div class="form-group">
                            <label for="excludes">Không bao gồm</label>
                            <textarea id="excludes" name="excludes" class="form-textarea" rows="3"
                                     placeholder="Các dịch vụ không được bao gồm trong tour...">${this.tour.excludes || ''}</textarea>
                        </div>

                        <div class="form-group">
                            <label for="termsConditions">Điều khoản và điều kiện</label>
                            <textarea id="termsConditions" name="termsConditions" class="form-textarea" rows="4"
                                     placeholder="Các điều khoản và điều kiện của tour...">${this.tour.termsConditions || ''}</textarea>
                        </div>
                    </div>
                </div>

                <!-- Images Management -->
                <div class="form-card">
                    <div class="card-header">
                        <h3>
                            <ion-icon name="image-outline"></ion-icon>
                            Quản lý hình ảnh
                        </h3>
                    </div>
                    <div class="card-content">
                        <!-- Current Images -->
                        <div class="existing-images-section">
                            <h4>Hình ảnh hiện tại</h4>
                            <div class="images-grid" id="existingImagesGrid">
                                ${this.renderExistingImages()}
                            </div>
                        </div>

                        <!-- Upload New Images -->
                        <div class="new-images-section">
                            <h4>Thêm hình ảnh mới</h4>
                            <div class="upload-area" id="imageUploadArea">
                                <input type="file" id="imageInput" multiple accept="image/*" style="display: none;">
                                <div class="upload-placeholder" onclick="document.getElementById('imageInput').click()">
                                    <ion-icon name="cloud-upload-outline"></ion-icon>
                                    <p>Nhấp để chọn hình ảnh hoặc kéo thả vào đây</p>
                                    <small>Hỗ trợ: JPG, PNG, GIF (tối đa 5MB mỗi file)</small>
                                </div>
                            </div>
                            <div class="new-images-preview" id="newImagesPreview"></div>
                        </div>
                    </div>
                </div>
            </form>
        `;

        this.wrapper.innerHTML = html;
        this.bindFormEvents();
    }

    bindFormEvents() {
        // Form change tracking
        const form = document.getElementById('tourEditForm');
        if (form) {
            form.addEventListener('input', () => {
                this.hasChanges = true;
                this.updateSaveButtonState();
            });

            form.addEventListener('change', () => {
                this.hasChanges = true;
                this.updateSaveButtonState();
            });
        }

        // Image upload
        const imageInput = document.getElementById('imageInput');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }

        // Drag and drop for images
        const uploadArea = document.getElementById('imageUploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                this.handleImageDrop(e);
            });
        }

        // Date validation
        this.setupDateValidation();
    }

    setupDateValidation() {
        const departureDate = document.getElementById('departureDate');
        const returnDate = document.getElementById('returnDate');

        if (departureDate && returnDate) {
            departureDate.addEventListener('change', () => {
                if (returnDate.value && returnDate.value < departureDate.value) {
                    returnDate.value = '';
                }
                returnDate.min = departureDate.value;
            });

            returnDate.addEventListener('change', () => {
                if (departureDate.value && returnDate.value) {
                    const departure = new Date(departureDate.value);
                    const returnD = new Date(returnDate.value);
                    if (returnD <= departure) {
                        this.showToast('Ngày kết thúc phải sau ngày khởi hành', 'error');
                        returnDate.value = '';
                    }
                }
            });
        }
    }

    handleImageUpload(event) {
        const files = Array.from(event.target.files);
        this.processNewImages(files);
    }

    handleImageDrop(event) {
        const files = Array.from(event.dataTransfer.files);
        this.processNewImages(files);
    }

    removeNewImage(fileName) {
        this.newImages = this.newImages.filter(file => file.name !== fileName);
        
        // Remove from preview
        const preview = document.getElementById('newImagesPreview');
        if (preview) {
            const items = preview.querySelectorAll('.image-item.new');
            items.forEach(item => {
                if (item.querySelector('.image-name') && item.querySelector('.image-name').textContent === fileName) {
                    item.remove();
                }
            });
        }
        
        this.hasChanges = true;
        this.updateSaveButtonState();
    }    renderExistingImages() {
        if (!this.existingImages || this.existingImages.length === 0) {
            return '<p class="no-images">Chưa có hình ảnh nào</p>';
        }

        return this.existingImages.map((imageUrl, index) => {
            // Check if this is the main image - prioritize mainImageUrl from backend
            const isMainImage = (this.tour.mainImageUrl && imageUrl === this.tour.mainImageUrl) || 
                               (!this.tour.mainImageUrl && index === 0);
            
            return `
                <div class="image-item existing" data-url="${imageUrl}">
                    <img src="${apiClient.getFullImageUrl(imageUrl)}" alt="Tour image ${index + 1}">
                    <div class="image-actions">
                        <button type="button" class="btn-icon ${isMainImage ? 'btn-warning' : 'btn-success'}" 
                                onclick="adminTourEdit.setMainImage('${imageUrl}')" 
                                title="${isMainImage ? 'Ảnh chính hiện tại' : 'Đặt làm ảnh chính'}">
                            <ion-icon name="${isMainImage ? 'star' : 'star-outline'}"></ion-icon>
                        </button>
                        <button type="button" class="btn-icon btn-danger" onclick="adminTourEdit.removeExistingImage('${imageUrl}')" title="Xóa">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                    ${isMainImage ? '<div class="main-image-badge">Ảnh chính</div>' : ''}
                </div>
            `;
        }).join('');
    }    removeExistingImage(imageUrl) {
        if (confirm('Bạn có chắc chắn muốn xóa hình ảnh này?')) {
            // Check if this is the main image being deleted
            const isMainImage = imageUrl === this.tour.mainImageUrl;
            
            // Add to deletion list
            if (!this.imagesToDelete.includes(imageUrl)) {
                this.imagesToDelete.push(imageUrl);
            }
            
            // Remove from existing images display
            this.existingImages = this.existingImages.filter(url => url !== imageUrl);
            
            // If we deleted the main image, update mainImageUrl to the next available image
            if (isMainImage) {
                this.tour.mainImageUrl = this.existingImages.length > 0 ? this.existingImages[0] : null;
                console.log('Deleted main image, new main image:', this.tour.mainImageUrl);
            }
            
            // Re-render existing images
            const grid = document.getElementById('existingImagesGrid');
            if (grid) {
                grid.innerHTML = this.renderExistingImages();
            }
            
            this.hasChanges = true;
            this.updateSaveButtonState();
            
            if (isMainImage && this.existingImages.length > 0) {
                this.showToast('Đã xóa ảnh chính và đặt ảnh tiếp theo làm ảnh chính mới. Nhấn "Lưu thay đổi" để hoàn tất.', 'info');
            } else {
                this.showToast('Đã đánh dấu ảnh để xóa. Nhấn "Lưu thay đổi" để hoàn tất.', 'info');
            }
        }
    }setMainImage(imageUrl) {
        // Update the tour's mainImageUrl property
        this.tour.mainImageUrl = imageUrl;
        
        // Move the selected image to the first position in existingImages
        this.existingImages = this.existingImages.filter(url => url !== imageUrl);
        this.existingImages.unshift(imageUrl);
        
        // Re-render existing images to show updated main image status
        const grid = document.getElementById('existingImagesGrid');
        if (grid) {
            grid.innerHTML = this.renderExistingImages();
        }
        
        this.hasChanges = true;
        this.updateSaveButtonState();
        
        this.showToast('Đã đặt làm ảnh chính. Nhấn "Lưu thay đổi" để hoàn tất.', 'success');
    }

    processNewImages(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            this.showToast('Vui lòng chọn file hình ảnh hợp lệ', 'error');
            return;
        }

        imageFiles.forEach(file => {
            if (file.size > 5 * 1024 * 1024) // 5MB limit
            {
                this.showToast(`File ${file.name} quá lớn (tối đa 5MB)`, 'error');
                return;
            }

            // Check if file already exists
            const existingFile = this.newImages.find(existingFile => 
                existingFile.name === file.name && existingFile.size === file.size
            );
            
            if (existingFile) {
                this.showToast(`File ${file.name} đã được chọn`, 'warning');
                return;
            }

            this.newImages.push(file);
            this.renderNewImagePreview(file);
        });

        this.hasChanges = true;
        this.updateSaveButtonState();
        
        // Clear the file input to allow selecting the same file again if needed
        const fileInput = document.getElementById('imageInput');
        if (fileInput) {
            fileInput.value = '';
        }
    }

    renderNewImagePreview(file) {
        const preview = document.getElementById('newImagesPreview');
        if (!preview) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item new';
            imageItem.dataset.fileName = file.name;
            imageItem.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <div class="image-actions">
                    <button type="button" class="btn-icon btn-success" onclick="adminTourEdit.setMainNewImage('${file.name}')" title="Đặt làm ảnh chính">
                        <ion-icon name="star-outline"></ion-icon>
                    </button>
                    <button type="button" class="btn-icon btn-danger" onclick="adminTourEdit.removeNewImage('${file.name}')" title="Xóa">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>
                <div class="image-name">${file.name}</div>
            `;
            preview.appendChild(imageItem);
        };
        reader.readAsDataURL(file);
    }

    setMainNewImage(fileName) {
        // Find the file and move it to first position
        const fileIndex = this.newImages.findIndex(file => file.name === fileName);
        if (fileIndex > -1) {
            const [file] = this.newImages.splice(fileIndex, 1);
            this.newImages.unshift(file);
            
            // Re-render preview
            this.renderAllNewImagePreviews();
            
            this.hasChanges = true;
            this.updateSaveButtonState();
            
            this.showToast('Đã đặt làm ảnh chính cho ảnh mới', 'success');
        }
    }

    renderAllNewImagePreviews() {
        const preview = document.getElementById('newImagesPreview');
        if (!preview) return;
        
        preview.innerHTML = '';
        this.newImages.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item new';
                imageItem.dataset.fileName = file.name;
                imageItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <div class="image-actions">
                        <button type="button" class="btn-icon btn-success" onclick="adminTourEdit.setMainNewImage('${file.name}')" title="Đặt làm ảnh chính">
                            <ion-icon name="star-outline"></ion-icon>
                        </button>
                        <button type="button" class="btn-icon btn-danger" onclick="adminTourEdit.removeNewImage('${file.name}')" title="Xóa">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                    ${index === 0 ? '<div class="main-image-badge">Ảnh chính mới</div>' : ''}
                    <div class="image-name">${file.name}</div>
                `;
                preview.appendChild(imageItem);
            };
            reader.readAsDataURL(file);
        });
    }

    async saveTour() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            this.updateSaveButtonState();
            this.showLoading(true);

            // Validate form
            if (!this.validateForm()) {
                return;
            }

            // Get form data
            const formData = this.getFormData();

            // Update tour basic information first
            console.log('Updating tour basic information...');
            const updatedTour = await apiClient.updateTour(this.tourId, formData);

            // Handle image deletions first
            if (this.imagesToDelete.length > 0) {
                console.log('Deleting images:', this.imagesToDelete);
                for (const imageUrl of this.imagesToDelete) {
                    try {
                        await apiClient.deleteTourImage(this.tourId, imageUrl);
                        console.log('Successfully deleted image:', imageUrl);
                    } catch (error) {
                        console.error('Error deleting image:', imageUrl, error);
                        // Continue with other deletions even if one fails
                    }
                }
                this.imagesToDelete = []; // Clear the deletion list
            }

            // Upload new images
            if (this.newImages.length > 0) {
                console.log('Uploading new images:', this.newImages.length, 'files');
                try {
                    await apiClient.uploadTourImages(this.tourId, this.newImages);
                    this.newImages = []; // Clear the new images list
                    
                    // Clear the preview
                    const preview = document.getElementById('newImagesPreview');
                    if (preview) {
                        preview.innerHTML = '';
                    }
                } catch (error) {
                    console.error('Error uploading images:', error);
                    this.showToast('Cập nhật tour thành công, nhưng có lỗi khi tải ảnh lên: ' + error.message, 'warning');
                }
            }            // Update main image if needed
            if (this.existingImages.length > 0) {
                try {
                    // Use the first image in existingImages as main image
                    const mainImageUrl = this.existingImages[0];
                    console.log('Setting main image to:', mainImageUrl);
                    await apiClient.setMainImage(this.tourId, mainImageUrl);
                    
                    // Update tour object with new main image
                    this.tour.mainImageUrl = mainImageUrl;
                    
                } catch (error) {
                    console.error('Error setting main image:', error);
                    this.showToast('Cập nhật thành công nhưng có lỗi khi đặt ảnh chính: ' + error.message, 'warning');
                }
            }

            this.showToast('Cập nhật tour thành công!', 'success');
            this.hasChanges = false;
            this.updateSaveButtonState();

            // Reload tour data to show updated images
            setTimeout(() => {
                this.loadTourData();
            }, 1500);

        } catch (error) {
            console.error('Error saving tour:', error);
            this.showToast('Có lỗi khi lưu tour: ' + error.message, 'error');
        } finally {
            this.isLoading = false;
            this.updateSaveButtonState();
            this.showLoading(false);
        }
    }

    validateForm() {
        let isValid = true;
        const errors = {};

        // Required fields
        const requiredFields = ['name', 'tourType', 'destination', 'departureDate', 'durationDays', 'price', 'maxParticipants'];
        
        requiredFields.forEach(field => {
            const input = document.getElementById(field === 'name' ? 'tourName' : field);
            if (input && !input.value.trim()) {
                errors[field] = 'Trường này là bắt buộc';
                isValid = false;
            }
        });

        // Price validation
        const price = document.getElementById('price');
        if (price && price.value && parseInt(price.value) <= 0) {
            errors.price = 'Giá tour phải lớn hơn 0';
            isValid = false;
        }

        // Max participants validation
        const maxParticipants = document.getElementById('maxParticipants');
        if (maxParticipants && maxParticipants.value && parseInt(maxParticipants.value) <= 0) {
            errors.maxParticipants = 'Số người tối đa phải lớn hơn 0';
            isValid = false;
        }

        // Duration validation
        const durationDays = document.getElementById('durationDays');
        if (durationDays && durationDays.value && parseInt(durationDays.value) <= 0) {
            errors.durationDays = 'Số ngày tour phải lớn hơn 0';
            isValid = false;
        }

        // Date validation
        const departureDate = document.getElementById('departureDate');
        const returnDate = document.getElementById('returnDate');
        if (departureDate && returnDate && departureDate.value && returnDate.value) {
            if (new Date(returnDate.value) <= new Date(departureDate.value)) {
                errors.returnDate = 'Ngày kết thúc phải sau ngày khởi hành';
                isValid = false;
            }
        }

        // Display errors
        this.displayValidationErrors(errors);

        return isValid;
    }

    displayValidationErrors(errors) {
        // Clear previous errors
        document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('error'));

        // Display new errors
        Object.keys(errors).forEach(field => {
            const errorElement = document.getElementById(field + 'Error');
            const inputElement = document.getElementById(field === 'name' ? 'tourName' : field);
            
            if (errorElement) {
                errorElement.textContent = errors[field];
            }
            if (inputElement) {
                inputElement.classList.add('error');
            }
        });
    }

    getFormData() {
        const form = document.getElementById('tourEditForm');
        const formData = new FormData(form);
        
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

    updateSaveButtonState() {
        if (this.saveTourBtn) {
            this.saveTourBtn.disabled = this.isLoading || !this.hasChanges;
            this.saveTourBtn.classList.toggle('loading', this.isLoading);
        }
    }    // Utility methods
    getStatusColor(status) {
        const colors = {
            'ACTIVE': 'success',
            'INACTIVE': 'warning',
            'CANCELLED': 'danger',
            'COMPLETED': 'info',
            'FULL': 'primary'
        };
        return colors[status] || 'secondary';
    }

    getStatusText(status) {
        const texts = {
            'ACTIVE': 'Hoạt động',
            'INACTIVE': 'Ngừng hoạt động',
            'CANCELLED': 'Đã hủy',
            'COMPLETED': 'Hoàn thành',
            'FULL': 'Đã đầy'
        };
        return texts[status] || status;
    }

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    }

    showError(message) {
        if (this.wrapper) {
            this.wrapper.innerHTML = `
                <div class="error-state">
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <h3>Có lỗi xảy ra</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="history.back()">
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Quay lại</span>
                    </button>
                </div>
            `;
        }
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
    }    // Debug method for images
    debugTourImages() {
        console.log('=== Tour Image Debug Info ===');
        console.log('Tour ID:', this.tourId);
        console.log('Tour name:', this.tour?.name);
        console.log('Backend mainImageUrl:', this.tour?.mainImageUrl);
        console.log('Backend imageUrls:', this.tour?.imageUrls);
        console.log('Processed existingImages:', this.existingImages);
        console.log('New images to upload:', this.newImages.map(img => img.name));
        console.log('Images to delete:', this.imagesToDelete);
        
        // Check which image should be considered main
        const expectedMainImage = this.tour?.mainImageUrl || this.existingImages[0];
        console.log('Expected main image:', expectedMainImage);
        console.log('===========================');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for API client to be available
    const initTourEdit = () => {
        if (typeof apiClient !== 'undefined' && apiClient) {
            window.adminTourEdit = new AdminTourEdit();
        } else {
            setTimeout(initTourEdit, 100);
        }
    };
    
    initTourEdit();
});

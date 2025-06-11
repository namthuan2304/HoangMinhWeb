// Admin Article Create JavaScript

class AdminArticleCreate {
    constructor() {
        this.quill = null;
        this.selectedTours = new Set();
        this.tags = new Set();
        this.featuredImageFile = null;
        this.isFormDirty = false;
        
        this.init();
    }

    init() {
        this.initQuillEditor();
        this.bindEvents();
        this.loadTours();
    }

    initQuillEditor() {
        const toolbarOptions = [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean']
        ];

        this.quill = new Quill('#contentEditor', {
            theme: 'snow',
            modules: {
                toolbar: toolbarOptions
            },
            placeholder: 'Nhập nội dung bài viết...'
        });

        // Sync with hidden textarea
        this.quill.on('text-change', () => {
            document.getElementById('content').value = this.quill.root.innerHTML;
            this.markFormDirty();
        });
    }

    bindEvents() {
        // Form events
        document.getElementById('title').addEventListener('input', () => {
            this.generateSlug();
            this.markFormDirty();
        });

        document.getElementById('summary').addEventListener('input', () => this.markFormDirty());

        // Meta fields
        document.getElementById('metaTitle').addEventListener('input', () => this.markFormDirty());
        document.getElementById('metaDescription').addEventListener('input', () => this.markFormDirty());
        document.getElementById('metaKeywords').addEventListener('input', () => this.markFormDirty());

        // Action buttons
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        document.getElementById('saveDraftBtn').addEventListener('click', () => this.saveDraft());
        document.getElementById('publishBtn').addEventListener('click', () => this.publishArticle());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewArticle());
        document.getElementById('clearFormBtn').addEventListener('click', () => this.clearForm());

        // Image upload
        document.getElementById('selectImageBtn').addEventListener('click', () => {
            document.getElementById('featuredImage').click();
        });

        document.getElementById('featuredImage').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        document.getElementById('removeImageBtn').addEventListener('click', () => {
            this.removeFeaturedImage();
        });

        document.getElementById('imagePreview').addEventListener('click', () => {
            if (!this.featuredImageFile) {
                document.getElementById('featuredImage').click();
            }
        });

        // Tags input
        document.getElementById('tagsInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTag();
            }
        });

        // Tours search
        document.getElementById('toursSearch').addEventListener('input', 
            this.debounce(() => this.searchTours(), 300));

        document.getElementById('toursSearch').addEventListener('focus', () => {
            this.showToursDropdown();
        });

        document.getElementById('toursSearch').addEventListener('blur', () => {
            setTimeout(() => this.hideToursDropdown(), 200);
        });

        // Section toggles
        document.querySelectorAll('.section-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => this.toggleSection(e.target));
        });

        // Before unload warning
        window.addEventListener('beforeunload', (e) => {
            if (this.isFormDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Tours modal events
        this.bindToursModalEvents();
    }

    bindToursModalEvents() {
        const modal = document.getElementById('toursModal');
        const closeBtn = document.getElementById('toursModalClose');
        const cancelBtn = document.getElementById('closeToursModal');
        const confirmBtn = document.getElementById('confirmToursSelection');
        const searchInput = document.getElementById('modalToursSearch');

        closeBtn.addEventListener('click', () => this.hideModal('toursModal'));
        cancelBtn.addEventListener('click', () => this.hideModal('toursModal'));
        confirmBtn.addEventListener('click', () => this.confirmToursSelection());
        
        searchInput.addEventListener('input', 
            this.debounce(() => this.searchToursInModal(), 300));
    }

    generateSlug() {
        const title = document.getElementById('title').value;
        if (title) {
            const slug = this.createSlug(title);
            document.getElementById('slug').value = slug;
        }
    }

    createSlug(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    handleImageUpload(file) {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showToast('Vui lòng chọn file hình ảnh', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showToast('Kích thước file không được vượt quá 5MB', 'error');
            return;
        }

        this.featuredImageFile = file;
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="preview-image">`;
            preview.classList.add('has-image');
        };
        reader.readAsDataURL(file);

        // Show/hide buttons
        document.getElementById('removeImageBtn').style.display = 'inline-flex';
        this.markFormDirty();
    }

    removeFeaturedImage() {
        this.featuredImageFile = null;
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `
            <div class="image-placeholder">
                <ion-icon name="image-outline"></ion-icon>
                <span>Chọn ảnh đại diện</span>
            </div>
        `;
        preview.classList.remove('has-image');
        document.getElementById('removeImageBtn').style.display = 'none';
        document.getElementById('featuredImage').value = '';
        this.markFormDirty();
    }

    addTag() {
        const input = document.getElementById('tagsInput');
        const tag = input.value.trim();
        
        if (tag && !this.tags.has(tag)) {
            this.tags.add(tag);
            this.renderTags();
            input.value = '';
            this.markFormDirty();
        }
    }

    removeTag(tag) {
        this.tags.delete(tag);
        this.renderTags();
        this.markFormDirty();
    }

    renderTags() {
        const container = document.getElementById('tagsList');
        container.innerHTML = Array.from(this.tags).map(tag => `
            <span class="tag-item">
                <span>${tag}</span>
                <button type="button" class="tag-remove" onclick="adminArticleCreate.removeTag('${tag}')">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </span>
        `).join('');
    }

    async loadTours() {
        try {
            const response = await window.apiClient.getTours({ size: 1000 });
            console.log('Tours response:', response); // Debug log
            
            if (response.success && response.data && response.data.content) {
                this.allTours = response.data.content || [];
            } else if (response.content) {
                this.allTours = response.content || [];
            } else if (Array.isArray(response)) {
                this.allTours = response;
            } else {
                this.allTours = [];
            }
        } catch (error) {
            console.error('Error loading tours:', error);
            this.allTours = [];
        }
    }

    searchTours() {
        const query = document.getElementById('toursSearch').value.toLowerCase();
        if (!query || !this.allTours) {
            this.hideToursDropdown();
            return;
        }

        const filtered = this.allTours.filter(tour => 
            (tour.title && tour.title.toLowerCase().includes(query)) ||
            (tour.destination && tour.destination.toLowerCase().includes(query))
        ).slice(0, 5);

        this.renderToursDropdown(filtered);
        if (filtered.length > 0) {
            this.showToursDropdown();
        }
    }

    renderToursDropdown(tours) {
        const dropdown = document.getElementById('toursDropdown');
        
        if (!tours || tours.length === 0) {
            dropdown.innerHTML = '<div class="tour-option">Không tìm thấy tour nào</div>';
            return;
        }

        dropdown.innerHTML = tours.map(tour => `
            <div class="tour-option" onclick="adminArticleCreate.selectTour(${tour.id})">
                <div class="tour-name">${tour.title || 'Không có tên'}</div>
                <div class="tour-price">${this.formatPrice(tour.price)}</div>
            </div>
        `).join('');
    }

    selectTour(tourId) {
        const tour = this.allTours.find(t => t.id === tourId);
        if (tour && !this.selectedTours.has(tourId)) {
            this.selectedTours.add(tourId);
            this.renderSelectedTours();
            document.getElementById('toursSearch').value = '';
            this.hideToursDropdown();
            this.markFormDirty();
        }
    }

    removeTour(tourId) {
        this.selectedTours.delete(tourId);
        this.renderSelectedTours();
        this.markFormDirty();
    }

    renderSelectedTours() {
        const container = document.getElementById('selectedTours');
        const tours = Array.from(this.selectedTours).map(id => 
            this.allTours.find(t => t.id === id)
        ).filter(Boolean);

        container.innerHTML = tours.map(tour => `
            <div class="selected-tour">
                <span class="selected-tour-name">${tour.title}</span>
                <button type="button" class="remove-tour" onclick="adminArticleCreate.removeTour(${tour.id})">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
        `).join('');
    }

    showToursDropdown() {
        document.getElementById('toursDropdown').classList.add('show');
    }

    hideToursDropdown() {
        document.getElementById('toursDropdown').classList.remove('show');
    }

    toggleSection(button) {
        const targetId = button.dataset.target;
        const content = document.getElementById(targetId);
        
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            button.classList.remove('collapsed');
        } else {
            content.classList.add('collapsed');
            button.classList.add('collapsed');
        }
    }

    async saveDraft() {
        await this.saveArticle(false);
    }

    async publishArticle() {
        await this.saveArticle(true);
    }

    async saveArticle(publish = false) {
        if (!this.validateForm()) return;

        try {
            this.showLoading();
            
            const articleData = await this.collectFormData(publish);
            const response = await window.apiClient.createArticle(articleData);
            console.log('Create article response:', response); // Debug log
            
            // Handle different success response formats
            if (response.success || response.id || (response && response.success !== false)) {
                this.isFormDirty = false;
                this.showToast(
                    publish ? 'Bài viết đã được xuất bản thành công' : 'Bài viết đã được lưu thành công',
                    'success'
                );
                
                setTimeout(() => {
                    window.location.href = 'articles.html';
                }, 1500);
            } else {
                throw new Error(response.message || 'Không thể lưu bài viết');
            }
        } catch (error) {
            console.error('Error saving article:', error);
            this.showToast('Có lỗi xảy ra khi lưu bài viết: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async collectFormData(publish) {
        const data = {
            title: document.getElementById('title').value.trim(),
            slug: document.getElementById('slug').value.trim(),
            summary: document.getElementById('summary').value.trim(),
            content: this.quill.root.innerHTML,
            published: publish,
            metaTitle: document.getElementById('metaTitle').value.trim() || null,
            metaDescription: document.getElementById('metaDescription').value.trim() || null,
            metaKeywords: document.getElementById('metaKeywords').value.trim() || null,
            tags: Array.from(this.tags),
            relatedTours: Array.from(this.selectedTours)
        };

        // Handle image upload if exists
        if (this.featuredImageFile) {
            // First upload the image
            const formData = new FormData();
            formData.append('file', this.featuredImageFile);
            
            try {
                const uploadResponse = await fetch(`${window.apiClient.baseURL}/upload/image`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${window.apiClient.token}`
                    },
                    body: formData
                });
                
                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    data.featuredImage = uploadResult.data.url;
                }
            } catch (error) {
                console.error('Image upload error:', error);
                // Continue without image if upload fails
            }
        }

        return data;
    }

    validateForm() {
        let isValid = true;
        
        // Clear previous errors
        document.querySelectorAll('.form-error').forEach(error => {
            error.classList.remove('show');
            error.textContent = '';
        });

        // Validate title
        const title = document.getElementById('title').value.trim();
        if (!title) {
            this.showFieldError('titleError', 'Vui lòng nhập tiêu đề bài viết');
            isValid = false;
        }

        // Validate content
        const content = this.quill.getText().trim();
        if (!content || content.length < 10) {
            this.showFieldError('contentError', 'Vui lòng nhập nội dung bài viết (tối thiểu 10 ký tự)');
            isValid = false;
        }

        // Validate summary length
        const summary = document.getElementById('summary').value.trim();
        if (summary && summary.length > 500) {
            this.showFieldError('summaryError', 'Tóm tắt không được vượt quá 500 ký tự');
            isValid = false;
        }

        // Validate meta fields length
        const metaTitle = document.getElementById('metaTitle').value.trim();
        if (metaTitle && metaTitle.length > 60) {
            this.showFieldError('metaTitleError', 'Meta title không được vượt quá 60 ký tự');
            isValid = false;
        }

        const metaDescription = document.getElementById('metaDescription').value.trim();
        if (metaDescription && metaDescription.length > 160) {
            this.showFieldError('metaDescriptionError', 'Meta description không được vượt quá 160 ký tự');
            isValid = false;
        }

        if (!isValid) {
            this.showToast('Vui lòng kiểm tra lại thông tin đã nhập', 'error');
        }

        return isValid;
    }

    showFieldError(fieldId, message) {
        const errorElement = document.getElementById(fieldId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    previewArticle() {
        // Create preview modal or open in new tab
        this.showToast('Chức năng xem trước đang được phát triển', 'info');
    }

    clearForm() {
        if (this.isFormDirty) {
            if (!confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu đã nhập?')) {
                return;
            }
        }

        // Clear form fields
        document.getElementById('articleForm').reset();
        this.quill.setContents([]);
        this.tags.clear();
        this.selectedTours.clear();
        this.removeFeaturedImage();
        this.renderTags();
        this.renderSelectedTours();
        this.isFormDirty = false;
        
        this.showToast('Form đã được làm mới', 'info');
    }

    goBack() {
        if (this.isFormDirty) {
            if (!confirm('Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn thoát?')) {
                return;
            }
        }
        window.location.href = 'articles.html';
    }

    markFormDirty() {
        this.isFormDirty = true;
    }

    // Utility methods
    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type} show`;
        toast.innerHTML = `
            <div class="toast-icon">
                <ion-icon name="${this.getToastIcon(type)}"></ion-icon>
            </div>
            <div class="toast-content">
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close">
                <ion-icon name="close-outline"></ion-icon>
            </button>
        `;

        const container = document.getElementById('toastContainer');
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }

    getToastIcon(type) {
        const icons = {
            success: 'checkmark-circle-outline',
            error: 'alert-circle-outline',
            warning: 'warning-outline',
            info: 'information-circle-outline'
        };
        return icons[type] || icons.info;
    }

    formatPrice(price) {
        if (!price) return '0 VND';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminArticleCreate = new AdminArticleCreate();
});

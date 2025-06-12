// Admin Article Create JavaScript

class AdminArticleCreate {
    constructor() {
        this.quill = null;
        this.tags = new Set();
        this.featuredImageFile = null;
        this.isFormDirty = false;
        
        this.init();
    }

    init() {
        this.initQuillEditor();
        this.bindEvents();
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

        this.quill.on('text-change', () => {
            document.getElementById('content').value = this.quill.root.innerHTML;
            this.markFormDirty();
        });
    }

    bindEvents() {
        // Form input events
        document.getElementById('title').addEventListener('input', () => {
            this.generateSlug();
            this.markFormDirty();
        });

        document.getElementById('summary').addEventListener('input', () => this.markFormDirty());
        document.getElementById('metaTitle').addEventListener('input', () => this.markFormDirty());
        document.getElementById('metaDescription').addEventListener('input', () => this.markFormDirty());
        document.getElementById('metaKeywords').addEventListener('input', () => this.markFormDirty());

        // Radio button events
        document.querySelectorAll('input[name="status"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateRadioStyles();
                this.markFormDirty();
            });
        });

        // Label click events for radio buttons
        document.querySelectorAll('.radio-option').forEach(label => {
            label.addEventListener('click', (e) => {
                if (e.target.type === 'radio') return;
                
                const radio = label.querySelector('input[type="radio"]');
                if (radio && !radio.checked) {
                    document.querySelectorAll('input[name="status"]').forEach(r => {
                        r.checked = false;
                    });
                    
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });

        // Action buttons
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        document.getElementById('saveAndPublishBtn').addEventListener('click', () => this.saveAndPublish());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewArticle());

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

        // Tags
        document.getElementById('tagsInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTag();
            }
        });

        // Section toggle
        document.querySelectorAll('.section-toggle').forEach(btn => {
            btn.addEventListener('click', () => this.toggleSection(btn));
        });

        // Before unload warning
        window.addEventListener('beforeunload', (e) => {
            if (this.isFormDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Initialize radio styles
        setTimeout(() => this.updateRadioStyles(), 100);
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

        if (!file.type.startsWith('image/')) {
            this.showToast('Vui lòng chọn file hình ảnh', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showToast('Kích thước file không được vượt quá 5MB', 'error');
            return;
        }

        this.featuredImageFile = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="preview-image">`;
            preview.classList.add('has-image');
        };
        reader.readAsDataURL(file);

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
                <span class="tag-text">${tag}</span>
                <button type="button" class="tag-remove" onclick="adminArticleCreate.removeTag('${tag}')">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </span>
        `).join('');
    }

    toggleSection(button) {
        const targetId = button.dataset.target;
        const content = document.getElementById(targetId);
        
        if (content && content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            button.classList.remove('collapsed');
        } else if (content) {
            content.classList.add('collapsed');
            button.classList.add('collapsed');
        }
    }

    async saveAndPublish() {
        // Get the selected status from radio buttons
        const statusRadio = document.querySelector('input[name="status"]:checked');
        const shouldPublish = statusRadio ? statusRadio.value === 'published' : false;
        
        await this.saveArticle(shouldPublish);
    }

    async saveArticle(publish = false) {
        if (!this.validateForm()) return;

        try {
            this.showLoading();
            
            // Create article data
            const articleData = await this.collectFormData(publish);
            console.log('Creating article with data:', articleData);
            
            // Create article
            const createResponse = await window.apiClient.createArticle(articleData);
            console.log('Create response:', createResponse);
            
            if (createResponse && (createResponse.success !== false)) {
                const articleId = createResponse.id;
                
                // Upload featured image if exists
                if (this.featuredImageFile && articleId) {
                    try {
                        const uploadResponse = await window.apiClient.uploadFeaturedImage(articleId, this.featuredImageFile);
                        console.log('Image upload response:', uploadResponse);
                    } catch (imageError) {
                        console.error('Image upload failed:', imageError);
                        this.showToast('Bài viết đã tạo nhưng không thể upload ảnh: ' + imageError.message, 'warning');
                    }
                }
                
                // Publish if needed and not already published
                if (publish && articleId) {
                    try {
                        const publishResponse = await window.apiClient.publishArticle(articleId);
                        console.log('Publish response:', publishResponse);
                    } catch (publishError) {
                        console.error('Publish failed:', publishError);
                        this.showToast('Bài viết đã tạo nhưng không thể xuất bản: ' + publishError.message, 'warning');
                    }
                }
                
                this.isFormDirty = false;
                this.showToast(
                    publish ? 'Bài viết đã được tạo và xuất bản thành công' : 'Bài viết đã được lưu dưới dạng bản nháp', 
                    'success'
                );
                
                setTimeout(() => {
                    window.location.href = 'articles.html';
                }, 1500);
            } else {
                throw new Error(createResponse.message || createResponse.error || 'Không thể tạo bài viết');
            }
        } catch (error) {
            console.error('Error creating article:', error);
            this.showToast('Có lỗi xảy ra khi tạo bài viết: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async collectFormData(publish = false) {
        // Get the actual status from radio buttons
        const statusRadio = document.querySelector('input[name="status"]:checked');
        const actualPublishStatus = statusRadio ? statusRadio.value === 'published' : false;
        
        const data = {
            title: document.getElementById('title').value.trim(),
            slug: document.getElementById('slug').value.trim(),
            summary: document.getElementById('summary').value.trim(),
            content: this.quill.root.innerHTML,
            isPublished: actualPublishStatus, // Use the radio button status
            metaTitle: document.getElementById('metaTitle').value.trim() || null,
            metaDescription: document.getElementById('metaDescription').value.trim() || null,
            metaKeywords: document.getElementById('metaKeywords').value.trim() || null,
            tags: Array.from(this.tags)
        };

        console.log('Form data collected:', data);
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
        this.showToast('Chức năng xem trước đang được phát triển', 'info');
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

    updateRadioStyles() {
        document.querySelectorAll('.radio-option').forEach(label => {
            const radio = label.querySelector('input[type="radio"]');
            if (radio.checked) {
                label.classList.add('selected');
            } else {
                label.classList.remove('selected');
            }
        });
        
        // Update button text based on selection
        this.updateSaveButtonText();
    }

    updateSaveButtonText() {
        const statusRadio = document.querySelector('input[name="status"]:checked');
        const saveBtn = document.getElementById('saveAndPublishBtn');
        const btnText = saveBtn.querySelector('.btn-text');
        const btnIcon = saveBtn.querySelector('ion-icon');
        
        if (statusRadio && statusRadio.value === 'published') {
            btnText.textContent = 'Xuất bản';
            btnIcon.setAttribute('name', 'checkmark-circle-outline');
            saveBtn.className = 'btn btn-primary';
        } else {
            btnText.textContent = 'Lưu nháp';
            btnIcon.setAttribute('name', 'document-outline');
            saveBtn.className = 'btn btn-secondary';
        }
    }

    formatPrice(price) {
        if (!price) return '0 VND';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }

    // Utility methods
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

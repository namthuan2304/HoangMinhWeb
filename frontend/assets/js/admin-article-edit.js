// Admin Article Edit JavaScript

class AdminArticleEdit {
    constructor() {
        this.articleId = null;
        this.originalArticle = null;
        this.quill = null;
        this.selectedTours = new Set();
        this.tags = new Set();
        this.featuredImageFile = null;
        this.currentFeaturedImage = null;
        this.isFormDirty = false;
        
        this.init();
    }

    init() {
        this.getArticleIdFromUrl();
        if (this.articleId) {
            this.loadArticle();
        } else {
            this.showToast('ID bài viết không hợp lệ', 'error');
            setTimeout(() => window.location.href = 'articles.html', 2000);
        }
    }

    getArticleIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        this.articleId = urlParams.get('id');
    }    async loadArticle() {
        try {
            this.showLoading();
            
            const response = await window.apiClient.getArticleById(this.articleId);
            console.log('Load article response:', response); // Debug log
            
            let article;
            if (response.success && response.data) {
                article = response.data;
            } else if (response.id) {
                article = response;
            } else {
                throw new Error('Article not found');
            }

            this.originalArticle = article;
            this.initQuillEditor();
            this.populateForm(article);
            this.bindEvents();
            this.loadTours();
        } catch (error) {
            console.error('Error loading article:', error);
            this.showToast('Có lỗi xảy ra khi tải bài viết: ' + error.message, 'error');
            setTimeout(() => window.location.href = 'articles.html', 2000);
        } finally {
            this.hideLoading();
        }
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

    populateForm(article) {
        document.getElementById('title').value = article.title || '';
        document.getElementById('slug').value = article.slug || '';
        document.getElementById('summary').value = article.summary || '';
        
        if (article.content) {
            this.quill.root.innerHTML = article.content;
            document.getElementById('content').value = article.content;
        }

        document.getElementById('metaTitle').value = article.metaTitle || '';
        document.getElementById('metaDescription').value = article.metaDescription || '';
        document.getElementById('metaKeywords').value = article.metaKeywords || '';        const statusInput = document.querySelector(`input[name="status"][value="${article.isPublished ? 'published' : 'draft'}"]`);
        if (statusInput) {
            statusInput.checked = true;
            this.updateRadioStyles();
        }

        if (article.featuredImageUrl) {
            this.currentFeaturedImage = article.featuredImageUrl;
            this.displayCurrentImage(article.featuredImageUrl);
        }

        if (article.tags && Array.isArray(article.tags)) {
            article.tags.forEach(tag => this.tags.add(tag));
            this.renderTags();
        }        if (article.relatedTours && Array.isArray(article.relatedTours)) {
            article.relatedTours.forEach(tourId => this.selectedTours.add(tourId));
            this.renderSelectedTours();
        }

        this.displayArticleStats(article);
        document.getElementById('articleStats').style.display = 'block';
    }

    displayCurrentImage(imageUrl) {
        const preview = document.getElementById('imagePreview');
        const fullImageUrl = window.apiClient.getFullImageUrl(imageUrl);
        
        preview.innerHTML = `<img src="${fullImageUrl}" alt="Current image" class="preview-image">`;
        preview.classList.add('has-image');
        document.getElementById('removeImageBtn').style.display = 'inline-flex';
    }

    displayArticleStats(article) {
        document.getElementById('viewCount').textContent = this.formatNumber(article.viewCount || 0);
        document.getElementById('createdDate').textContent = this.formatDate(article.createdAt);
        document.getElementById('updatedDate').textContent = this.formatDate(article.updatedAt);
    }

    bindEvents() {
        document.getElementById('title').addEventListener('input', () => {
            this.generateSlug();
            this.markFormDirty();
        });

        document.getElementById('summary').addEventListener('input', () => this.markFormDirty());
        document.getElementById('metaTitle').addEventListener('input', () => this.markFormDirty());
        document.getElementById('metaDescription').addEventListener('input', () => this.markFormDirty());
        document.getElementById('metaKeywords').addEventListener('input', () => this.markFormDirty());        // Radio button events với xử lý đúng
        document.querySelectorAll('input[name="status"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                console.log('Radio changed:', e.target.value);
                this.updateRadioStyles();
                this.markFormDirty();
            });
        });

        // Thêm event listener cho label để đảm bảo click hoạt động
        document.querySelectorAll('.radio-option').forEach(label => {
            label.addEventListener('click', (e) => {
                // Ngăn double-click
                if (e.target.type === 'radio') return;
                
                const radio = label.querySelector('input[type="radio"]');
                if (radio && !radio.checked) {
                    // Uncheck tất cả radio khác trong cùng group
                    document.querySelectorAll('input[name="status"]').forEach(r => {
                        r.checked = false;
                    });
                    
                    // Check radio được click
                    radio.checked = true;
                    
                    // Trigger change event
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });

        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveArticle());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewArticle());
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteArticle());

        document.getElementById('selectImageBtn').addEventListener('click', () => {
            document.getElementById('featuredImage').click();
        });

        document.getElementById('featuredImage').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        document.getElementById('removeImageBtn').addEventListener('click', () => {
            this.removeFeaturedImage();
        });

        document.getElementById('tagsInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTag();
            }
        });

        document.getElementById('toursSearch').addEventListener('input', 
            this.debounce(() => this.searchTours(), 300));

        window.addEventListener('beforeunload', (e) => {
            if (this.isFormDirty) {
                e.preventDefault();
                e.returnValue = '';
            }        });

        this.bindModalEvents();
        
        // Cập nhật radio styles sau khi bind events
        setTimeout(() => this.updateRadioStyles(), 100);
    }

    bindModalEvents() {
        const deleteModal = document.getElementById('deleteModal');
        const deleteModalClose = document.getElementById('deleteModalClose');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        deleteModalClose.addEventListener('click', () => this.hideModal('deleteModal'));
        cancelDeleteBtn.addEventListener('click', () => this.hideModal('deleteModal'));
        confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
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
        this.currentFeaturedImage = null;
        
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
        this.currentFeaturedImage = null;
        
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
                <button type="button" class="tag-remove" onclick="adminArticleEdit.removeTag('${tag}')">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </span>
        `).join('');
    }

    async loadTours() {
        try {
            const response = await window.apiClient.getTours({ size: 1000 });
            if (response.success && response.data && response.data.content) {
                this.allTours = response.data.content || [];
            } else if (response.content) {
                this.allTours = response.content || [];
            } else if (Array.isArray(response)) {
                this.allTours = response;
            } else {
                this.allTours = [];
            }
            this.renderSelectedTours();
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
            <div class="tour-option" onclick="adminArticleEdit.selectTour(${tour.id})">
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
    }    removeTour(tourId) {
        this.selectedTours.delete(tourId);
        this.renderSelectedTours();
        this.markFormDirty();
    }

    renderSelectedTours() {
        const container = document.getElementById('selectedTours');
        if (!container) return;
        
        const tours = Array.from(this.selectedTours).map(id => 
            this.allTours.find(t => t.id === id)
        ).filter(Boolean);

        container.innerHTML = tours.map(tour => `
            <div class="selected-tour">
                <span class="selected-tour-name">${tour.title}</span>
                <button type="button" class="remove-tour" onclick="adminArticleEdit.removeTour(${tour.id})">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
        `).join('');
    }

    showToursDropdown() {
        const dropdown = document.getElementById('toursDropdown');
        if (dropdown) {
            dropdown.classList.add('show');
        }
    }

    hideToursDropdown() {
        const dropdown = document.getElementById('toursDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
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

    previewArticle() {
        this.showToast('Chức năng xem trước đang được phát triển', 'info');
    }

    formatPrice(price) {
        if (!price) return '0 VND';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }    async saveArticle() {
        if (!this.validateForm()) return;

        try {
            this.showLoading();
            
            // Bước 1: Upload ảnh nếu có
            if (this.featuredImageFile) {
                console.log('Uploading featured image...');
                try {
                    const uploadResponse = await window.apiClient.uploadFeaturedImage(this.articleId, this.featuredImageFile);
                    console.log('Image upload response:', uploadResponse);
                    
                    if (uploadResponse && (uploadResponse.success !== false)) {
                        this.showToast('Ảnh đại diện đã được cập nhật', 'success');
                        this.featuredImageFile = null; // Reset file after upload
                        
                        // Cập nhật URL hiển thị
                        if (uploadResponse.featuredImageUrl) {
                            this.currentFeaturedImage = uploadResponse.featuredImageUrl;
                            this.displayCurrentImage(uploadResponse.featuredImageUrl);
                        }
                    }
                } catch (imageError) {
                    console.error('Image upload failed:', imageError);
                    this.showToast('Không thể upload ảnh: ' + imageError.message, 'error');
                    // Continue with article update even if image upload fails
                }
            }
            
            // Bước 2: Cập nhật thông tin bài viết (không bao gồm ảnh và publish status)
            const articleData = await this.collectFormDataForUpdate();
            console.log('Article data to update:', articleData);
            
            const updateResponse = await window.apiClient.updateArticle(this.articleId, articleData);
            console.log('Update article response:', updateResponse);
            
            if (updateResponse && (updateResponse.success !== false)) {
                // Bước 3: Xử lý publish/unpublish riêng biệt
                const statusRadio = document.querySelector('input[name="status"]:checked');
                const shouldPublish = statusRadio ? statusRadio.value === 'published' : false;
                const currentlyPublished = this.originalArticle.isPublished;
                
                if (shouldPublish !== currentlyPublished) {
                    console.log(`Changing publish status: ${currentlyPublished} -> ${shouldPublish}`);
                    try {
                        let statusResponse;
                        if (shouldPublish) {
                            statusResponse = await window.apiClient.publishArticle(this.articleId);
                            console.log('Publish response:', statusResponse);
                        } else {
                            statusResponse = await window.apiClient.unpublishArticle(this.articleId);
                            console.log('Unpublish response:', statusResponse);
                        }
                        
                        if (statusResponse && (statusResponse.success !== false)) {
                            this.showToast(
                                shouldPublish ? 'Bài viết đã được xuất bản' : 'Bài viết đã được gỡ xuất bản', 
                                'success'
                            );
                        }
                    } catch (statusError) {
                        console.error('Status change failed:', statusError);
                        this.showToast('Không thể thay đổi trạng thái xuất bản: ' + statusError.message, 'warning');
                    }
                }
                
                this.isFormDirty = false;
                this.showToast('Bài viết đã được cập nhật thành công', 'success');
                
                setTimeout(() => {
                    window.location.href = 'articles.html';
                }, 1500);
            } else {
                throw new Error(updateResponse.message || updateResponse.error || 'Không thể cập nhật bài viết');
            }
        } catch (error) {
            console.error('Error updating article:', error);
            this.showToast('Có lỗi xảy ra khi cập nhật bài viết: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }    async collectFormDataForUpdate() {
        // Chỉ collect data cần thiết cho update, không bao gồm ảnh và publish status
        const data = {
            title: document.getElementById('title').value.trim(),
            slug: document.getElementById('slug').value.trim(),
            summary: document.getElementById('summary').value.trim(),
            content: this.quill.root.innerHTML,
            metaTitle: document.getElementById('metaTitle').value.trim() || null,
            metaDescription: document.getElementById('metaDescription').value.trim() || null,
            metaKeywords: document.getElementById('metaKeywords').value.trim() || null,
            tags: Array.from(this.tags),
            relatedTourIds: Array.from(this.selectedTours)
        };

        console.log('Form data for update:', data);
        return data;
    }

    async collectFormData() {
        const statusRadio = document.querySelector('input[name="status"]:checked');
        const status = statusRadio ? statusRadio.value : 'draft';
        
        console.log('Status radio found:', statusRadio);
        console.log('Status value:', status);
        console.log('All status radios:', document.querySelectorAll('input[name="status"]'));
        
        const data = {
            title: document.getElementById('title').value.trim(),
            slug: document.getElementById('slug').value.trim(),
            summary: document.getElementById('summary').value.trim(),
            content: this.quill.root.innerHTML,
            isPublished: status === 'published',
            metaTitle: document.getElementById('metaTitle').value.trim() || null,
            metaDescription: document.getElementById('metaDescription').value.trim() || null,
            metaKeywords: document.getElementById('metaKeywords').value.trim() || null,
            tags: Array.from(this.tags),
            relatedTourIds: Array.from(this.selectedTours)
        };        console.log('Form data collected:', data);
        
        // Include current featured image URL if exists
        if (this.currentFeaturedImage) {
            data.featuredImageUrl = this.currentFeaturedImage;
        }

        console.log('Final data to send:', data);
        return data;
    }

    validateForm() {
        let isValid = true;
        
        document.querySelectorAll('.form-error').forEach(error => {
            error.classList.remove('show');
            error.textContent = '';
        });

        const title = document.getElementById('title').value.trim();
        if (!title) {
            this.showFieldError('titleError', 'Vui lòng nhập tiêu đề bài viết');
            isValid = false;
        }

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

    deleteArticle() {
        this.showModal('deleteModal');
    }

    async confirmDelete() {
        try {
            this.hideModal('deleteModal');
            this.showLoading();
            
            const response = await window.apiClient.deleteArticle(this.articleId);
            
            if (response === true || (response && (response.success === true || response.success === undefined))) {
                this.showToast('Bài viết đã được xóa', 'success');
                setTimeout(() => {
                    window.location.href = 'articles.html';
                }, 1500);
            } else {
                throw new Error(response.message || 'Không thể xóa bài viết');
            }
        } catch (error) {
            console.error('Error deleting article:', error);
            this.showToast('Có lỗi xảy ra khi xóa bài viết: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
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

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatNumber(num) {
        return new Intl.NumberFormat('vi-VN').format(num);
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
    window.adminArticleEdit = new AdminArticleEdit();
});

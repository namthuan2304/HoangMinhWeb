/**
 * Admin Article Create Page
 */
class AdminArticleCreate {
    constructor() {
        this.article = null;
        this.editor = null;
        this.selectedTours = [];
        this.tags = [];
        this.availableTours = [];
        this.isLoading = false;
        this.featuredImageFile = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.initializeEditor();
        await this.loadTours();
        this.setupAutoSave();
    }

    setupEventListeners() {
        // Back button
        const backBtn = document.getElementById('backBtn');
        backBtn?.addEventListener('click', () => {
            this.goBack();
        });

        // Save draft button
        const saveDraftBtn = document.getElementById('saveDraftBtn');
        saveDraftBtn?.addEventListener('click', () => {
            this.saveArticle(false); // Save as draft
        });

        // Publish button
        const publishBtn = document.getElementById('publishBtn');
        publishBtn?.addEventListener('click', () => {
            this.saveArticle(true); // Save and publish
        });

        // Preview button
        const previewBtn = document.getElementById('previewBtn');
        previewBtn?.addEventListener('click', () => {
            this.previewArticle();
        });

        // Clear form button
        const clearFormBtn = document.getElementById('clearFormBtn');
        clearFormBtn?.addEventListener('click', () => {
            this.clearForm();
        });

        // Title input - auto generate slug
        const titleInput = document.getElementById('title');
        titleInput?.addEventListener('input', (e) => {
            this.generateSlug(e.target.value);
            this.validateForm();
        });

        // Content validation
        const contentTextarea = document.getElementById('content');
        contentTextarea?.addEventListener('input', () => {
            this.validateForm();
        });

        // Featured image
        const selectImageBtn = document.getElementById('selectImageBtn');
        const featuredImage = document.getElementById('featuredImage');
        const removeImageBtn = document.getElementById('removeImageBtn');

        selectImageBtn?.addEventListener('click', () => {
            featuredImage.click();
        });

        featuredImage?.addEventListener('change', (e) => {
            this.handleImageSelect(e.target.files[0]);
        });

        removeImageBtn?.addEventListener('click', () => {
            this.removeImage();
        });

        // Tags input
        const tagsInput = document.getElementById('tagsInput');
        tagsInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTag(e.target.value.trim());
                e.target.value = '';
            }
        });

        // Tours search
        const toursSearch = document.getElementById('toursSearch');
        toursSearch?.addEventListener('input', (e) => {
            this.searchTours(e.target.value);
        });

        // Section toggles
        document.querySelectorAll('.section-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                this.toggleSection(e.target.closest('.section-toggle'));
            });
        });

        // Modal event listeners
        this.setupModalEventListeners();

        // Initial form validation
        this.validateForm();
    }

    setupModalEventListeners() {
        // Tours modal
        const toursModal = document.getElementById('toursModal');
        const toursModalClose = document.getElementById('toursModalClose');
        const closeToursModal = document.getElementById('closeToursModal');
        const confirmToursSelection = document.getElementById('confirmToursSelection');

        [toursModalClose, closeToursModal]?.forEach(btn => {
            btn?.addEventListener('click', () => {
                this.hideModal('toursModal');
            });
        });

        confirmToursSelection?.addEventListener('click', () => {
            this.confirmToursSelection();
        });

        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });
    }    initializeEditor() {
        // Initialize Quill editor
        this.quill = new Quill('#contentEditor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'align': [] }],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['link', 'image'],
                    ['clean']
                ]
            },
            placeholder: 'Nhập nội dung bài viết...'
        });

        // Sync content with hidden textarea
        this.quill.on('text-change', () => {
            const content = this.quill.root.innerHTML;
            document.getElementById('content').value = content;
            this.validateForm();
        });
    }

    async loadTours() {
        try {
            const response = await window.apiClient.getAllTours();
            if (response.success) {
                this.availableTours = response.data.content || [];
            }
        } catch (error) {
            console.error('Error loading tours:', error);
            this.showToast('Lỗi khi tải danh sách tours', 'warning');
        }
    }

    generateSlug(title) {
        const slug = title
            .toLowerCase()
            .replace(/[đ]/g, 'd')
            .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
            .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
            .replace(/[ìíịỉĩ]/g, 'i')
            .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
            .replace(/[ùúụủũưừứựửữ]/g, 'u')
            .replace(/[ỳýỵỷỹ]/g, 'y')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        
        document.getElementById('slug').value = slug;
    }

    validateForm() {
        const title = document.getElementById('title').value.trim();
        const content = this.editor ? this.editor.getContent().trim() : document.getElementById('content').value.trim();
        
        const isValid = title.length > 0 && content.length > 0;
        
        // Update button states
        const saveDraftBtn = document.getElementById('saveDraftBtn');
        const publishBtn = document.getElementById('publishBtn');
        const previewBtn = document.getElementById('previewBtn');
        
        if (saveDraftBtn) {
            saveDraftBtn.disabled = !title;
        }
        
        if (publishBtn) {
            publishBtn.disabled = !isValid;
        }
        
        if (previewBtn) {
            previewBtn.disabled = !isValid;
        }
        
        // Clear previous errors
        document.getElementById('titleError').classList.remove('show');
        document.getElementById('contentError').classList.remove('show');
        
        return isValid;
    }

    async saveArticle(publish = false) {
        if (this.isLoading) return;
        
        if (!this.validateForm() && publish) {
            this.showValidationErrors();
            return;
        }
        
        try {
            this.isLoading = true;
            this.showLoading();
            
            const formData = this.collectFormData();
            
            // Create article
            const response = await window.apiClient.createArticle(formData);
            
            if (response.success) {
                this.article = response.data;
                
                // Upload featured image if selected
                if (this.featuredImageFile) {
                    await this.uploadFeaturedImage();
                }
                
                // Publish if requested
                if (publish) {
                    await this.publishArticle();
                }
                
                const action = publish ? 'tạo và xuất bản' : 'tạo bản nháp';
                this.showToast(`${action.charAt(0).toUpperCase() + action.slice(1)} bài viết thành công`, 'success');
                
                // Redirect to edit page or articles list
                setTimeout(() => {
                    if (publish) {
                        window.location.href = `article-edit.html?id=${this.article.id}`;
                    } else {
                        window.location.href = 'articles.html';
                    }
                }, 1500);
                
            } else {
                throw new Error(response.message || 'Không thể tạo bài viết');
            }
        } catch (error) {
            console.error('Error saving article:', error);
            this.showToast('Lỗi khi lưu bài viết: ' + error.message, 'error');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    async uploadFeaturedImage() {
        try {
            const response = await window.apiClient.uploadArticleImage(this.article.id, this.featuredImageFile);
            if (response.success) {
                this.article.featuredImageUrl = response.data.featuredImageUrl;
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            this.showToast('Lỗi khi upload ảnh', 'warning');
        }
    }

    async publishArticle() {
        try {
            const response = await window.apiClient.publishArticle(this.article.id);
            if (response.success) {
                this.article.isPublished = true;
            }
        } catch (error) {
            console.error('Error publishing article:', error);
            this.showToast('Lỗi khi xuất bản bài viết', 'warning');
        }
    }    collectFormData() {
        const content = this.quill ? this.quill.root.innerHTML : document.getElementById('content').value;
        
        return {
            title: document.getElementById('title').value.trim(),
            content: content,
            summary: document.getElementById('summary').value.trim(),
            metaTitle: document.getElementById('metaTitle').value.trim(),
            metaDescription: document.getElementById('metaDescription').value.trim(),
            metaKeywords: document.getElementById('metaKeywords').value.trim(),
            tags: this.tags,
            relatedTourIds: this.selectedTours.map(tour => tour.id)
        };
    }

    showValidationErrors() {
        const title = document.getElementById('title').value.trim();
        const content = this.editor ? this.editor.getContent().trim() : document.getElementById('content').value.trim();
        
        if (!title) {
            const titleError = document.getElementById('titleError');
            titleError.textContent = 'Tiêu đề bài viết là bắt buộc';
            titleError.classList.add('show');
        }
        
        if (!content) {
            const contentError = document.getElementById('contentError');
            contentError.textContent = 'Nội dung bài viết là bắt buộc';
            contentError.classList.add('show');
        }
    }

    handleImageSelect(file) {
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
        this.displayImagePreview(file);
    }

    displayImagePreview(file) {
        const imagePreview = document.getElementById('imagePreview');
        const removeImageBtn = document.getElementById('removeImageBtn');
        
        if (imagePreview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="preview-image">`;
                imagePreview.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        }
        
        if (removeImageBtn) {
            removeImageBtn.style.display = 'flex';
        }
    }

    removeImage() {
        const imagePreview = document.getElementById('imagePreview');
        const removeImageBtn = document.getElementById('removeImageBtn');
        const featuredImage = document.getElementById('featuredImage');
        
        if (imagePreview) {
            imagePreview.innerHTML = `
                <div class="image-placeholder">
                    <ion-icon name="image-outline"></ion-icon>
                    <span>Chọn ảnh đại diện</span>
                </div>
            `;
            imagePreview.classList.remove('has-image');
        }
        
        if (removeImageBtn) {
            removeImageBtn.style.display = 'none';
        }
        
        if (featuredImage) {
            featuredImage.value = '';
        }
        
        this.featuredImageFile = null;
    }

    addTag(tagText) {
        if (!tagText || this.tags.includes(tagText)) return;
        
        this.tags.push(tagText);
        this.renderTags();
    }

    removeTag(tagText) {
        this.tags = this.tags.filter(tag => tag !== tagText);
        this.renderTags();
    }

    renderTags() {
        const tagsList = document.getElementById('tagsList');
        if (!tagsList) return;
        
        tagsList.innerHTML = this.tags.map(tag => `
            <span class="tag-item">
                ${tag}
                <button type="button" class="tag-remove" onclick="adminArticleCreate.removeTag('${tag}')">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </span>
        `).join('');
    }

    searchTours(query) {
        const dropdown = document.getElementById('toursDropdown');
        if (!dropdown) return;
        
        if (!query.trim()) {
            dropdown.classList.remove('show');
            return;
        }
        
        const filteredTours = this.availableTours.filter(tour =>
            tour.title.toLowerCase().includes(query.toLowerCase()) &&
            !this.selectedTours.some(selected => selected.id === tour.id)
        );
        
        if (filteredTours.length > 0) {
            dropdown.innerHTML = filteredTours.map(tour => `
                <div class="tour-option" onclick="adminArticleCreate.selectTour(${tour.id})">
                    <div class="tour-name">${tour.title}</div>
                    <div class="tour-price">${tour.price?.toLocaleString() || 0} VNĐ</div>
                </div>
            `).join('');
            dropdown.classList.add('show');
        } else {
            dropdown.classList.remove('show');
        }
    }

    selectTour(tourId) {
        const tour = this.availableTours.find(t => t.id === tourId);
        if (!tour || this.selectedTours.some(t => t.id === tourId)) return;
        
        this.selectedTours.push({
            id: tour.id,
            title: tour.title,
            price: tour.price
        });
        
        this.renderSelectedTours();
        
        // Clear search and hide dropdown
        const toursSearch = document.getElementById('toursSearch');
        const dropdown = document.getElementById('toursDropdown');
        
        if (toursSearch) toursSearch.value = '';
        if (dropdown) dropdown.classList.remove('show');
    }

    removeTour(tourId) {
        this.selectedTours = this.selectedTours.filter(tour => tour.id !== tourId);
        this.renderSelectedTours();
    }

    renderSelectedTours() {
        const selectedTours = document.getElementById('selectedTours');
        if (!selectedTours) return;
        
        selectedTours.innerHTML = this.selectedTours.map(tour => `
            <div class="selected-tour">
                <span class="selected-tour-name">${tour.title}</span>
                <button type="button" class="remove-tour" onclick="adminArticleCreate.removeTour(${tour.id})">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
        `).join('');
    }

    toggleSection(toggle) {
        const targetId = toggle.dataset.target;
        const content = document.getElementById(targetId);
        
        if (content) {
            content.classList.toggle('collapsed');
            toggle.classList.toggle('collapsed');
        }
    }

    previewArticle() {
        if (!this.validateForm()) {
            this.showToast('Vui lòng nhập đầy đủ thông tin để xem trước', 'warning');
            return;
        }
        
        // Create preview data
        const formData = this.collectFormData();
        const previewData = {
            ...formData,
            featuredImageUrl: this.featuredImageFile ? URL.createObjectURL(this.featuredImageFile) : null,
            createdAt: new Date().toISOString(),
            author: { fullName: 'Admin' },
            viewCount: 0
        };
        
        // Store preview data in sessionStorage
        sessionStorage.setItem('articlePreview', JSON.stringify(previewData));
        
        // Open preview window
        window.open('../article-detail.html?preview=true', '_blank');
    }

    clearForm() {
        if (confirm('Bạn có chắc muốn làm mới form? Tất cả dữ liệu sẽ bị xóa.')) {
            // Clear form fields
            document.getElementById('title').value = '';
            document.getElementById('slug').value = '';
            document.getElementById('summary').value = '';
            document.getElementById('metaTitle').value = '';
            document.getElementById('metaDescription').value = '';
            document.getElementById('metaKeywords').value = '';
            
            // Clear editor
            if (this.editor) {
                this.editor.setContent('');
            }
            
            // Clear image
            this.removeImage();
            
            // Clear tags
            this.tags = [];
            this.renderTags();
            
            // Clear selected tours
            this.selectedTours = [];
            this.renderSelectedTours();
            
            // Clear search
            const toursSearch = document.getElementById('toursSearch');
            if (toursSearch) toursSearch.value = '';
            
            // Validate form
            this.validateForm();
            
            this.showToast('Form đã được làm mới', 'info');
        }
    }

    goBack() {
        const hasContent = document.getElementById('title').value.trim() || 
                          (this.editor ? this.editor.getContent().trim() : document.getElementById('content').value.trim()) ||
                          this.tags.length > 0 ||
                          this.selectedTours.length > 0 ||
                          this.featuredImageFile;
        
        if (hasContent) {
            if (confirm('Bạn có dữ liệu chưa được lưu. Bạn có chắc muốn rời khỏi trang?')) {
                window.location.href = 'articles.html';
            }
        } else {
            window.location.href = 'articles.html';
        }
    }

    setupAutoSave() {
        // Auto save draft every 3 minutes if there's content
        setInterval(() => {
            const title = document.getElementById('title').value.trim();
            if (title && !this.isLoading && !this.article) {
                // Only auto-save if article hasn't been created yet
                this.autoSaveDraft();
            }
        }, 180000); // 3 minutes
    }

    async autoSaveDraft() {
        try {
            const formData = this.collectFormData();
            if (formData.title) {
                await this.saveArticle(false);
                this.showToast('Bản nháp đã được tự động lưu', 'info');
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    // Modal helpers
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Loading states
    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    // Toast notifications
    showToast(message, type = 'info', title = '') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconName = {
            success: 'checkmark-circle-outline',
            error: 'alert-circle-outline',
            warning: 'warning-outline',
            info: 'information-circle-outline'
        }[type] || 'information-circle-outline';

        toast.innerHTML = `
            <ion-icon name="${iconName}" class="toast-icon"></ion-icon>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <ion-icon name="close-outline"></ion-icon>
            </button>
        `;

        container.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove after 5 seconds
        const autoRemove = setTimeout(() => {
            this.removeToast(toast);
        }, 5000);

        // Manual close
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.removeToast(toast);
        });
    }

    removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminArticleCreate = new AdminArticleCreate();
});

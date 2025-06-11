/**
 * Admin Article Edit Page
 */
class AdminArticleEdit {
    constructor() {
        this.articleId = this.getArticleIdFromUrl();
        this.article = null;
        this.editor = null;
        this.selectedTours = [];
        this.tags = [];
        this.availableTours = [];
        this.isLoading = false;
        this.hasChanges = false;
        
        this.init();
    }

    getArticleIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async init() {
        if (!this.articleId) {
            this.showToast('ID bài viết không hợp lệ', 'error');
            window.location.href = 'articles.html';
            return;
        }

        this.setupEventListeners();
        this.initializeEditor();
        await this.loadArticle();
        await this.loadTours();
        this.setupAutoSave();
    }

    setupEventListeners() {
        // Back button
        const backBtn = document.getElementById('backBtn');
        backBtn?.addEventListener('click', () => {
            this.goBack();
        });

        // Save button
        const saveBtn = document.getElementById('saveBtn');
        saveBtn?.addEventListener('click', () => {
            this.saveArticle();
        });

        // Delete button
        const deleteBtn = document.getElementById('deleteBtn');
        deleteBtn?.addEventListener('click', () => {
            this.showDeleteModal();
        });

        // Preview button
        const previewBtn = document.getElementById('previewBtn');
        previewBtn?.addEventListener('click', () => {
            this.previewArticle();
        });

        // Title input - auto generate slug
        const titleInput = document.getElementById('title');
        titleInput?.addEventListener('input', (e) => {
            this.generateSlug(e.target.value);
            this.markAsChanged();
        });

        // Form inputs change tracking
        const formInputs = document.querySelectorAll('input, textarea, select');
        formInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.markAsChanged();
            });
        });

        // Featured image
        const selectImageBtn = document.getElementById('selectImageBtn');
        const featuredImage = document.getElementById('featuredImage');
        const removeImageBtn = document.getElementById('removeImageBtn');

        selectImageBtn?.addEventListener('click', () => {
            featuredImage.click();
        });

        featuredImage?.addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
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

        // Prevent leaving page with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.hasChanges) {
                e.preventDefault();
                e.returnValue = 'Bạn có thay đổi chưa được lưu. Bạn có chắc muốn rời khỏi trang?';
            }
        });
    }

    setupModalEventListeners() {
        // Delete modal
        const deleteModal = document.getElementById('deleteModal');
        const deleteModalClose = document.getElementById('deleteModalClose');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        [deleteModalClose, cancelDeleteBtn]?.forEach(btn => {
            btn?.addEventListener('click', () => {
                this.hideModal('deleteModal');
            });
        });

        confirmDeleteBtn?.addEventListener('click', () => {
            this.confirmDelete();
        });

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
            this.markAsChanged();
        });
    }

    async loadArticle() {
        try {
            this.showLoading();
            
            const response = await window.apiClient.getArticleById(this.articleId);
            
            if (response.success) {
                this.article = response.data;
                this.populateForm();
                this.showArticleStats();
            } else {
                throw new Error(response.message || 'Không thể tải bài viết');
            }
        } catch (error) {
            console.error('Error loading article:', error);
            this.showToast('Lỗi khi tải bài viết', 'error');
            setTimeout(() => {
                window.location.href = 'articles.html';
            }, 2000);
        } finally {
            this.hideLoading();
        }
    }

    populateForm() {
        const article = this.article;
        
        // Basic information
        document.getElementById('title').value = article.title || '';
        document.getElementById('slug').value = article.slug || '';
        document.getElementById('summary').value = article.summary || '';
          // Content
        if (this.quill) {
            this.quill.root.innerHTML = article.content || '';
            document.getElementById('content').value = article.content || '';
        }
        
        // SEO
        document.getElementById('metaTitle').value = article.metaTitle || '';
        document.getElementById('metaDescription').value = article.metaDescription || '';
        document.getElementById('metaKeywords').value = article.metaKeywords || '';
        
        // Status
        const statusRadio = document.querySelector(`input[name="status"][value="${article.isPublished ? 'published' : 'draft'}"]`);
        if (statusRadio) {
            statusRadio.checked = true;
        }
        
        // Featured image
        if (article.featuredImageUrl) {
            this.displayImage(article.featuredImageUrl);
        }
        
        // Tags
        if (article.tags && article.tags.length > 0) {
            this.tags = [...article.tags];
            this.renderTags();
        }
        
        // Related tours
        if (article.relatedTours && article.relatedTours.length > 0) {
            this.selectedTours = article.relatedTours.map(tour => ({
                id: tour.id,
                title: tour.title,
                price: tour.price
            }));
            this.renderSelectedTours();
        }
    }

    showArticleStats() {
        const article = this.article;
        const statsSection = document.getElementById('articleStats');
        
        if (statsSection) {
            statsSection.style.display = 'block';
            
            document.getElementById('viewCount').textContent = (article.viewCount || 0).toLocaleString();
            document.getElementById('createdDate').textContent = new Date(article.createdAt).toLocaleDateString('vi-VN');
            document.getElementById('updatedDate').textContent = new Date(article.updatedAt).toLocaleDateString('vi-VN');
        }
    }

    async loadTours() {
        try {
            const response = await window.apiClient.getAllTours();
            if (response.success) {
                this.availableTours = response.data.content || [];
            }
        } catch (error) {
            console.error('Error loading tours:', error);
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

    markAsChanged() {
        this.hasChanges = true;
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn && !saveBtn.classList.contains('btn-warning')) {
            saveBtn.classList.add('btn-warning');
            saveBtn.innerHTML = `
                <ion-icon name="warning-outline"></ion-icon>
                <span class="btn-text">Có thay đổi</span>
            `;
        }
    }

    resetChangeState() {
        this.hasChanges = false;
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.classList.remove('btn-warning');
            saveBtn.innerHTML = `
                <ion-icon name="save-outline"></ion-icon>
                <span class="btn-text">Lưu bài viết</span>
            `;
        }
    }

    async saveArticle() {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.showLoading();
            
            const formData = this.collectFormData();
            const response = await window.apiClient.updateArticle(this.articleId, formData);
            
            if (response.success) {
                this.article = response.data;
                this.resetChangeState();
                this.showToast('Lưu bài viết thành công', 'success');
                
                // Update publish status if changed
                const newStatus = document.querySelector('input[name="status"]:checked').value;
                const shouldPublish = newStatus === 'published';
                
                if (shouldPublish !== this.article.isPublished) {
                    await this.updatePublishStatus(shouldPublish);
                }
            } else {
                throw new Error(response.message || 'Không thể lưu bài viết');
            }
        } catch (error) {
            console.error('Error saving article:', error);
            this.showToast('Lỗi khi lưu bài viết: ' + error.message, 'error');
        } finally {
            this.isLoading = false;
            this.hideLoading();
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

    async updatePublishStatus(publish) {
        try {
            const response = publish 
                ? await window.apiClient.publishArticle(this.articleId)
                : await window.apiClient.unpublishArticle(this.articleId);
            
            if (response.success) {
                this.article.isPublished = publish;
                const action = publish ? 'xuất bản' : 'gỡ xuất bản';
                this.showToast(`${action.charAt(0).toUpperCase() + action.slice(1)} bài viết thành công`, 'success');
            }
        } catch (error) {
            console.error('Error updating publish status:', error);
            this.showToast('Lỗi khi thay đổi trạng thái xuất bản', 'error');
        }
    }

    async handleImageUpload(file) {
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
        
        try {
            this.showLoading();
            
            const response = await window.apiClient.uploadArticleImage(this.articleId, file);
            
            if (response.success) {
                this.article.featuredImageUrl = response.data.featuredImageUrl;
                this.displayImage(response.data.featuredImageUrl);
                this.showToast('Upload ảnh thành công', 'success');
                this.markAsChanged();
            } else {
                throw new Error(response.message || 'Upload ảnh thất bại');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            this.showToast('Lỗi khi upload ảnh: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayImage(imageUrl) {
        const imagePreview = document.getElementById('imagePreview');
        const removeImageBtn = document.getElementById('removeImageBtn');
        
        if (imagePreview) {
            const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `http://localhost:8080${imageUrl}`;
            imagePreview.innerHTML = `<img src="${fullImageUrl}" alt="Featured Image" class="preview-image">`;
            imagePreview.classList.add('has-image');
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
        
        this.markAsChanged();
    }

    addTag(tagText) {
        if (!tagText || this.tags.includes(tagText)) return;
        
        this.tags.push(tagText);
        this.renderTags();
        this.markAsChanged();
    }

    removeTag(tagText) {
        this.tags = this.tags.filter(tag => tag !== tagText);
        this.renderTags();
        this.markAsChanged();
    }

    renderTags() {
        const tagsList = document.getElementById('tagsList');
        if (!tagsList) return;
        
        tagsList.innerHTML = this.tags.map(tag => `
            <span class="tag-item">
                ${tag}
                <button type="button" class="tag-remove" onclick="adminArticleEdit.removeTag('${tag}')">
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
                <div class="tour-option" onclick="adminArticleEdit.selectTour(${tour.id})">
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
        this.markAsChanged();
        
        // Clear search and hide dropdown
        const toursSearch = document.getElementById('toursSearch');
        const dropdown = document.getElementById('toursDropdown');
        
        if (toursSearch) toursSearch.value = '';
        if (dropdown) dropdown.classList.remove('show');
    }

    removeTour(tourId) {
        this.selectedTours = this.selectedTours.filter(tour => tour.id !== tourId);
        this.renderSelectedTours();
        this.markAsChanged();
    }

    renderSelectedTours() {
        const selectedTours = document.getElementById('selectedTours');
        if (!selectedTours) return;
        
        selectedTours.innerHTML = this.selectedTours.map(tour => `
            <div class="selected-tour">
                <span class="selected-tour-name">${tour.title}</span>
                <button type="button" class="remove-tour" onclick="adminArticleEdit.removeTour(${tour.id})">
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
        if (this.article && this.article.slug) {
            const previewUrl = `../article-detail.html?slug=${this.article.slug}`;
            window.open(previewUrl, '_blank');
        }
    }

    showDeleteModal() {
        this.showModal('deleteModal');
    }

    async confirmDelete() {
        try {
            this.showLoading();
            
            const response = await window.apiClient.deleteArticle(this.articleId);
            
            if (response.success) {
                this.showToast('Xóa bài viết thành công', 'success');
                this.hideModal('deleteModal');
                setTimeout(() => {
                    window.location.href = 'articles.html';
                }, 1000);
            } else {
                throw new Error(response.message || 'Không thể xóa bài viết');
            }
        } catch (error) {
            console.error('Error deleting article:', error);
            this.showToast('Lỗi khi xóa bài viết: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    goBack() {
        if (this.hasChanges) {
            if (confirm('Bạn có thay đổi chưa được lưu. Bạn có chắc muốn rời khỏi trang?')) {
                window.location.href = 'articles.html';
            }
        } else {
            window.location.href = 'articles.html';
        }
    }

    setupAutoSave() {
        // Auto save every 2 minutes
        setInterval(() => {
            if (this.hasChanges && !this.isLoading) {
                this.saveArticle();
            }
        }, 120000);
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
    window.adminArticleEdit = new AdminArticleEdit();
});

// Admin Tour Categories Management
class AdminTourCategories {
    constructor() {
        this.categories = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.totalItems = 0;
        this.totalPages = 0;
        this.filters = {
            keyword: '',
            status: ''
        };
        this.isLoading = false;
        this.editingCategoryId = null;

        this.init();
    }

    async init() {
        console.log('Initializing Admin Tour Categories...');
        
        // Check admin authentication
        if (!this.checkAdminAuth()) {
            return;
        }

        // Initialize elements
        this.initializeElements();
        this.bindEvents();
        
        // Load initial data
        await this.loadCategories();
        await this.loadStats();
        
        console.log('Admin Tour Categories initialized successfully');
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
        // Main elements
        this.categoriesGrid = document.getElementById('categoriesGrid');
        this.emptyState = document.getElementById('emptyState');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        // Search and filters
        this.searchInput = document.getElementById('searchInput');
        this.statusFilter = document.getElementById('statusFilter');
        
        // Stats elements
        this.totalCategoriesEl = document.getElementById('totalCategories');
        this.activeCategoriesEl = document.getElementById('activeCategories');
        this.toursInCategoriesEl = document.getElementById('toursInCategories');
        this.popularCategoryEl = document.getElementById('popularCategory');
        
        // Modal elements
        this.categoryModalOverlay = document.getElementById('categoryModalOverlay');
        this.deleteModalOverlay = document.getElementById('deleteModalOverlay');
        this.categoryForm = document.getElementById('categoryForm');
        this.modalTitle = document.getElementById('modalTitle');
        
        // Form inputs
        this.categoryNameInput = document.getElementById('categoryName');
        this.categorySlugInput = document.getElementById('categorySlug');
        this.categoryDescriptionInput = document.getElementById('categoryDescription');
        this.categoryIconInput = document.getElementById('categoryIcon');
        this.categoryColorInput = document.getElementById('categoryColor');
        this.categoryStatusInput = document.getElementById('categoryStatus');
        this.displayOrderInput = document.getElementById('displayOrder');
        
        // Buttons
        this.addCategoryBtn = document.getElementById('addCategoryBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        
        // Pagination
        this.paginationWrapper = document.getElementById('paginationWrapper');
        this.paginationInfo = document.getElementById('paginationInfo');
        this.pagination = document.getElementById('pagination');
    }

    bindEvents() {
        // Add category button
        if (this.addCategoryBtn) {
            this.addCategoryBtn.addEventListener('click', () => this.showCreateModal());
        }

        // Search and filters
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.debounce(() => {
                this.applyFilters();
            }, 300));
        }

        if (this.statusFilter) {
            this.statusFilter.addEventListener('change', () => this.applyFilters());
        }

        // Modal events
        this.bindModalEvents();
        
        // Form events
        this.bindFormEvents();
        
        // Icon selector events
        this.bindIconSelectorEvents();
    }

    bindModalEvents() {
        // Category modal
        const modalCloseBtn = document.getElementById('modalCloseBtn');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => this.hideModal());
        }

        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.hideModal());
        }

        // Delete modal
        const deleteModalCloseBtn = document.getElementById('deleteModalCloseBtn');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        if (deleteModalCloseBtn) {
            deleteModalCloseBtn.addEventListener('click', () => this.hideDeleteModal());
        }

        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => this.hideDeleteModal());
        }

        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
        }

        // Close modal when clicking overlay
        if (this.categoryModalOverlay) {
            this.categoryModalOverlay.addEventListener('click', (e) => {
                if (e.target === this.categoryModalOverlay) {
                    this.hideModal();
                }
            });
        }

        if (this.deleteModalOverlay) {
            this.deleteModalOverlay.addEventListener('click', (e) => {
                if (e.target === this.deleteModalOverlay) {
                    this.hideDeleteModal();
                }
            });
        }
    }

    bindFormEvents() {
        // Form submission
        if (this.categoryForm) {
            this.categoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCategory();
            });
        }

        // Auto-generate slug from name
        if (this.categoryNameInput) {
            this.categoryNameInput.addEventListener('input', () => {
                const slug = this.generateSlug(this.categoryNameInput.value);
                this.categorySlugInput.value = slug;
            });
        }

        // Color preview
        if (this.categoryColorInput) {
            this.categoryColorInput.addEventListener('input', () => {
                const colorPreview = document.getElementById('colorPreview');
                if (colorPreview) {
                    colorPreview.style.background = this.categoryColorInput.value;
                }
            });
        }
    }

    bindIconSelectorEvents() {
        const selectedIcon = document.getElementById('selectedIcon');
        const iconDropdown = document.getElementById('iconDropdown');
        const iconOptions = iconDropdown.querySelectorAll('.icon-option');

        // Toggle dropdown
        selectedIcon.addEventListener('click', () => {
            iconDropdown.classList.toggle('show');
        });

        // Select icon
        iconOptions.forEach(option => {
            option.addEventListener('click', () => {
                const iconName = option.dataset.icon;
                this.selectIcon(iconName);
                iconDropdown.classList.remove('show');
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!selectedIcon.contains(e.target) && !iconDropdown.contains(e.target)) {
                iconDropdown.classList.remove('show');
            }
        });
    }

    selectIcon(iconName) {
        const selectedIcon = document.getElementById('selectedIcon');
        const iconInput = document.getElementById('categoryIcon');
        const iconOptions = document.querySelectorAll('.icon-option');

        // Update selected icon display
        selectedIcon.querySelector('ion-icon').setAttribute('name', iconName);
        iconInput.value = iconName;

        // Update option states
        iconOptions.forEach(option => {
            option.classList.toggle('selected', option.dataset.icon === iconName);
        });
    }

    generateSlug(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    async loadCategories() {
        this.showLoading(true);
        
        try {
            const params = {
                page: this.currentPage - 1,
                size: this.itemsPerPage,
                sortBy: 'displayOrder',
                sortDir: 'asc',
                ...this.filters
            };

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            console.log('Loading categories with params:', params);
            
            // Simulate API call (replace with actual API when available)
            const response = await this.mockGetCategories(params);
            
            this.categories = response.content || [];
            this.totalItems = response.totalElements || 0;
            this.totalPages = response.totalPages || 0;

            this.renderCategories();
            this.renderPagination();

        } catch (error) {
            console.error('Error loading categories:', error);
            this.showError('Có lỗi khi tải danh sách danh mục');
        } finally {
            this.showLoading(false);
        }
    }

    async loadStats() {
        try {
            // Simulate stats API call (replace with actual API when available)
            const stats = await this.mockGetStats();
            
            this.totalCategoriesEl.textContent = stats.totalCategories;
            this.activeCategoriesEl.textContent = stats.activeCategories;
            this.toursInCategoriesEl.textContent = stats.toursInCategories;
            this.popularCategoryEl.textContent = stats.popularCategory || '-';

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    renderCategories() {
        if (!this.categoriesGrid) return;

        if (this.categories.length === 0) {
            this.categoriesGrid.style.display = 'none';
            this.emptyState.style.display = 'block';
            this.paginationWrapper.style.display = 'none';
            return;
        }

        this.categoriesGrid.style.display = 'grid';
        this.emptyState.style.display = 'none';
        this.paginationWrapper.style.display = 'flex';

        const html = this.categories.map(category => this.renderCategoryCard(category)).join('');
        this.categoriesGrid.innerHTML = html;
    }

    renderCategoryCard(category) {
        const statusClass = category.status === 'ACTIVE' ? 'active' : 'inactive';
        const statusText = category.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động';

        return `
            <div class="category-card" style="--category-color: ${category.color || '#007bff'}">
                <div class="category-header">
                    <div class="category-info">
                        <div class="category-icon">
                            <ion-icon name="${category.icon || 'pricetag-outline'}"></ion-icon>
                        </div>
                        <div class="category-details">
                            <h3>${category.name}</h3>
                            <div class="category-slug">${category.slug}</div>
                        </div>
                    </div>
                    <div class="category-actions">
                        <button class="btn-icon btn-outline" onclick="adminTourCategories.editCategory(${category.id})" title="Chỉnh sửa">
                            <ion-icon name="create-outline"></ion-icon>
                        </button>
                        <button class="btn-icon btn-danger" onclick="adminTourCategories.showDeleteModal(${category.id}, '${category.name}')" title="Xóa">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                </div>
                
                ${category.description ? `<div class="category-description">${category.description}</div>` : ''}
                
                <div class="category-meta">
                    <div class="category-stats">
                        <span>
                            <ion-icon name="map-outline"></ion-icon>
                            ${category.tourCount || 0} tours
                        </span>
                        <span>
                            <ion-icon name="reorder-two-outline"></ion-icon>
                            Thứ tự: ${category.displayOrder || 0}
                        </span>
                    </div>
                    <div class="category-status ${statusClass}">
                        ${statusText}
                    </div>
                </div>
            </div>
        `;
    }

    renderPagination() {
        if (!this.pagination || this.totalPages <= 1) {
            this.paginationWrapper.style.display = 'none';
            return;
        }

        this.paginationWrapper.style.display = 'flex';

        // Update pagination info
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
        this.paginationInfo.textContent = `Hiển thị ${start} - ${end} của ${this.totalItems} danh mục`;

        // Generate pagination buttons
        const buttons = this.generatePageNumbers();
        this.pagination.innerHTML = buttons.map(button => `
            <button ${button.disabled ? 'disabled' : ''} 
                    class="${button.active ? 'active' : ''}" 
                    onclick="adminTourCategories.goToPage(${button.page})">
                ${button.text}
            </button>
        `).join('');
    }

    generatePageNumbers() {
        const buttons = [];
        const maxVisible = 5;
        
        // Previous button
        buttons.push({
            page: this.currentPage - 1,
            text: '‹',
            disabled: this.currentPage === 1
        });

        // Calculate visible page range
        let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(this.totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        // Page numbers
        for (let i = start; i <= end; i++) {
            buttons.push({
                page: i,
                text: i.toString(),
                active: i === this.currentPage,
                disabled: false
            });
        }

        // Next button
        buttons.push({
            page: this.currentPage + 1,
            text: '›',
            disabled: this.currentPage === this.totalPages
        });

        return buttons;
    }

    applyFilters() {
        this.filters.keyword = this.searchInput.value.trim();
        this.filters.status = this.statusFilter.value;
        
        this.currentPage = 1;
        this.loadCategories();
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        this.loadCategories();
    }

    showCreateModal() {
        this.editingCategoryId = null;
        this.modalTitle.textContent = 'Thêm Danh mục Mới';
        this.saveBtn.querySelector('.btn-text').textContent = 'Tạo danh mục';
        
        this.resetForm();
        this.showModal();
    }

    editCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;

        this.editingCategoryId = categoryId;
        this.modalTitle.textContent = 'Chỉnh sửa Danh mục';
        this.saveBtn.querySelector('.btn-text').textContent = 'Cập nhật danh mục';
        
        this.populateForm(category);
        this.showModal();
    }

    populateForm(category) {
        this.categoryNameInput.value = category.name || '';
        this.categorySlugInput.value = category.slug || '';
        this.categoryDescriptionInput.value = category.description || '';
        this.categoryStatusInput.value = category.status || 'ACTIVE';
        this.displayOrderInput.value = category.displayOrder || 0;
        this.categoryColorInput.value = category.color || '#007bff';
        
        // Update color preview
        const colorPreview = document.getElementById('colorPreview');
        if (colorPreview) {
            colorPreview.style.background = category.color || '#007bff';
        }
        
        // Select icon
        this.selectIcon(category.icon || 'pricetag-outline');
    }

    resetForm() {
        this.categoryForm.reset();
        this.categoryColorInput.value = '#007bff';
        this.displayOrderInput.value = 0;
        
        // Reset color preview
        const colorPreview = document.getElementById('colorPreview');
        if (colorPreview) {
            colorPreview.style.background = '#007bff';
        }
        
        // Reset icon
        this.selectIcon('pricetag-outline');
        
        // Clear errors
        this.clearFormErrors();
    }

    async saveCategory() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            this.saveBtn.classList.add('loading');

            // Validate form
            if (!this.validateForm()) {
                return;
            }

            // Get form data
            const formData = this.getFormData();

            let response;
            if (this.editingCategoryId) {
                console.log('Updating category:', this.editingCategoryId, formData);
                response = await this.mockUpdateCategory(this.editingCategoryId, formData);
            } else {
                console.log('Creating category:', formData);
                response = await this.mockCreateCategory(formData);
            }

            this.showToast(
                this.editingCategoryId ? 'Cập nhật danh mục thành công!' : 'Tạo danh mục thành công!',
                'success'
            );

            this.hideModal();
            await this.loadCategories();
            await this.loadStats();

        } catch (error) {
            console.error('Error saving category:', error);
            this.showToast('Có lỗi khi lưu danh mục: ' + error.message, 'error');
        } finally {
            this.isLoading = false;
            this.saveBtn.classList.remove('loading');
        }
    }

    validateForm() {
        let isValid = true;
        this.clearFormErrors();

        // Required fields
        if (!this.categoryNameInput.value.trim()) {
            this.showFieldError('nameError', 'Tên danh mục là bắt buộc');
            isValid = false;
        }

        return isValid;
    }

    getFormData() {
        return {
            name: this.categoryNameInput.value.trim(),
            slug: this.categorySlugInput.value.trim(),
            description: this.categoryDescriptionInput.value.trim(),
            icon: this.categoryIconInput.value,
            color: this.categoryColorInput.value,
            status: this.categoryStatusInput.value,
            displayOrder: parseInt(this.displayOrderInput.value) || 0
        };
    }    showDeleteModal(categoryId, categoryName) {
        this.categoryToDelete = categoryId;
        document.getElementById('deleteItemName').textContent = categoryName;
        this.deleteModalOverlay.classList.add('show');
    }

    async confirmDelete() {
        if (!this.categoryToDelete) return;

        try {
            console.log('Deleting category:', this.categoryToDelete);
            await this.mockDeleteCategory(this.categoryToDelete);

            this.showToast('Xóa danh mục thành công!', 'success');
            this.hideDeleteModal();
            await this.loadCategories();
            await this.loadStats();

        } catch (error) {
            console.error('Error deleting category:', error);
            this.showToast('Có lỗi khi xóa danh mục: ' + error.message, 'error');
        }
    }    showModal() {
        this.categoryModalOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    hideModal() {
        this.categoryModalOverlay.classList.remove('show');
        document.body.style.overflow = '';
        this.resetForm();
    }

    hideDeleteModal() {
        this.deleteModalOverlay.classList.remove('show');
        this.categoryToDelete = null;
    }

    showFieldError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    clearFormErrors() {
        document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    }

    showLoading(show) {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        this.showToast(message, 'error');
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

    // Mock API methods (replace with actual API calls)
    async mockGetCategories(params) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        
        const mockCategories = [
            {
                id: 1,
                name: 'Tour Trong Nước',
                slug: 'tour-trong-nuoc',
                description: 'Các tour du lịch trong nước tại Việt Nam',
                icon: 'home-outline',
                color: '#28a745',
                status: 'ACTIVE',
                displayOrder: 1,
                tourCount: 25
            },
            {
                id: 2,
                name: 'Tour Quốc Tế',
                slug: 'tour-quoc-te',
                description: 'Các tour du lịch quốc tế',
                icon: 'airplane-outline',
                color: '#007bff',
                status: 'ACTIVE',
                displayOrder: 2,
                tourCount: 18
            },
            {
                id: 3,
                name: 'Tour Phiêu Lưu',
                slug: 'tour-phieu-luu',
                description: 'Các tour thể thao, phiêu lưu mạo hiểm',
                icon: 'compass-outline',
                color: '#fd7e14',
                status: 'ACTIVE',
                displayOrder: 3,
                tourCount: 12
            },
            {
                id: 4,
                name: 'Tour Văn Hóa',
                slug: 'tour-van-hoa',
                description: 'Khám phá văn hóa, lịch sử, di tích',
                icon: 'library-outline',
                color: '#6f42c1',
                status: 'ACTIVE',
                displayOrder: 4,
                tourCount: 8
            }
        ];

        let filteredCategories = mockCategories;
        
        // Apply filters
        if (params.keyword) {
            filteredCategories = filteredCategories.filter(category =>
                category.name.toLowerCase().includes(params.keyword.toLowerCase()) ||
                category.description.toLowerCase().includes(params.keyword.toLowerCase())
            );
        }
        
        if (params.status) {
            filteredCategories = filteredCategories.filter(category => category.status === params.status);
        }

        const start = (params.page || 0) * (params.size || 12);
        const end = start + (params.size || 12);
        const content = filteredCategories.slice(start, end);

        return {
            content,
            totalElements: filteredCategories.length,
            totalPages: Math.ceil(filteredCategories.length / (params.size || 12)),
            size: params.size || 12,
            number: params.page || 0
        };
    }

    async mockGetStats() {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return {
            totalCategories: 4,
            activeCategories: 4,
            toursInCategories: 63,
            popularCategory: 'Tour Trong Nước'
        };
    }

    async mockCreateCategory(categoryData) {
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log('Mock creating category:', categoryData);
        return { id: Date.now(), ...categoryData };
    }

    async mockUpdateCategory(categoryId, categoryData) {
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log('Mock updating category:', categoryId, categoryData);
        return { id: categoryId, ...categoryData };
    }

    async mockDeleteCategory(categoryId) {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Mock deleting category:', categoryId);
        return { success: true };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for API client to be available
    const initTourCategories = () => {
        if (typeof apiClient !== 'undefined' && apiClient) {
            window.adminTourCategories = new AdminTourCategories();
        } else {
            setTimeout(initTourCategories, 100);
        }
    };
    
    initTourCategories();
});

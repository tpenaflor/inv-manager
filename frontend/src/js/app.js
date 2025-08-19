// Configuration
const CONFIG = {
    API_BASE_URL: 'http://localhost:3000/api',
    TOKEN_KEY: 'inv_manager_token'
};

// Global state
let currentUser = null;
let categories = [];
let products = [];

// Utility functions
const getToken = () => localStorage.getItem(CONFIG.TOKEN_KEY);
const setToken = (token) => localStorage.setItem(CONFIG.TOKEN_KEY, token);
const removeToken = () => localStorage.removeItem(CONFIG.TOKEN_KEY);

const showAlert = (message, type = 'info') => {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show fade-in`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertContainer.appendChild(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.classList.remove('fade-in');
            alert.classList.add('fade-out');
            setTimeout(() => alert.remove(), 300);
        }
    }, 5000);
};

const apiRequest = async (url, options = {}) => {
    const token = getToken();
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: { ...defaultOptions.headers, ...options.headers }
    };

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${url}`, mergedOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};

// Authentication functions
const login = async (email, password) => {
    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        setToken(response.token);
        currentUser = response.user;
        showAlert('Login successful!', 'success');
        showDashboard();
        loadDashboardData();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
};

const logout = () => {
    removeToken();
    currentUser = null;
    showLogin();
    showAlert('Logged out successfully!', 'info');
};

const checkAuth = async () => {
    const token = getToken();
    if (!token) {
        showLogin();
        return;
    }

    try {
        const response = await apiRequest('/auth/profile');
        currentUser = response.user;
        showDashboard();
        loadDashboardData();
    } catch (error) {
        removeToken();
        showLogin();
        showAlert('Session expired. Please login again.', 'warning');
    }
};

// UI functions
const showLogin = () => {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
    updateAuthSection();
};

const showDashboard = () => {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    updateAuthSection();
};

const updateAuthSection = () => {
    const authSection = document.getElementById('authSection');
    if (currentUser) {
        authSection.innerHTML = `
            <span class="navbar-text me-3 user-info">
                <i class="fas fa-user"></i> ${currentUser.firstName} ${currentUser.lastName} 
                <span class="badge bg-secondary">${currentUser.role}</span>
            </span>
            <button class="btn btn-outline-light btn-sm" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
        
        // Show/hide admin-only elements
        const adminElements = document.querySelectorAll('#addCategoryBtn');
        adminElements.forEach(el => {
            el.style.display = currentUser.role === 'admin' ? 'block' : 'none';
        });
    } else {
        authSection.innerHTML = '';
    }
};

// Data loading functions
const loadDashboardData = async () => {
    try {
        await Promise.all([
            loadCategories(),
            loadProducts()
        ]);
        updateDashboardStats();
    } catch (error) {
        showAlert('Error loading dashboard data: ' + error.message, 'danger');
    }
};

const loadCategories = async () => {
    try {
        const response = await apiRequest('/categories');
        categories = response.categories;
        updateCategorySelect();
        renderCategories();
    } catch (error) {
        showAlert('Error loading categories: ' + error.message, 'danger');
    }
};

const loadProducts = async () => {
    try {
        const response = await apiRequest('/products');
        products = response.products;
        renderProducts();
    } catch (error) {
        showAlert('Error loading products: ' + error.message, 'danger');
    }
};

const updateDashboardStats = () => {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stockQuantity <= p.minStockLevel).length;
    const totalCategories = categories.length;
    const totalValue = products.reduce((sum, p) => sum + (p.stockQuantity * p.price), 0);

    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('lowStockItems').textContent = lowStockProducts;
    document.getElementById('totalCategories').textContent = totalCategories;
    document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
};

const updateCategorySelect = () => {
    const selects = document.querySelectorAll('select[name="categoryId"], #categoryFilter');
    selects.forEach(select => {
        const currentValue = select.value;
        const isFilter = select.id === 'categoryFilter';
        
        select.innerHTML = isFilter ? '<option value="">All Categories</option>' : '<option value="">Select Category</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
        
        if (currentValue) select.value = currentValue;
    });
};

const renderProducts = (filteredProducts = null) => {
    const productsToRender = filteredProducts || products;
    const tbody = document.getElementById('productsTableBody');
    
    if (productsToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No products found</td></tr>';
        return;
    }

    tbody.innerHTML = productsToRender.map(product => {
        const stockClass = product.stockQuantity === 0 ? 'out-of-stock' : 
                          product.stockQuantity <= product.minStockLevel ? 'low-stock' : '';
        
        return `
            <tr class="${stockClass}">
                <td>
                    <strong>${product.name}</strong>
                    ${product.description ? `<br><small class="text-muted">${product.description}</small>` : ''}
                </td>
                <td><code>${product.sku}</code></td>
                <td>
                    <span class="badge bg-primary">${product.category?.name || 'No Category'}</span>
                </td>
                <td>
                    <span class="badge ${product.stockQuantity === 0 ? 'bg-danger' : 
                                      product.stockQuantity <= product.minStockLevel ? 'bg-warning' : 'bg-success'}">
                        ${product.stockQuantity}
                    </span>
                    <small class="text-muted d-block">Min: ${product.minStockLevel}</small>
                </td>
                <td>$${parseFloat(product.price).toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="showStockModal(${product.id}, '${product.name}', ${product.stockQuantity})" title="Adjust Stock">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="viewProduct(${product.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
};

const renderCategories = () => {
    const tbody = document.getElementById('categoriesTableBody');
    
    if (categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No categories found</td></tr>';
        return;
    }

    tbody.innerHTML = categories.map(category => {
        const productCount = products.filter(p => p.categoryId === category.id).length;
        
        return `
            <tr>
                <td><strong>${category.name}</strong></td>
                <td>${category.description || '-'}</td>
                <td><span class="badge bg-info">${productCount}</span></td>
                <td>
                    ${currentUser?.role === 'admin' ? `
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editCategory(${category.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${category.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
};

// Modal functions
const showAddProductModal = () => {
    document.getElementById('addProductForm').reset();
    updateCategorySelect();
    new bootstrap.Modal(document.getElementById('addProductModal')).show();
};

const showAddCategoryModal = () => {
    document.getElementById('addCategoryForm').reset();
    new bootstrap.Modal(document.getElementById('addCategoryModal')).show();
};

const showStockModal = (productId, productName, currentStock) => {
    document.getElementById('stockProductId').value = productId;
    document.getElementById('currentStock').textContent = currentStock;
    document.getElementById('stockForm').reset();
    document.getElementById('stockProductId').value = productId;
    new bootstrap.Modal(document.getElementById('stockModal')).show();
};

// CRUD functions
const addProduct = async () => {
    try {
        const form = document.getElementById('addProductForm');
        const formData = new FormData(form);
        const productData = Object.fromEntries(formData.entries());

        // Convert numeric fields
        ['price', 'cost', 'stockQuantity', 'minStockLevel', 'categoryId'].forEach(field => {
            if (productData[field]) {
                productData[field] = parseFloat(productData[field]) || 0;
            }
        });

        await apiRequest('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });

        bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
        showAlert('Product added successfully!', 'success');
        loadProducts();
    } catch (error) {
        showAlert('Error adding product: ' + error.message, 'danger');
    }
};

const addCategory = async () => {
    try {
        const form = document.getElementById('addCategoryForm');
        const formData = new FormData(form);
        const categoryData = Object.fromEntries(formData.entries());

        await apiRequest('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });

        bootstrap.Modal.getInstance(document.getElementById('addCategoryModal')).hide();
        showAlert('Category added successfully!', 'success');
        loadCategories();
    } catch (error) {
        showAlert('Error adding category: ' + error.message, 'danger');
    }
};

const adjustStock = async () => {
    try {
        const productId = document.getElementById('stockProductId').value;
        const quantity = parseInt(document.getElementById('stockQuantity').value);
        const reason = document.getElementById('stockReason').value;
        const notes = document.getElementById('stockNotes').value;

        await apiRequest(`/products/${productId}/adjust-stock`, {
            method: 'POST',
            body: JSON.stringify({ quantity, reason, notes })
        });

        bootstrap.Modal.getInstance(document.getElementById('stockModal')).hide();
        showAlert('Stock adjusted successfully!', 'success');
        loadProducts();
    } catch (error) {
        showAlert('Error adjusting stock: ' + error.message, 'danger');
    }
};

// Search and filter functions
const setupFilters = () => {
    const searchInput = document.getElementById('productSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const lowStockFilter = document.getElementById('lowStockFilter');

    const applyFilters = () => {
        let filtered = [...products];

        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.sku.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm))
            );
        }

        const selectedCategory = categoryFilter.value;
        if (selectedCategory) {
            filtered = filtered.filter(product => product.categoryId == selectedCategory);
        }

        if (lowStockFilter.checked) {
            filtered = filtered.filter(product => product.stockQuantity <= product.minStockLevel);
        }

        renderProducts(filtered);
    };

    searchInput.addEventListener('input', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
    lowStockFilter.addEventListener('change', applyFilters);
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        await login(email, password);
    });

    // Setup filters
    setupFilters();

    // Check authentication status
    checkAuth();
});

// Additional utility functions for future features
const viewProduct = async (productId) => {
    try {
        const response = await apiRequest(`/products/${productId}`);
        // This would open a detailed view modal - simplified for now
        showAlert(`Viewing product: ${response.product.name}`, 'info');
    } catch (error) {
        showAlert('Error loading product details: ' + error.message, 'danger');
    }
};

const editCategory = (categoryId) => {
    // Simplified - would open edit modal
    showAlert('Edit category functionality would be implemented here', 'info');
};

const deleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
        await apiRequest(`/categories/${categoryId}`, { method: 'DELETE' });
        showAlert('Category deleted successfully!', 'success');
        loadCategories();
        loadProducts(); // Refresh products as they might be affected
    } catch (error) {
        showAlert('Error deleting category: ' + error.message, 'danger');
    }
};
// ==================== GLOBAL STATE ====================
let currentUser = null;
let cartItems = [];
let menuItems = [];
let categories = [];

// ==================== UTILITY FUNCTIONS ====================
const API_URL = '';

async function fetchAPI(endpoint, options = {}) {
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers },
            credentials: 'include'
        });
        return await res.json();
    } catch (err) {
        console.error('API Error:', err);
        return { error: err.message };
    }
}

function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✓' : '✕'}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function formatPrice(price) {
    return `₹${parseFloat(price).toFixed(2)}`;
}

// ==================== AUTH FUNCTIONS ====================
async function checkAuth() {
    const data = await fetchAPI('/api/check-auth');
    if (data.loggedIn) {
        currentUser = { id: data.userId, name: data.userName };
        updateNavbar();
        updateCartCount();
    }
    return data.loggedIn;
}

function updateNavbar() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;
    
    if (currentUser) {
        navActions.innerHTML = `
            <a href="cart.html" class="cart-icon">🛒<span class="cart-count" id="cart-count">0</span></a>
            <div class="user-menu">
                <span>👤 ${currentUser.name}</span>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="logout()">Logout</button>
        `;
    } else {
        navActions.innerHTML = `
            <a href="login.html" class="btn btn-secondary btn-sm">Login</a>
            <a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>
        `;
    }
}

async function login(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const data = await fetchAPI('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    
    if (data.success) {
        showToast('Login successful! Redirecting...');
        setTimeout(() => window.location.href = 'menu.html', 1000);
    } else {
        showToast(data.message, 'error');
    }
}

async function register(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const address = document.getElementById('address').value;
    
    if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }
    
    const data = await fetchAPI('/api/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, password, address })
    });
    
    if (data.success) {
        showToast('Registration successful! Please login.');
        setTimeout(() => window.location.href = 'login.html', 1000);
    } else {
        showToast(data.message, 'error');
    }
}

async function logout() {
    await fetchAPI('/api/logout', { method: 'POST' });
    currentUser = null;
    showToast('Logged out successfully!');
    setTimeout(() => window.location.href = 'index.html', 500);
}

// ==================== MENU FUNCTIONS ====================
async function loadCategories() {
    categories = await fetchAPI('/api/categories');
    const container = document.getElementById('categories-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="category-card active" data-id="all">
            <div class="category-icon">🍽️</div>
            <div class="category-name">All Items</div>
        </div>
        ${categories.map(cat => `
            <div class="category-card" data-id="${cat.id}">
                <div class="category-icon">${cat.icon}</div>
                <div class="category-name">${cat.name}</div>
            </div>
        `).join('')}
    `;
    
    container.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            container.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            loadMenu(card.dataset.id);
        });
    });
}

async function loadMenu(categoryId = 'all', vegFilter = null) {
    let url = '/api/menu?';
    if (categoryId !== 'all') url += `category=${categoryId}&`;
    if (vegFilter !== null) url += `veg=${vegFilter}`;
    
    menuItems = await fetchAPI(url);
    renderMenu(menuItems);
}

function renderMenu(items) {
    const container = document.getElementById('menu-container');
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <h3>No items found</h3>
                <p>Try selecting a different category</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="menu-item" data-id="${item.id}">
            <div class="item-image">
                <img src="images/${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/400x300?text=${encodeURIComponent(item.name)}'">
                <span class="veg-badge ${item.is_veg ? 'veg' : 'non-veg'}">${item.is_veg ? '🌿 Veg' : '🍖 Non-Veg'}</span>
                <span class="rating-badge"><span>⭐</span> ${item.rating}</span>
            </div>
            <div class="item-details">
                <h3 class="item-name">${item.name}</h3>
                <p class="item-description">${item.description}</p>
                <div class="item-footer">
                    <span class="item-price">${formatPrice(item.price)}</span>
                    <button class="add-to-cart" onclick="addToCart(${item.id})">+</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== CART FUNCTIONS ====================
async function addToCart(itemId) {
    if (!currentUser) {
        showToast('Please login to add items to cart', 'error');
        setTimeout(() => window.location.href = 'login.html', 1000);
        return;
    }
    
    const data = await fetchAPI('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ itemId, quantity: 1 })
    });
    
    if (data.success) {
        showToast('Added to cart!');
        updateCartCount();
    } else {
        showToast(data.message, 'error');
    }
}

async function updateCartCount() {
    const data = await fetchAPI('/api/cart');
    const countEl = document.getElementById('cart-count');
    if (countEl && data.items) {
        const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
        countEl.textContent = totalItems;
    }
}

async function loadCart() {
    const data = await fetchAPI('/api/cart');
    cartItems = data.items || [];
    renderCart();
    updateCartSummary(data.total || 0);
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    
    if (cartItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Your cart is empty</h3>
                <p>Add some delicious food from our menu!</p>
                <a href="menu.html" class="btn btn-primary">Browse Menu</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = cartItems.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-image">
                <img src="images/${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100x100?text=Food'">
            </div>
            <div class="cart-item-details">
                <h4 class="cart-item-name">${item.name}</h4>
                <span class="cart-item-price">${formatPrice(item.price)}</span>
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="updateCartItem(${item.id}, ${item.quantity - 1})">−</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateCartItem(${item.id}, ${item.quantity + 1})">+</button>
                </div>
            </div>
            <div class="remove-item" onclick="removeCartItem(${item.id})">🗑️</div>
        </div>
    `).join('');
}

function updateCartSummary(subtotal) {
    const delivery = subtotal > 0 ? 40 : 0;
    const tax = subtotal * 0.05;
    const total = subtotal + delivery + tax;
    
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('delivery').textContent = formatPrice(delivery);
    document.getElementById('tax').textContent = formatPrice(tax);
    document.getElementById('total').textContent = formatPrice(total);
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = cartItems.length === 0;
    }
}

async function updateCartItem(cartId, quantity) {
    await fetchAPI('/api/cart/update', {
        method: 'PUT',
        body: JSON.stringify({ cartId, quantity })
    });
    loadCart();
}

async function removeCartItem(cartId) {
    await fetchAPI(`/api/cart/remove/${cartId}`, { method: 'DELETE' });
    showToast('Item removed from cart');
    loadCart();
}

// ==================== CHECKOUT FUNCTIONS ====================
function openCheckoutModal() {
    if (cartItems.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }
    document.getElementById('checkout-modal').classList.add('active');
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.remove('active');
}

async function placeOrder(e) {
    e.preventDefault();
    
    const address = document.getElementById('delivery-address').value;
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'cod';
    
    const data = await fetchAPI('/api/orders/place', {
        method: 'POST',
        body: JSON.stringify({ address, paymentMethod })
    });
    
    if (data.success) {
        showToast('Order placed successfully!');
        closeCheckoutModal();
        setTimeout(() => window.location.href = 'history.html', 1500);
    } else {
        showToast(data.message, 'error');
    }
}

// ==================== ORDER HISTORY ====================
async function loadOrderHistory() {
    const orders = await fetchAPI('/api/orders');
    const container = document.getElementById('orders-container');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No orders yet</h3>
                <p>Start ordering delicious food now!</p>
                <a href="menu.html" class="btn btn-primary">Browse Menu</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-id">Order #${order.id}</div>
                    <div class="order-date">${new Date(order.created_at).toLocaleDateString('en-IN', { 
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}</div>
                </div>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div class="order-items-list">
                ${order.items.map(item => `
                    <div class="order-item-mini">
                        <img src="images/${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/40x40?text=Food'">
                        <span>${item.name} x${item.quantity}</span>
                    </div>
                `).join('')}
            </div>
            <div class="order-total">Total: ${formatPrice(order.total_amount)}</div>
        </div>
    `).join('');
}

// ==================== FILTER FUNCTIONS ====================
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            const activeCategory = document.querySelector('.category-card.active')?.dataset.id || 'all';
            
            if (filter === 'veg') {
                loadMenu(activeCategory, true);
            } else if (filter === 'nonveg') {
                loadMenu(activeCategory, false);
            } else {
                loadMenu(activeCategory);
            }
        });
    });
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    
    // Page-specific initialization
    const page = document.body.dataset.page;
    
    switch(page) {
        case 'home':
            loadCategories();
            loadMenu();
            break;
        case 'menu':
            loadCategories();
            loadMenu();
            setupFilters();
            break;
        case 'cart':
            loadCart();
            break;
        case 'history':
            loadOrderHistory();
            break;
    }
});
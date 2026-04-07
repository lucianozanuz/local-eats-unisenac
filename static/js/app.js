let cartItems = [];
let currentRestaurantId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Configura Badges Globais
    await loadUserProfile();

    // Rotemento simples
    const path = window.location.pathname;
    
    if (path.includes('restaurant.html')) {
        initRestaurantPage();
    } else if (path.includes('profile.html')) {
        initProfilePage();
    } else if (!path.includes('login.html') && !path.includes('orders.html')) {
        initHomePage();
    }
});

async function loadUserProfile() {
    const userBadge = document.getElementById('userBadge');
    if(!userBadge) return;

    if (!localStorage.getItem('userId')) return; // handled by auth.js checkAuth

    try {
        const user = await API.getUserProfile();
        if (user) {
            // Already handled by auth.js for basic badge, but let's just make sure
        }
    } catch(e) {
        if(e.message.includes("401") || e.message.includes("404")) {
            localStorage.clear();
            window.location.href = 'login.html';
        }
    }
}

// ============================================
// HOME PAGE (index.html)
// ============================================
async function initHomePage() {
    const grid = document.getElementById('restaurantGrid');
    if (!grid) return;

    let currentFilters = {};

    const renderGrid = (data) => {
        grid.innerHTML = '';
        if(!data || data.length === 0) {
            grid.innerHTML = `<div class="loading" style="grid-column: 1 / -1;">Nenhum restaurante encontrado.</div>`;
            return;
        }

        data.forEach(r => {
            const priceStr = "$".repeat(r.price_range);
            grid.innerHTML += `
                <a href="restaurant.html?id=${r.id}" class="rest-card">
                    <div class="img-wrapper">
                        <img src="${r.image_url}" alt="${r.name}" class="card-img" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'">
                    </div>
                    <div class="card-body">
                        <div class="card-title">
                            ${r.name}
                            <span class="price-badge">${priceStr}</span>
                        </div>
                        <div class="card-meta">
                            <span><i class="ri-restaurant-2-line"></i> ${r.cuisine_type}</span>
                            <span><i class="ri-map-pin-line"></i> ${r.location}</span>
                        </div>
                        <p class="card-desc">${r.description}</p>
                    </div>
                </a>
            `;
        });
    };

    const fetchAndRender = async () => {
        grid.innerHTML = '<div class="loading" style="grid-column: 1 / -1;"><i class="ri-loader-4-line ri-spin" style="font-size:24px;"></i> Buscando...</div>';
        try {
            const data = await API.getRestaurants(currentFilters);
            renderGrid(data);
        } catch(e) {
            grid.innerHTML = '<div class="loading" style="grid-column: 1 / -1;">Erro ao carregar restaurantes.</div>';
        }
    };

    // Filter Listeners
    const btnCategory = document.querySelectorAll('.filter-btn');
    btnCategory.forEach(btn => {
        btn.addEventListener('click', (e) => {
            btnCategory.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const cuisine = btn.getAttribute('data-cuisine');
            if(cuisine) {
                currentFilters.cuisine = cuisine;
            } else {
                delete currentFilters.cuisine;
            }
            fetchAndRender();
        });
    });

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if(searchBtn) {
        searchBtn.addEventListener('click', () => {
            const val = searchInput.value;
            if(val) {
                currentFilters.location = val;
            } else {
                delete currentFilters.location;
            }
            fetchAndRender();
        });
    }

    fetchAndRender();
}

// ============================================
// RESTAURANT PAGE & CART
// ============================================
async function initRestaurantPage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    currentRestaurantId = id;
    
    if(!id) {
        window.location.href = 'index.html';
        return;
    }

    const loader = document.getElementById('loadingDetail');
    const content = document.getElementById('restaurantContent');
    
    try {
        const rest = await API.getRestaurantDetails(id);
        if(!rest) throw new Error("Restaurante não encontrado");

        loader.classList.add('hidden');
        content.classList.remove('hidden');

        document.getElementById('restImage').src = rest.image_url;
        document.getElementById('restName').textContent = rest.name;
        document.getElementById('restPrice').textContent = "$".repeat(rest.price_range);
        document.getElementById('restCuisine').innerHTML = `<i class="ri-restaurant-2-line"></i> ${rest.cuisine_type}`;
        document.getElementById('restLocation').innerHTML = `<i class="ri-map-pin-line"></i> ${rest.location}`;
        document.getElementById('restDesc').textContent = rest.description;

        // Render Menu
        const menuList = document.getElementById('menuList');
        if(rest.menus && rest.menus.length > 0) {
            menuList.innerHTML = rest.menus.map(m => `
                <div class="menu-item">
                    <div class="menu-info">
                        <h4>${m.item_name}</h4>
                        <p>${m.description}</p>
                    </div>
                    <div class="menu-action">
                        <div class="menu-price">R$ ${m.price.toFixed(2)}</div>
                        <button class="add-cart-btn" onclick="addToCart(${m.id}, '${m.item_name}', ${m.price})">
                            <i class="ri-add-line"></i> Adicionar
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            menuList.innerHTML = '<p>Nenhum cardápio disponível.</p>';
        }

        // Render Reviews
        const reviewList = document.getElementById('reviewList');
        if(rest.reviews && rest.reviews.length > 0) {
            reviewList.innerHTML = rest.reviews.map(r => `
                <div class="review-item">
                    <div class="review-rating">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div>
                    <p>"${r.comment}"</p>
                </div>
            `).join('');
        } else {
            reviewList.innerHTML = '<p style="color:var(--text-muted)">Seja o primeiro a avaliar.</p>';
        }

        // Fav logic
        const favBtn = document.getElementById('favBtn');
        favBtn.addEventListener('click', async () => {
            favBtn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i>`;
            try {
                await API.addFavorite(id);
                favBtn.innerHTML = `<i class="ri-heart-fill"></i> Favoritado!`;
                favBtn.style.backgroundColor = 'var(--primary-color)';
                favBtn.style.color = 'white';
                favBtn.style.borderColor = 'var(--primary-color)';
            } catch(e) {
                alert("Erro ao favoritar: " + e.message);
                favBtn.innerHTML = `<i class="ri-heart-line"></i> Favoritar`;
            }
        });

        // Checkout Button
        document.getElementById('checkoutBtn').addEventListener('click', submitOrder);

    } catch(e) {
        loader.textContent = "Erro ao carregar restaurante: " + e.message;
    }
}

// Window functions for HTML onclick
window.switchTab = (tabName) => {
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    if(tabName === 'menu') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('menuTab').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('reviewsTab').classList.add('active');
    }
};

window.addToCart = (menuId, itemName, price) => {
    let existing = cartItems.find(i => i.menu_id === menuId);
    if(existing) {
        existing.quantity += 1;
    } else {
        cartItems.push({ menu_id: menuId, name: itemName, price: price, quantity: 1 });
    }
    updateCartUI();
};

window.removeFromCart = (menuId) => {
    let existing = cartItems.find(i => i.menu_id === menuId);
    if(existing) {
        existing.quantity -= 1;
        if(existing.quantity <= 0) {
            cartItems = cartItems.filter(i => i.menu_id !== menuId);
        }
    }
    updateCartUI();
};

function updateCartUI() {
    const cartEl = document.getElementById('floatingCart');
    const badge = document.getElementById('cartCountBadge');
    const list = document.getElementById('cartItemsList');
    const totalEl = document.getElementById('cartTotalValue');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if(cartItems.length > 0) {
        cartEl.classList.add('active');
        
        let totalItems = 0;
        let totalPrice = 0;
        list.innerHTML = '';
        
        cartItems.forEach(item => {
            totalItems += item.quantity;
            totalPrice += (item.quantity * item.price);
            list.innerHTML += `
                <div class="cart-item">
                    <span>${item.quantity}x ${item.name}</span>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <span>R$ ${(item.quantity * item.price).toFixed(2)}</span>
                        <i class="ri-subtract-line" style="cursor:pointer; color:var(--text-muted);" onclick="removeFromCart(${item.menu_id})"></i>
                    </div>
                </div>
            `;
        });
        
        badge.textContent = `${totalItems} itens`;
        totalEl.textContent = `R$ ${totalPrice.toFixed(2)}`;
        checkoutBtn.disabled = false;
        checkoutBtn.style.opacity = '1';
    } else {
        cartEl.classList.remove('active');
    }
}

async function submitOrder() {
    const btn = document.getElementById('checkoutBtn');
    btn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Processando...`;
    btn.disabled = true;

    try {
        const payload = cartItems.map(i => ({ menu_id: i.menu_id, quantity: i.quantity }));
        await API.createOrder(parseInt(currentRestaurantId), payload);
        
        // Success
        document.getElementById('floatingCart').classList.remove('active');
        document.getElementById('orderSuccessModal').style.display = 'block';
        cartItems = []; // clear
        updateCartUI();
        btn.innerHTML = `Finalizar Pedido`;
    } catch(err) {
        alert("Erro ao finalizar pedido: " + err.message);
        btn.innerHTML = `Finalizar Pedido`;
        btn.disabled = false;
    }
}

// ============================================
// PROFILE PAGE (profile.html)
// ============================================
async function initProfilePage() {
    const userNameNode = document.getElementById('userNameProfile');
    const grid = document.getElementById('favoritesGrid');

    try {
        const me = await API.getUserProfile();
        if(userNameNode) userNameNode.textContent = me.name;

        if(!me.favorites || me.favorites.length === 0) {
            grid.innerHTML = '<div class="loading" style="grid-column: 1 / -1;">Você ainda não tem locais favoritos.</div>';
            return;
        }

        grid.innerHTML = '';
        me.favorites.forEach(f => {
            if(!f.restaurant) return;
            const r = f.restaurant;
            const priceStr = "$".repeat(r.price_range);
            
            grid.innerHTML += `
                <div class="rest-card" style="cursor: default">
                    <div class="img-wrapper">
                        <a href="restaurant.html?id=${r.id}">
                            <img src="${r.image_url}" alt="${r.name}" class="card-img" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'">
                        </a>
                    </div>
                    <div class="card-body">
                        <div class="card-title">
                            <a href="restaurant.html?id=${r.id}" style="text-decoration:none; color:inherit;">${r.name}</a>
                            <span class="price-badge">${priceStr}</span>
                        </div>
                        <div class="card-meta">
                            <span><i class="ri-restaurant-2-line"></i> ${r.cuisine_type}</span>
                        </div>
                        <button class="filter-btn" style="margin-top:auto; width:100%" onclick="removeFav(${r.id}, this)">
                            <i class="ri-delete-bin-line"></i> Remover Favorito
                        </button>
                    </div>
                </div>
            `;
        });
    } catch(e) {
        grid.innerHTML = '<div class="loading" style="grid-column: 1 / -1;">Fazendo validação de segurança...</div>';
    }
}

window.removeFav = async (id, btn) => {
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i>';
    try {
        await API.removeFavorite(id);
        btn.closest('.rest-card').remove();
    } catch(e) {
        alert("Erro ao remover");
        btn.innerHTML = 'Remover Favorito';
    }
};

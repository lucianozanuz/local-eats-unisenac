document.addEventListener('DOMContentLoaded', async () => {
    // Configura Badges Globais
    await loadUserProfile();

    // Rotemento simples baseado em ID
    const path = window.location.pathname;
    
    if (path.includes('restaurant.html')) {
        initRestaurantPage();
    } else if (path.includes('profile.html')) {
        initProfilePage();
    } else {
        initHomePage();
    }
});

async function loadUserProfile() {
    const userBadge = document.getElementById('userBadge');
    if(!userBadge) return;

    const user = await API.getUserProfile();
    if (user) {
        userBadge.innerHTML = `<i class="ri-user-smile-line"></i> ${user.name}`;
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
            grid.innerHTML = `<div class="loading">Nenhum restaurante encontrado.</div>`;
            return;
        }

        data.forEach(r => {
            const priceStr = "$".repeat(r.price_range);
            grid.innerHTML += `
                <a href="restaurant.html?id=${r.id}" class="rest-card">
                    <img src="${r.image_url}" alt="${r.name}" class="card-img" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'">
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
        grid.innerHTML = '<div class="loading">Buscando...</div>';
        const data = await API.getRestaurants(currentFilters);
        renderGrid(data);
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

    searchBtn.addEventListener('click', () => {
        const val = searchInput.value;
        if(val) {
            currentFilters.location = val; // SMELL LÓGICO: O placeholder diz "culinária e localizacao" mas a busca manda location
        } else {
            delete currentFilters.location;
        }
        fetchAndRender();
    });

    // Initial Load
    fetchAndRender();
}

// ============================================
// RESTAURANT PAGE (restaurant.html)
// ============================================
async function initRestaurantPage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if(!id) {
        window.location.href = 'index.html';
        return;
    }

    const loader = document.getElementById('loadingDetail');
    const content = document.getElementById('restaurantContent');
    
    const rest = await API.getRestaurantDetails(id);
    
    if(!rest) {
        loader.textContent = "Erro ao carregar restaurante.";
        return;
    }

    loader.classList.add('hidden');
    content.classList.remove('hidden');

    document.getElementById('restImage').src = rest.image_url;
    document.getElementById('restName').textContent = rest.name;
    document.getElementById('restPrice').textContent = "$".repeat(rest.price_range);
    document.getElementById('restCuisine').innerHTML = `<i class="ri-restaurant-2-line"></i> ${rest.cuisine_type}`;
    document.getElementById('restLocation').innerHTML = `<i class="ri-map-pin-line"></i> ${rest.location}`;
    document.getElementById('restDesc').textContent = rest.description;

    // Tabs logic
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-target')).classList.add('active');
        });
    });

    // Render Menu
    const menuList = document.getElementById('menuList');
    if(rest.menus && rest.menus.length > 0) {
        menuList.innerHTML = rest.menus.map(m => `
            <div class="menu-item">
                <div>
                    <h4>${m.item_name}</h4>
                    <p>${m.description}</p>
                </div>
                <div class="menu-price">R$ ${m.price.toFixed(2)}</div>
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
        reviewList.innerHTML = '<p>Seja o primeiro a avaliar.</p>';
    }

    // Fav logic
    const favBtn = document.getElementById('favBtn');
    
    // SMELL LÓGICO: O fav não checa se o usuário DE FATO tem salvo ao inicializar a página para exibir ícone preenchido.
    favBtn.addEventListener('click', async () => {
        favBtn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> ...`;
        await API.addFavorite(id);
        favBtn.innerHTML = `<i class="ri-heart-fill"></i> Favoritado!`;
        favBtn.style.backgroundColor = 'var(--primary-color)';
        favBtn.style.color = 'white';
    });
}

// ============================================
// PROFILE PAGE (profile.html)
// ============================================
async function initProfilePage() {
    const userNameNode = document.getElementById('userNameProfile');
    const grid = document.getElementById('favoritesGrid');

    const me = await API.getUserProfile();
    if(!me) {
        grid.innerHTML = '<div class="loading">Erro ao carregar o perfil.</div>';
        return;
    }

    userNameNode.textContent = me.name;

    if(!me.favorites || me.favorites.length === 0) {
        grid.innerHTML = '<div class="loading">Você ainda não tem locais favoritos.</div>';
        return;
    }

    grid.innerHTML = '';
    me.favorites.forEach(f => {
        if(!f.restaurant) return;
        const r = f.restaurant;
        const priceStr = "$".repeat(r.price_range);
        
        // Render idêntico ao da home - mas com botão de remover
        grid.innerHTML += `
            <div class="rest-card" style="cursor: default">
                <a href="restaurant.html?id=${r.id}" style="text-decoration:none; color:inherit;">
                    <img src="${r.image_url}" alt="${r.name}" class="card-img" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'">
                </a>
                <div class="card-body">
                    <div class="card-title">
                        <a href="restaurant.html?id=${r.id}" style="text-decoration:none; color:inherit;">${r.name}</a>
                        <span class="price-badge">${priceStr}</span>
                    </div>
                    <div class="card-meta">
                        <span><i class="ri-restaurant-2-line"></i> ${r.cuisine_type}</span>
                    </div>
                    <button class="filter-btn" style="margin-top:10px; width:100%" onclick="removeFav(${r.id}, this)">
                        Remover Favorito
                    </button>
                </div>
            </div>
        `;
    });
}

window.removeFav = async (id, btn) => {
    btn.innerHTML = 'Removendo...';
    await API.removeFavorite(id);
    btn.closest('.rest-card').remove();
};

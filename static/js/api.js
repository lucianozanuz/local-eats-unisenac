// Configuração base da API
const BASE_URL = ''; 

// Pega ID Dinamicamente
function getUserId() {
    return localStorage.getItem("userId") || "";
}

async function fetchAPI(endpoint, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };
    
    const uid = getUserId();
    if(uid) {
        defaultHeaders['user-id'] = uid;
    }

    const config = {
        ...options,
        headers: { ...defaultHeaders, ...options.headers }
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        
        if (!response.ok) {
            const errBody = await response.text();
            console.error(`Erro na API (${response.status}):`, errBody);
            throw new Error(JSON.parse(errBody).detail || "Erro desconhecido da API");
        }

        if(response.status === 204 || response.headers.get('content-length') === '0') {
            return true;
        }

        return await response.json();
    } catch (err) {
        throw err;
    }
}

const API = {
    // Auth
    login: (email, password) => {
        return fetchAPI(`/users/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },
    
    register: (name, email, password) => {
        return fetchAPI(`/users/register`, {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
    },

    // Domínio Original
    getRestaurants: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const qs = query ? `?${query}` : '';
        return fetchAPI(`/restaurants/${qs}`);
    },
    
    getRestaurantDetails: (id) => {
        return fetchAPI(`/restaurants/${id}`);
    },
    
    addFavorite: (id) => {
        return fetchAPI(`/users/favorites/${id}`, { method: 'POST' });
    },
    
    removeFavorite: (id) => {
        return fetchAPI(`/users/favorites/${id}`, { method: 'DELETE' });
    },
    
    getUserProfile: () => {
        return fetchAPI(`/users/me`);
    },

    // Novo Domínio: Pedidos
    createOrder: (restaurantId, items) => {
        // items format: [{ menu_id: 1, quantity: 2 }]
        return fetchAPI(`/orders/`, {
            method: 'POST',
            body: JSON.stringify({ restaurant_id: restaurantId, items: items })
        });
    },

    getOrders: () => {
        return fetchAPI(`/orders/`);
    }
};

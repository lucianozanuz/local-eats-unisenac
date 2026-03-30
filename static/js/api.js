// Configuração base da API
const BASE_URL = 'http://127.0.0.1:8000';
// Mock de auth (usaremos o ID 2: User Teste)
const MOCK_USER_ID = "2";

async function fetchAPI(endpoint, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'user-id': MOCK_USER_ID
    };

    const config = {
        ...options,
        headers: { ...defaultHeaders, ...options.headers }
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        
        // BUG INTENCIONAL: Se response falhar (ex: 500 ou 404), nós apenas logamos no console e não propomos feedback visual limpo na maioria das chamadas
        if (!response.ok) {
            console.error(`Erro na API (${response.status}):`, await response.text());
            return null;
        }

        // Para requisições DELETE que não tem body
        if(response.status === 204 || response.headers.get('content-length') === '0') {
            return true;
        }

        return await response.json();
    } catch (err) {
        console.error("Fetch Exception:", err);
        return null;
    }
}

const API = {
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
    }
};

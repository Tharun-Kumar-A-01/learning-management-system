// Production URL - change this before building for deployment
const PRODUCTION_API_URL = 'https://learning-management-system-team-48.up.railway.app/api';

// Development uses localhost, production build uses the URL above
export const API_URL = import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : PRODUCTION_API_URL;

/**
 * Wrapper for the native fetch API
 * @param {string} endpoint - The API endpoint (e.g., '/auth/login')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} - The JSON response
 */
export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

import axios from 'axios';

// Base instance
const api = axios.create({
    baseURL: 'http://localhost:8000', // Adjust if your backend runs on a different port
});

// Request Interceptor: Attach the token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401 Unauthorized (Expired/Invalid Token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/'; // Redirect to Landing/Login page
        }
        return Promise.reject(error);
    }
);

export default api;
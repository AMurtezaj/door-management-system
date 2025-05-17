import axios from 'axios';

// Create axios instance with default configs
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Ensure token has Bearer prefix
      config.headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle expired tokens or unauthorized access
    if (error.response && error.response.status === 401) {
      console.error('Authentication error:', error.response.data.message || 'Unauthorized');
      localStorage.removeItem('token');
      
      // Only redirect if we're not already on the login page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Server down or network issues
    if (!error.response) {
      console.error('Network error or server is down');
    } else {
      console.error(`API Error (${error.response.status}):`, error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default api; 
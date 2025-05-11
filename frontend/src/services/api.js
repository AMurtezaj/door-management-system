import axios from 'axios';

// Use relative URL for the API base URL to leverage Vite's proxy
const API_URL = '/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Timeout after 30 seconds
  timeout: 30000,
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Get the token directly from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response.data, // Return data directly for convenience
  (error) => {
    const { response } = error;
    
    // Handle different error statuses
    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - redirect to login
          console.error('Unauthorized access, redirecting to login');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden
          console.error('Forbidden access to resource');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        case 500:
          // Server error
          console.error('Server error occurred');
          break;
        default:
          // Other errors
          console.error('API error:', response.data);
      }
    } else {
      // Network error or other issues
      console.error('Network error or server unreachable');
    }
    
    return Promise.reject(error);
  }
);

export default api; 
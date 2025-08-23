import axios from 'axios';

// Configuración base del cliente HTTP
const httpClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token de autenticación
httpClient.interceptors.request.use(
  (config) => {
    // Obtener token del localStorage
    const authTokens = localStorage.getItem('auth_tokens');
    if (authTokens) {
      try {
        const tokens = JSON.parse(authTokens);
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
      } catch (error) {
        console.warn('Error parsing auth tokens from localStorage:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      console.warn('Authentication error, redirecting to login');
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('last_login_time');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default httpClient;
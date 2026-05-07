const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (isLocal ? 'http://127.0.0.1:8000' : 'https://aura-backend.onrender.com');

console.log('Aura API Base URL:', API_BASE_URL);

export default API_BASE_URL;

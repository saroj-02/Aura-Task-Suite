const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' || 
                  window.location.hostname.startsWith('192.168.') ||
                  window.location.hostname.startsWith('10.') ||
                  window.location.port === '5173' || 
                  window.location.port === '4173' ||
                  import.meta.env.DEV;

const DEFAULT_BACKEND_HOST = 'https://aura-backend.onrender.com';

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL.startsWith('http') ? import.meta.env.VITE_API_URL : `https://${import.meta.env.VITE_API_URL}`)
  : DEFAULT_BACKEND_HOST; // Fallback to known backend host when VITE_API_URL is not provided

console.log('Aura API Base URL:', API_BASE_URL || '(Relative)');

export default API_BASE_URL;

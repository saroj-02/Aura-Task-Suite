const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' || 
                  window.location.hostname === '0.0.0.0';

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL.startsWith('http') ? import.meta.env.VITE_API_URL : `https://${import.meta.env.VITE_API_URL}`)
  : (isLocal ? 'http://127.0.0.1:8000' : ''); // Use relative URL in production if not specified

console.log('Aura API Base URL:', API_BASE_URL || '(Relative)');

export default API_BASE_URL;

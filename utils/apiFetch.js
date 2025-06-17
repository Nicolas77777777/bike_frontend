// utils/apiFetch.js - FRONTEND (per browser)

// ✅ Configurazione dinamica URL backend
const getBackendUrl = () => {
  // Se siamo in produzione Railway
  if (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')) {
    return 'https://bike-backend-production-9cc5.up.railway.app';
  }
  
  // Se siamo in produzione ma non Railway
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return 'https://bike-backend-production-9cc5.up.railway.app';
  }
  
  // Sviluppo locale
  return 'http://localhost:3000';
};

export async function apiFetch(path, options = {}) {
  const BACKEND_URL = getBackendUrl();
  const url = `${BACKEND_URL}${path}`;
  
  console.log('🔗 apiFetch URL:', url);
  console.log('🔗 BACKEND_URL:', BACKEND_URL);
  console.log('🌐 Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server');
  
  // ✅ USA FETCH NATIVO DEL BROWSER (non node-fetch)
  return fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
}
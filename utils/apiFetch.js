import fetch from 'node-fetch';

const BACKEND_URL = process.env.BACKEND_URL;

export async function apiFetch(path, options = {}) {
  const url = `${BACKEND_URL}${path}`;
  return fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
}

export async function apiFetch(path, options = {}) {
  const url = `${BACKEND_URL}${path}`;
  console.log('🔗 apiFetch URL COMPLETO:', url);  // ← AGGIUNGI QUESTO
  console.log('🔗 BACKEND_URL:', BACKEND_URL);    // ← E QUESTO
  
  return fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
}

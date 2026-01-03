// CONFIGURACIÓN DE HOSTINGER
// Cambia esta URL por la de tu backend en producción (ej: https://api.tudominio.com o https://vps-xxxx.hostinger.com)
const PROD_API_URL = "https://lapreviamaldita-production.up.railway.app"; 

export const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_URL = IS_LOCAL ? "http://localhost:8000" : PROD_API_URL;

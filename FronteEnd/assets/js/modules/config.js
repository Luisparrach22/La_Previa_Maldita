export const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_URL = IS_LOCAL ? "http://localhost:8000" : "https://lapreviamaldita-production.up.railway.app";

const PROD_API_URL = "http://72.62.170.24:8000"; 

// Detección más robusta de entorno local (incluye IPs de red local para simuladores/móviles)
export const IS_LOCAL = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' || 
                        window.location.hostname.startsWith('192.168.') || 
                        window.location.hostname.startsWith('10.') || 
                        window.location.hostname.startsWith('172.');

// En local, usamos el mismo hostname que la página pero con el puerto del backend (8000)
export const API_URL = IS_LOCAL ? `http://${window.location.hostname}:8000` : PROD_API_URL;


// ============================================================================
// API UTILITIES - La Previa Maldita
// Módulo centralizado para comunicación con el Backend
// ============================================================================

// Definir API_URL globalmente
const API_URL = "http://localhost:8000";
window.API_URL = API_URL;

/**
 * Sube una imagen al servidor de forma asíncrona.
 * Ideal para integrar en flujos de creación de productos o perfiles.
 * 
 * @param {File} file - El objeto File obtenido de un input type="file"
 * @returns {Promise<string>} - La URL pública de la imagen subida
 * @throws {Error} - Si la subida falla o el servidor no responde
 */
async function uploadImage(file) {
    // 1. Validaciones básicas
    if (!file) throw new Error("No se ha seleccionado ningún archivo");
    if (!file.type.startsWith('image/')) throw new Error("El archivo debe ser una imagen válida");
    if (file.size > 5 * 1024 * 1024) throw new Error("La imagen no debe superar los 5MB");

    // 2. Preparar el payload
    const formData = new FormData();
    formData.append('file', file);

    try {
        // 3. Enviar al backend
        const response = await fetch(`${API_URL}/upload/`, { 
            method: 'POST',
            body: formData,
            // NOTA: No establecer 'Content-Type' manualmente, 
            // fetch lo hace automáticamente para multipart/form-data
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error del servidor: ${response.status}`);
        }

        const data = await response.json();
        return data.url;

    } catch (error) {
        console.error("❌ Error en subida de imagen:", error);
        throw error;
    }
}

/**
 * Realiza una petición autenticada al backend.
 * Añade automáticamente el token JWT si existe.
 * 
 * @param {string} endpoint - Ruta del endpoint (sin el dominio)
 * @param {Object} options - Opciones de fetch (method, body, etc.)
 * @returns {Promise<Response>} - La respuesta del servidor
 */
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });
}

/**
 * Wrapper para peticiones GET autenticadas.
 * @param {string} endpoint 
 * @returns {Promise<any>} - Datos JSON de la respuesta
 */
async function apiGet(endpoint) {
    const response = await apiRequest(endpoint);
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Error en la petición');
    }
    return response.json();
}

/**
 * Wrapper para peticiones POST autenticadas.
 * @param {string} endpoint 
 * @param {Object} data - Datos a enviar en el body
 * @returns {Promise<any>} - Datos JSON de la respuesta
 */
async function apiPost(endpoint, data) {
    const response = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Error en la petición');
    }
    return response.json();
}

/**
 * Wrapper para peticiones PUT autenticadas.
 * @param {string} endpoint 
 * @param {Object} data - Datos a enviar en el body
 * @returns {Promise<any>} - Datos JSON de la respuesta
 */
async function apiPut(endpoint, data) {
    const response = await apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Error en la petición');
    }
    return response.json();
}

/**
 * Wrapper para peticiones DELETE autenticadas.
 * @param {string} endpoint 
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
async function apiDelete(endpoint) {
    const response = await apiRequest(endpoint, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Error en la petición');
    }
    return true;
}

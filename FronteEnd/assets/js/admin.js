// ============================================================================
// ADMIN PANEL - LA PREVIA MALDITA
// ============================================================================

const API_URL = "http://localhost:8000";
let adminToken = null;
let currentAdmin = null;

// Data caches
let usersCache = [];
let productsCache = [];
let ordersCache = [];

// Polling interval for real-time updates
let ordersPollingInterval = null;
const POLLING_INTERVAL_MS = 10000; // 10 segundos

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    checkAdminSession();
    updateCurrentDate();
    startOrdersPolling();
});

function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-ES', options);
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

async function checkAdminSession() {
    adminToken = localStorage.getItem('token');

    if (!adminToken) {
        redirectToLogin();  // Redirigir silenciosamente si no hay sesión
        return;
    }

    try {
        const res = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (res.ok) {
            currentAdmin = await res.json();

            // Verificar que sea admin
            if (currentAdmin.role !== 'admin') {
                redirectToLogin("No tienes permisos de administrador.");
                return;
            }

            setupAdminUI();
            loadDashboardData();
        } else {
            throw new Error('Sesión inválida');
        }
    } catch (e) {
        console.error("Error de sesión:", e);
        redirectToLogin("Tu sesión ha expirado. Inicia sesión nuevamente.");
    }
}

function redirectToLogin(message = null) {
    if (message) {
        alert(message);
    }
    localStorage.removeItem('token');
    window.location.href = '../index.html';
}

function setupAdminUI() {
    const displayName = currentAdmin.first_name || currentAdmin.username;
    document.getElementById('adminName').textContent = displayName;
    document.getElementById('adminAvatar').textContent = displayName.charAt(0).toUpperCase();
}

function logoutAdmin() {
    localStorage.removeItem('token');
    window.location.href = '../index.html';
}

// ============================================================================
// NAVIGATION
// ============================================================================

function switchSection(sectionId) {
    // Update nav
    document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // Update sections
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${sectionId}`).classList.add('active');

    // Update header
    const titles = {
        'dashboard': { title: 'Dashboard', subtitle: 'Vista general del sistema' },
        'users': { title: 'Usuarios', subtitle: 'Gestión de usuarios registrados' },
        'entradas': { title: 'Entradas', subtitle: 'Gestión de tickets y pases de acceso' },
        'products': { title: 'Productos', subtitle: 'Gestión de merchandise, bebidas y comida' },
        'orders': { title: 'Pedidos', subtitle: 'Gestión de pedidos y ventas' },

        'tickets': { title: 'Validar Tickets', subtitle: 'Verificar y marcar tickets como usados' }
    };

    document.getElementById('sectionTitle').textContent = titles[sectionId].title;
    document.getElementById('sectionSubtitle').textContent = titles[sectionId].subtitle;

    // Load section data
    switch (sectionId) {
        case 'dashboard': loadDashboardData(); break;
        case 'users': loadUsers(); break;
        case 'entradas': loadEntradas(); break;
        case 'products': loadProducts(); break;
        case 'orders': loadOrders(); break;

    }
}

// ============================================================================
// REAL-TIME UPDATES (POLLING)
// ============================================================================

function startOrdersPolling() {
    // Solo iniciar polling si hay token válido
    if (!localStorage.getItem('token')) return;

    // Limpiar intervalo anterior si existe
    if (ordersPollingInterval) {
        clearInterval(ordersPollingInterval);
    }

    // Iniciar nuevo polling
    ordersPollingInterval = setInterval(async () => {
        await refreshOrdersInBackground();
    }, POLLING_INTERVAL_MS);

    console.log('📡 Polling de pedidos iniciado (cada 10s)');
}

function stopOrdersPolling() {
    if (ordersPollingInterval) {
        clearInterval(ordersPollingInterval);
    }
}

// ============================================================================
// IMAGE UPLOAD HANDLING
// ============================================================================

async function uploadImage(context) {
    // context: 'entrada' or 'product'
    const fileInput = document.getElementById(`${context}ImageFile`);
    const hiddenInput = document.getElementById(`${context}Image`);
    const previewDiv = document.getElementById(`${context}ImagePreview`);
    const previewImg = document.getElementById(`${context}ImagePreviewImg`);
    const statusDiv = document.getElementById(`${context}UploadStatus`);

    if (!fileInput.files || !fileInput.files[0]) return;

    const file = fileInput.files[0];
    statusDiv.textContent = 'Subiendo...';
    statusDiv.className = 'upload-status';

    // 1. Show local preview immediately
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        previewDiv.classList.remove('hidden');
    }
    reader.readAsDataURL(file);

    // 2. Upload to server
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${API_URL}/upload/`, {
            method: 'POST',
            body: formData,
            // Header is NOT 'Content-Type': 'multipart/form-data' explicitly 
            // because browser sets it with boundary automatically
        });

        if (res.ok) {
            const data = await res.json();
            hiddenInput.value = data.url; // Save URL for final form submission
            statusDiv.textContent = '✅ Subida completada';
            statusDiv.className = 'upload-status success';
        } else {
            throw new Error('Falló la subida');
        }
    } catch (e) {
        console.error(e);
        statusDiv.textContent = '❌ Error al subir';
        statusDiv.className = 'upload-status error';
        alert("Error al subir imagen");
    }
}

function removeImage(context) {
    const fileInput = document.getElementById(`${context}ImageFile`);
    const hiddenInput = document.getElementById(`${context}Image`);
    const previewDiv = document.getElementById(`${context}ImagePreview`);
    const previewImg = document.getElementById(`${context}ImagePreviewImg`);
    const statusDiv = document.getElementById(`${context}UploadStatus`);

    fileInput.value = ''; // Reset file input
    hiddenInput.value = ''; // Clear stored URL
    previewImg.src = '';
    previewDiv.classList.add('hidden'); // Hide preview
    statusDiv.textContent = '';
}

async function refreshOrdersInBackground() {
    try {
        const res = await fetch(`${API_URL}/orders/`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (res.ok) {
            const newOrders = await res.json();

            // Detectar nuevos pedidos
            if (ordersCache.length > 0 && newOrders.length > ordersCache.length) {
                const newCount = newOrders.length - ordersCache.length;
                showNotification(`🆕 ${newCount} nuevo(s) pedido(s) recibido(s)!`, 'success');
            }

            ordersCache = newOrders;

            // Actualizar tabla si estamos en la sección de pedidos
            const ordersSection = document.getElementById('section-orders');
            if (ordersSection && ordersSection.classList.contains('active')) {
                renderOrdersTable(ordersCache);
            }

            // Actualizar dashboard si está visible
            const dashboardSection = document.getElementById('section-dashboard');
            if (dashboardSection && dashboardSection.classList.contains('active')) {
                document.getElementById('statOrders').textContent = ordersCache.length;
                renderRecentOrders(ordersCache.slice(0, 5));
            }
        }
    } catch (e) {
        console.warn('Error en polling de pedidos:', e);
    }
}

function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;

    // Agregar estilos si no existen
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .admin-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                border-radius: 8px;
                background: #1e293b;
                color: white;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 12px;
                animation: slideIn 0.3s ease;
            }
            .admin-notification.success { background: #059669; }
            .admin-notification.error { background: #dc2626; }
            .admin-notification.warning { background: #d97706; }
            .admin-notification button {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                opacity: 0.7;
            }
            .admin-notification button:hover { opacity: 1; }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// ============================================================================
// DASHBOARD
// ============================================================================

async function loadDashboardData() {
    try {
        // Load stats in parallel
        const [usersRes, ordersRes, productsRes] = await Promise.all([
            fetch(`${API_URL}/users/`, { headers: { 'Authorization': `Bearer ${adminToken}` } }),
            fetch(`${API_URL}/orders/`, { headers: { 'Authorization': `Bearer ${adminToken}` } }),
            fetch(`${API_URL}/products/`)
        ]);

        // Users count
        if (usersRes.ok) {
            const users = await usersRes.json();
            document.getElementById('statUsers').textContent = users.length;
            renderRecentUsers(users.slice(-5).reverse());
        }

        // Orders count & revenue
        if (ordersRes.ok) {
            const orders = await ordersRes.json();
            document.getElementById('statOrders').textContent = orders.length;

            const revenue = orders
                .filter(o => o.status === 'completed' || o.status === 'paid')
                .reduce((sum, o) => sum + parseFloat(o.total), 0);
            document.getElementById('statRevenue').textContent = `€${revenue.toFixed(2)}`;

            // Count tickets sold
            let ticketsSold = 0;
            orders.forEach(o => {
                if (o.items) {
                    o.items.forEach(item => {
                        if (item.product_type === 'ticket') ticketsSold += item.quantity;
                    });
                }
            });
            document.getElementById('statTickets').textContent = ticketsSold;

            renderRecentOrders(orders.slice(-5).reverse());
        }

    } catch (e) {
        console.error("Error loading dashboard data:", e);
    }
}

function renderRecentOrders(orders) {
    const container = document.getElementById('recentOrders');

    if (orders.length === 0) {
        container.innerHTML = '<p class="loading">No hay pedidos recientes</p>';
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="recent-item">
            <div class="recent-item-info">
                <span class="recent-item-title">${order.order_number || '#' + order.id}</span>
                <span class="recent-item-subtitle">${order.customer_email}</span>
            </div>
            <span class="recent-item-value">€${parseFloat(order.total).toFixed(2)}</span>
        </div>
    `).join('');
}

function renderRecentUsers(users) {
    const container = document.getElementById('recentUsers');

    if (users.length === 0) {
        container.innerHTML = '<p class="loading">No hay usuarios recientes</p>';
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="recent-item">
            <div class="recent-item-info">
                <span class="recent-item-title">${user.username}</span>
                <span class="recent-item-subtitle">${user.email}</span>
            </div>
            <span class="status-badge ${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Activo' : 'Inactivo'}</span>
        </div>
    `).join('');
}

// ============================================================================
// USERS MANAGEMENT
// ============================================================================

async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Cargando usuarios...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/users/`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (res.ok) {
            usersCache = await res.json();
            renderUsersTable(usersCache);
        } else {
            throw new Error('Error al cargar usuarios');
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">Error al cargar usuarios</td></tr>';
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No hay usuarios</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td><strong>${user.username}</strong></td>
            <td>${user.email}</td>
            <td>${user.first_name || ''} ${user.last_name || ''}</td>
            <td><span class="status-badge ${user.role}">${user.role}</span></td>
            <td><span class="status-badge ${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Activo' : 'Inactivo'}</span></td>
            <td>${user.auth_provider || 'email'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="editUser(${user.id})" title="Editar">✏️</button>
                    <button class="btn-icon delete" onclick="deleteUser(${user.id})" title="Eliminar">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterUsers() {
    const search = document.getElementById('searchUsers').value.toLowerCase();
    const filtered = usersCache.filter(u =>
        u.username.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        (u.first_name && u.first_name.toLowerCase().includes(search))
    );
    renderUsersTable(filtered);
}

function openUserModal(userId = null) {
    document.getElementById('userModal').classList.remove('hidden');
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userModalTitle').textContent = 'Nuevo Usuario';
    document.getElementById('userPassword').required = true;

    if (userId) {
        const user = usersCache.find(u => u.id === userId);
        if (user) {
            document.getElementById('userModalTitle').textContent = 'Editar Usuario';
            document.getElementById('userId').value = user.id;
            document.getElementById('userUsername').value = user.username;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userFirstName').value = user.first_name || '';
            document.getElementById('userLastName').value = user.last_name || '';
            document.getElementById('userRole').value = user.role;
            document.getElementById('userActive').value = user.is_active ? 'true' : 'false';
            document.getElementById('userPassword').required = false;
        }
    }
}

function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
}

function editUser(userId) {
    openUserModal(userId);
}

async function saveUser(event) {
    event.preventDefault();

    const userId = document.getElementById('userId').value;
    const payload = {
        username: document.getElementById('userUsername').value,
        email: document.getElementById('userEmail').value,
        first_name: document.getElementById('userFirstName').value || null,
        last_name: document.getElementById('userLastName').value || null,
        role: document.getElementById('userRole').value,
        is_active: document.getElementById('userActive').value === 'true'
    };

    const password = document.getElementById('userPassword').value;
    if (password) payload.password = password;

    try {
        const url = userId ? `${API_URL}/users/${userId}` : `${API_URL}/users/`;
        const method = userId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert(userId ? '✅ Usuario actualizado' : '✅ Usuario creado');
            closeUserModal();
            loadUsers();
        } else {
            const err = await res.json();
            alert('❌ Error: ' + (err.detail || 'No se pudo guardar'));
        }
    } catch (e) {
        alert('❌ Error de conexión');
    }
}

async function deleteUser(userId) {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;

    try {
        const res = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (res.ok) {
            alert('✅ Usuario eliminado');
            loadUsers();
        } else {
            alert('❌ No se pudo eliminar el usuario');
        }
    } catch (e) {
        alert('❌ Error de conexión');
    }
}

// ============================================================================
// ENTRADAS (TICKETS) MANAGEMENT
// ============================================================================

let entradasCache = [];

async function loadEntradas() {
    const tbody = document.getElementById('entradasTableBody');
    
    if (!tbody) {
        console.error('❌ ERROR: No se encontró el elemento entradasTableBody');
        return;
    }
    
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Cargando entradas...</td></tr>';
    
    console.log('🎫 Cargando entradas desde el backend...');

    try {
        const res = await fetch(`${API_URL}/products/admin/all`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        console.log('📡 Respuesta del servidor:', res.status);

        if (res.ok) {
            const allProducts = await res.json();
            console.log('📦 Total de productos recibidos:', allProducts.length);
            
            // Filtrar solo tickets
            entradasCache = allProducts.filter(p => p.type === 'ticket');
            console.log('🎟️ Tickets filtrados:', entradasCache.length);
            console.log('🎟️ Tickets:', entradasCache);
            
            renderEntradasTable(entradasCache);
        } else {
            const errorText = await res.text();
            console.error('❌ Error del servidor:', errorText);
            throw new Error('Error al cargar entradas');
        }
    } catch (e) {
        console.error('❌ Error cargando entradas:', e);
        tbody.innerHTML = '<tr><td colspan="8" class="loading">Error al cargar entradas. Revisa la consola (F12) para más detalles.</td></tr>';
    }
}

function renderEntradasTable(entradas) {
    console.log('🎨 Renderizando tabla de entradas...', entradas.length, 'entradas');
    const tbody = document.getElementById('entradasTableBody');

    if (entradas.length === 0) {
        console.log('⚠️ No hay entradas para mostrar');
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No hay entradas. Crea una nueva.</td></tr>';
        return;
    }

    const ticketTypeNames = {
        'general': 'General',
        'vip': 'VIP',
        'premium': 'Premium',
        'early_bird': 'Early Bird'
    };

    tbody.innerHTML = entradas.map(entrada => `
        <tr>
            <td>${entrada.id}</td>
            <td><strong>${entrada.name}</strong></td>
            <td><span class="status-badge ${entrada.ticket_type || 'general'}">${ticketTypeNames[entrada.ticket_type] || entrada.ticket_type || 'General'}</span></td>
            <td>€${parseFloat(entrada.price).toFixed(2)}</td>
            <td>${entrada.stock}</td>
            <td>${entrada.event_id ? 'Evento #' + entrada.event_id : 'Sin evento'}</td>
            <td><span class="status-badge ${entrada.is_active ? 'active' : 'inactive'}">${entrada.is_active ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="editEntrada(${entrada.id})" title="Editar">✏️</button>
                    <button class="btn-icon delete" onclick="deleteEntrada(${entrada.id})" title="Eliminar">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    console.log('✅ Tabla de entradas renderizada correctamente');
}

function filterEntradas() {
    const search = document.getElementById('searchEntradas').value.toLowerCase();
    const filtered = entradasCache.filter(e => e.name.toLowerCase().includes(search));
    renderEntradasTable(filtered);
}

function openEntradaModal(entradaId = null) {
    document.getElementById('entradaModal').classList.remove('hidden');
    document.getElementById('entradaForm').reset();
    document.getElementById('entradaId').value = '';
    document.getElementById('entradaModalTitle').textContent = 'Nueva Entrada';
    document.getElementById('entradaStock').value = '100';
    document.getElementById('entradaCategory').value = 'entrada';

    if (entradaId) {
        const entrada = entradasCache.find(e => e.id === entradaId);
        if (entrada) {
            document.getElementById('entradaModalTitle').textContent = 'Editar Entrada';
            document.getElementById('entradaId').value = entrada.id;
            document.getElementById('entradaName').value = entrada.name;
            document.getElementById('entradaDescription').value = entrada.description || '';
            document.getElementById('entradaTicketType').value = entrada.ticket_type || 'general';
            document.getElementById('entradaCategory').value = entrada.category || 'entrada';
            document.getElementById('entradaPrice').value = entrada.price;
            document.getElementById('entradaStock').value = entrada.stock;
            document.getElementById('entradaImage').value = entrada.image_url || '';
            document.getElementById('entradaActive').value = entrada.is_active ? 'true' : 'false';
            document.getElementById('entradaFeatured').value = entrada.is_featured ? 'true' : 'false';
            
            // Mostrar vista previa de imagen si existe
            if (entrada.image_url) {
                setTimeout(() => previewEntradaImage(), 100);
            }
        }
    }
}

function closeEntradaModal() {
    document.getElementById('entradaModal').classList.add('hidden');
}

function editEntrada(entradaId) {
    openEntradaModal(entradaId);
}

async function saveEntrada(event) {
    event.preventDefault();

    const entradaId = document.getElementById('entradaId').value;
    const payload = {
        name: document.getElementById('entradaName').value,
        description: document.getElementById('entradaDescription').value || null,
        type: 'ticket', // Siempre es ticket
        ticket_type: document.getElementById('entradaTicketType').value,
        category: document.getElementById('entradaCategory').value || 'entrada',
        price: parseFloat(document.getElementById('entradaPrice').value),
        stock: parseInt(document.getElementById('entradaStock').value),
        image_url: document.getElementById('entradaImage').value || null,
        is_active: document.getElementById('entradaActive').value === 'true',
        is_featured: document.getElementById('entradaFeatured').value === 'true'
    };

    try {
        const url = entradaId ? `${API_URL}/products/${entradaId}` : `${API_URL}/products/`;
        const method = entradaId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showNotification(entradaId ? '✅ Entrada actualizada' : '✅ Entrada creada', 'success');
            closeEntradaModal();
            loadEntradas();
        } else {
            const err = await res.json();
            alert('❌ Error: ' + (err.detail || 'No se pudo guardar'));
        }
    } catch (e) {
        alert('❌ Error de conexión');
    }
}

async function deleteEntrada(entradaId) {
    if (!confirm('¿Estás seguro de eliminar esta entrada? Los tickets vendidos seguirán siendo válidos.')) return;

    try {
        const res = await fetch(`${API_URL}/products/${entradaId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (res.ok) {
            showNotification('✅ Entrada eliminada', 'success');
            loadEntradas();
        } else {
            alert('❌ No se pudo eliminar la entrada');
        }
    } catch (e) {
        alert('❌ Error de conexión');
    }
}

// ============================================================================
// PRODUCTS MANAGEMENT (Merchandise, Bebidas, Comida - NO Tickets)
// ============================================================================

async function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Cargando productos...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/products/admin/all`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (res.ok) {
            const allProducts = await res.json();
            // Filtrar solo productos que NO son tickets
            productsCache = allProducts.filter(p => p.type !== 'ticket');
            renderProductsTable(productsCache);
        } else {
            throw new Error('Error al cargar productos');
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">Error al cargar productos</td></tr>';
    }
}

function renderProductsTable(products) {
    const tbody = document.getElementById('productsTableBody');

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No hay productos. Crea uno nuevo.</td></tr>';
        return;
    }

    const typeNames = {
        'merchandise': 'Merchandise',
        'drink': 'Bebida',
        'food': 'Comida',
        'experience': 'Experiencia'
    };

    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td><strong>${product.name}</strong></td>
            <td><span class="status-badge ${product.type}">${typeNames[product.type] || product.type}</span></td>
            <td>${product.category || '-'}</td>
            <td>€${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.stock}</td>
            <td><span class="status-badge ${product.is_active ? 'active' : 'inactive'}">${product.is_active ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="editProduct(${product.id})" title="Editar">✏️</button>
                    <button class="btn-icon delete" onclick="deleteProduct(${product.id})" title="Eliminar">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterProducts() {
    const search = document.getElementById('searchProducts').value.toLowerCase();
    const type = document.getElementById('filterProductType').value;

    let filtered = productsCache;

    if (search) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(search));
    }

    if (type) {
        filtered = filtered.filter(p => p.type === type);
    }

    renderProductsTable(filtered);
}

function openProductModal(productId = null) {
    document.getElementById('productModal').classList.remove('hidden');
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModalTitle').textContent = 'Nuevo Producto';

    if (productId) {
        const product = productsCache.find(p => p.id === productId);
        if (product) {
            document.getElementById('productModalTitle').textContent = 'Editar Producto';
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productType').value = product.type;
            document.getElementById('productCategory').value = product.category || '';
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productStock').value = product.stock;
            document.getElementById('productImage').value = product.image_url || '';
            document.getElementById('productActive').value = product.is_active ? 'true' : 'false';
            document.getElementById('productFeatured').value = product.is_featured ? 'true' : 'false';
        }
    }
}

function closeProductModal() {
    document.getElementById('productModal').classList.add('hidden');
}

function editProduct(productId) {
    openProductModal(productId);
}

async function saveProduct(event) {
    event.preventDefault();

    const productId = document.getElementById('productId').value;
    let imageUrl = document.getElementById('productImage').value || null;
    
    // Handle File Upload
    const fileInput = document.getElementById('productImageFile');
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const uploadRes = await fetch(`${API_URL}/products/upload/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                },
                body: formData
            });
            
            if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                imageUrl = uploadData.url;
            } else {
                alert('⚠️ No se pudo subir la imagen. Se guardará sin ella (o con la URL antigua).');
            }
        } catch (e) {
            console.error("Upload error", e);
            alert('⚠️ Error al subir la imagen.');
        }
    }

    const payload = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value || null,
        type: document.getElementById('productType').value,
        category: document.getElementById('productCategory').value || null,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        image_url: imageUrl,
        is_active: document.getElementById('productActive').value === 'true',
        is_featured: document.getElementById('productFeatured').value === 'true'
    };

    try {
        const url = productId ? `${API_URL}/products/${productId}` : `${API_URL}/products/`;
        const method = productId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert(productId ? '✅ Producto actualizado' : '✅ Producto creado');
            closeProductModal();
            loadProducts();
        } else {
            const err = await res.json();
            alert('❌ Error: ' + (err.detail || 'No se pudo guardar'));
        }
    } catch (e) {
        alert('❌ Error de conexión');
    }
}

async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
        const res = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (res.ok) {
            alert('✅ Producto eliminado');
            loadProducts();
        } else {
            alert('❌ No se pudo eliminar el producto');
        }
    } catch (e) {
        alert('❌ Error de conexión');
    }
}

// ============================================================================
// ORDERS MANAGEMENT
// ============================================================================

async function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Cargando pedidos...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/orders/`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (res.ok) {
            ordersCache = await res.json();
            renderOrdersTable(ordersCache);
        } else {
            throw new Error('Error al cargar pedidos');
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">Error al cargar pedidos</td></tr>';
    }
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTableBody');

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No hay pedidos</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>${order.order_number || '#' + order.id}</strong></td>
            <td>${order.customer_name || 'N/A'}</td>
            <td>${order.customer_email}</td>
            <td>€${parseFloat(order.total).toFixed(2)}</td>
            <td><span class="status-badge ${order.status}">${translateStatus(order.status)}</span></td>
            <td><span class="status-badge ${order.payment_status}">${translatePaymentStatus(order.payment_status)}</span></td>
            <td>${new Date(order.created_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon view" onclick="viewOrder(${order.id})" title="Ver detalle">👁️</button>
                    <button class="btn-icon edit" onclick="changeOrderStatus(${order.id})" title="Cambiar estado">📝</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterOrders() {
    const search = document.getElementById('searchOrders').value.toLowerCase();
    const status = document.getElementById('filterOrderStatus').value;

    let filtered = ordersCache;

    if (search) {
        filtered = filtered.filter(o =>
            (o.order_number && o.order_number.toLowerCase().includes(search)) ||
            o.customer_email.toLowerCase().includes(search)
        );
    }

    if (status) {
        filtered = filtered.filter(o => o.status === status);
    }

    renderOrdersTable(filtered);
}

function translateStatus(status) {
    const map = {
        'pending': 'Pendiente',
        'processing': 'Procesando',
        'confirmed': 'Confirmado',
        'paid': 'Pagado',
        'shipped': 'Enviado',
        'delivered': 'Entregado',
        'completed': 'Completado',
        'cancelled': 'Cancelado',
        'refunded': 'Reembolsado'
    };
    return map[status] || status;
}

function translatePaymentStatus(status) {
    const map = {
        'pending': 'Pendiente',
        'paid': 'Pagado',
        'failed': 'Fallido',
        'refunded': 'Reembolsado'
    };
    return map[status] || status;
}

async function viewOrder(orderId) {
    const order = ordersCache.find(o => o.id === orderId);
    if (!order) return;

    document.getElementById('orderModalNumber').textContent = order.order_number || '#' + order.id;

    const content = document.getElementById('orderModalContent');
    content.innerHTML = `
        <div class="order-details-container">
            <div class="order-info-grid">
                <div class="order-info-section">
                    <h4>Información del Cliente</h4>
                    <div class="order-info-item"><strong>Email:</strong> <span>${order.customer_email}</span></div>
                    <div class="order-info-item"><strong>Nombre:</strong> <span>${order.customer_name || 'N/A'}</span></div>
                    <div class="order-info-item"><strong>Teléfono:</strong> <span>${order.customer_phone || 'N/A'}</span></div>
                </div>
                <div class="order-info-section">
                    <h4>Estado del Pedido</h4>
                    <div class="order-info-item"><strong>Estado:</strong> <span class="status-badge ${order.status}">${translateStatus(order.status)}</span></div>
                    <div class="order-info-item"><strong>Pago:</strong> <span class="status-badge ${order.payment_status}">${translatePaymentStatus(order.payment_status)}</span></div>
                    <div class="order-info-item"><strong>Fecha:</strong> <span>${new Date(order.created_at).toLocaleString()}</span></div>
                </div>
            </div>
            
            <div class="order-info-section">
                <h4>Items del Pedido</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Tipo</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items ? order.items.map(item => `
                            <tr>
                                <td>${item.product_name}</td>
                                <td>${item.product_type || 'N/A'}</td>
                                <td>${item.quantity}</td>
                                <td>€${parseFloat(item.unit_price).toFixed(2)}</td>
                                <td>€${parseFloat(item.subtotal).toFixed(2)}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="5">Sin items</td></tr>'}
                    </tbody>
                </table>
            </div>
            
            <div class="order-total-section">
                <span class="order-total-label">Total del Pedido:</span>
                <span class="order-total-value">€${parseFloat(order.total).toFixed(2)}</span>
            </div>
        </div>
    `;

    document.getElementById('orderModal').classList.remove('hidden');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.add('hidden');
}

async function changeOrderStatus(orderId) {
    const order = ordersCache.find(o => o.id === orderId);
    if (!order) return;

    const newStatus = prompt(
        `Estado actual: ${translateStatus(order.status)}\n\nIngresa el nuevo estado:\n` +
        `- pending\n- processing\n- confirmed\n- paid\n- completed\n- cancelled`,
        order.status
    );

    if (!newStatus || newStatus === order.status) return;

    try {
        const res = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            alert('✅ Estado actualizado');
            loadOrders();
        } else {
            const err = await res.json();
            alert('❌ Error: ' + (err.detail || 'No se pudo actualizar'));
        }
    } catch (e) {
        alert('❌ Error de conexión');
    }
}



// ============================================================================
// TICKET VALIDATION
// ============================================================================

async function validateTicket() {
    const code = document.getElementById('ticketCodeInput').value.trim();
    const resultDiv = document.getElementById('validationResult');

    if (!code) {
        showNotification('Por favor ingresa un código de ticket', 'warning');
        return;
    }

    resultDiv.classList.add('hidden');

    try {
        // Usar el nuevo endpoint de validación
        const res = await fetch(`${API_URL}/orders/tickets/validate/${encodeURIComponent(code)}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (res.status === 404) {
            resultDiv.className = 'validation-result invalid';
            resultDiv.innerHTML = `
                <h3><span class="result-icon">❌</span> Ticket No Encontrado</h3>
                <p>El código "${code}" no existe en el sistema.</p>
            `;
            resultDiv.classList.remove('hidden');
            return;
        }

        if (!res.ok) throw new Error('Error al validar ticket');

        const ticketData = await res.json();

        if (ticketData.ticket_status === 'used') {
            resultDiv.className = 'validation-result used';
            resultDiv.innerHTML = `
                <h3><span class="result-icon">⚠️</span> Ticket Ya Usado</h3>
                <div class="result-details">
                    <span><strong>Código:</strong> ${ticketData.ticket_code}</span>
                    <span><strong>Producto:</strong> ${ticketData.product_name}</span>
                    <span><strong>Usado el:</strong> ${ticketData.ticket_used_at ? new Date(ticketData.ticket_used_at).toLocaleString() : 'N/A'}</span>
                </div>
            `;
        } else if (ticketData.ticket_status === 'valid') {
            resultDiv.className = 'validation-result valid';
            resultDiv.innerHTML = `
                <h3><span class="result-icon">✅</span> Ticket Válido</h3>
                <div class="result-details">
                    <span><strong>Código:</strong> ${ticketData.ticket_code}</span>
                    <span><strong>Producto:</strong> ${ticketData.product_name}</span>
                    <span><strong>Cliente:</strong> ${ticketData.customer_email || 'N/A'}</span>
                    <span><strong>Nombre:</strong> ${ticketData.customer_name || 'N/A'}</span>
                    <span><strong>Orden:</strong> ${ticketData.order_number || '#' + ticketData.order_id}</span>
                </div>
                <button class="btn-primary" style="margin-top: 16px; width: 100%;" onclick="markTicketAsUsed('${ticketData.ticket_code}')">
                    🎟️ Marcar como Usado
                </button>
            `;
        } else {
            resultDiv.className = 'validation-result invalid';
            resultDiv.innerHTML = `
                <h3><span class="result-icon">❌</span> Ticket Inválido</h3>
                <p>Estado del ticket: ${ticketData.ticket_status}</p>
            `;
        }

        resultDiv.classList.remove('hidden');

    } catch (e) {
        console.error("Error validando ticket:", e);
        resultDiv.className = 'validation-result invalid';
        resultDiv.innerHTML = `
            <h3><span class="result-icon">❌</span> Error</h3>
            <p>No se pudo validar el ticket. Verifica la conexión.</p>
        `;
        resultDiv.classList.remove('hidden');
    }
}

async function markTicketAsUsed(ticketCode) {
    if (!confirm('¿Marcar este ticket como usado? Esta acción no se puede deshacer.')) return;

    try {
        const res = await fetch(`${API_URL}/orders/tickets/use/${encodeURIComponent(ticketCode)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (res.ok) {
            const result = await res.json();
            showNotification(`✅ ${result.message}`, 'success');

            document.getElementById('ticketCodeInput').value = '';
            document.getElementById('validationResult').classList.add('hidden');
        } else {
            const err = await res.json().catch(() => ({}));
            showNotification(`❌ Error: ${err.detail || 'No se pudo marcar el ticket'}`, 'error');
        }
    } catch (e) {
        console.error("Error marcando ticket:", e);
        showNotification('❌ Error de conexión', 'error');
    }
}

// ============================================================================
// IMAGE PREVIEW HELPER
// ============================================================================
function previewEntradaImage() {
    const imageUrl = document.getElementById('entradaImage').value;
    const previewContainer = document.getElementById('entradaImagePreview');
    const previewImg = document.getElementById('entradaImagePreviewImg');
    
    if (imageUrl && imageUrl.trim() !== '') {
        previewImg.src = imageUrl;
        previewContainer.style.display = 'block';
        
        // Manejar error de carga de imagen
        previewImg.onerror = function() {
            previewContainer.style.display = 'none';
        };
    } else {
        previewContainer.style.display = 'none';
    }
}

// Close modals when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.add('hidden');
    }
}

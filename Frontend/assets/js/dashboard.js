import { API_URL } from './modules/config.js';
import { 
    initMemoryGame, 
    togglePauseMemory 
} from './modules/games.js';

// Expose to window for HTML onclick compatibility
window.initMemoryGame = initMemoryGame;
window.togglePauseMemory = togglePauseMemory;
window.switchTab = switchTab;
window.logoutUser = logoutUser;
window.updateProfile = updateProfile;
window.deleteAccount = deleteAccount;
window.closeTicketModal = closeTicketModal;
window.openTicketModal = openTicketModal;
window.buyProduct = buyProduct;

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
});

// ==========================================
// SESIÓN & NAVEGACIÓN
// ==========================================
async function checkSession() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const user = await res.json();
            setupUserUI(user);
            loadDashboardData(token);
        } else {
            throw new Error('Sesión inválida');
        }
    } catch (e) {
        console.error("Error de sesión:", e);
        alert("Tu sesión ha expirado o no hay conexión con el servidor.");
        localStorage.removeItem('token');
        window.location.href = '../index.html';
    }
}

// Hacer checkSession global para que los juegos puedan llamar para refrescar balance
window.checkSession = checkSession;

function setupUserUI(user) {
    const displayName = user.first_name || user.username;
    const userNameEl = document.getElementById('userNameDisplay');
    const userInitialsEl = document.getElementById('userInitials');
    const soulAmountEl = document.getElementById('soulBalanceAmount');
    
    if (userNameEl) userNameEl.textContent = displayName;
    if (userInitialsEl) userInitialsEl.textContent = displayName.charAt(0).toUpperCase();
    if (soulAmountEl) soulAmountEl.textContent = user.soul_balance || 0;
    
    const editUser = document.getElementById('editUsername');
    const editEmail = document.getElementById('editEmail');
    if (editUser) editUser.value = user.username;
    if (editEmail) editEmail.value = user.email;

    // Mostrar Rango
    const rank = user.rank || "Mortal";
    const rankSidebar = document.getElementById('userRankSidebar');
    if (rankSidebar) rankSidebar.textContent = rank;
    
    const rankTitleEl = document.getElementById('userRankTitle');
    if (rankTitleEl) rankTitleEl.textContent = rank;
}

function logoutUser() {
    localStorage.removeItem('token');
    window.location.href = '../index.html';
}

function switchTab(tabId) {
    document.querySelectorAll('.dashboard-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.dashboard-menu li').forEach(li => li.classList.remove('active'));

    const activeTab = document.getElementById(`tab-${tabId}`);
    if (activeTab) activeTab.classList.add('active');

    const menuItems = document.querySelectorAll('.dashboard-menu li');
    menuItems.forEach(item => {
        const onclickAttr = item.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(tabId)) {
            item.classList.add('active');
        }
    });

    if (tabId === 'games') {
        prepareMemoryGameUI();
    }
}

function prepareMemoryGameUI() {
    const grid = document.getElementById('memory-grid');
    if (grid) grid.innerHTML = '';
    
    const movesEl = document.getElementById('memory-moves');
    const timeEl = document.getElementById('memory-time');
    if (movesEl) movesEl.textContent = '0';
    if (timeEl) timeEl.textContent = '00:00';
    
    const btnStart = document.getElementById('btn-start-memory');
    const btnRestart = document.getElementById('btn-restart-memory');
    const btnPause = document.getElementById('btn-pause-memory');
    const overlay = document.getElementById('memory-paused-overlay');
    
    if (btnStart) btnStart.style.display = 'inline-block';
    if (btnRestart) btnRestart.style.display = 'none';
    if (btnPause) btnPause.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

// --- Submit Score (Unificado ahora en modules/games.js) ---

// ==========================================
// CARGA DE DATOS
// ==========================================

async function loadDashboardData(token) {
    // Cargar Orders y Tickets
    try {
        const res = await fetch(`${API_URL}/orders/my-orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const orders = await res.json();
            renderOrders(orders);
            renderTicketsFromOrders(orders);
        } else {
            console.warn("No se pudieron cargar los pedidos");
            renderOrders([]);
            renderTicketsFromOrders([]);
        }
    } catch (e) {
        console.error("Error loading orders", e);
        renderOrders([]);
        renderTicketsFromOrders([]);
    }

    // Cargar mejor puntuación DESDE EL BACKEND
    try {
        const resBest = await fetch(`${API_URL}/games/my-best`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resBest.ok) {
            const best = await resBest.json();
            document.getElementById('bestScore').textContent = best.points || "0";
        } else {
            console.warn("No best score found or error:", resBest.status);
            document.getElementById('bestScore').textContent = "0";
        }
    } catch (e) {
        console.error("Error loading best score", e);
        document.getElementById('bestScore').textContent = "0";
    }
    
    // Cargar Shop
    loadShopData(token);
}

// ==========================================
// RENDERIZADO
// ==========================================

function renderOrders(orders) {
    const tbody = document.getElementById('ordersList');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px;">No hay pedidos registrados.</td></tr>';
        return;
    }

    orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString();
        const itemNames = order.items ? order.items.map(i => i.product_name || i.product?.name || 'Producto').join(", ") : 'N/A';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-family:monospace; color:var(--dash-gold);">#${order.order_number || order.id}</td>
            <td>${itemNames}</td>
            <td>€${parseFloat(order.total).toFixed(2)}</td>
            <td><span class="status-badge ${order.status}">${translateStatus(order.status)}</span></td>
            <td>${date}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderTicketsFromOrders(orders) {
    const container = document.getElementById('ticketsList');
    container.innerHTML = '';

    let hasTickets = false;

    orders.forEach(order => {
        if (order.status !== 'completed' && order.status !== 'confirmed' && order.status !== 'paid') return;

        const items = order.items || [];
        items.forEach(item => {
            const productType = item.product_type || item.product?.type;
            if (productType === 'ticket') {
                hasTickets = true;
                // IMPORTANTE: Usar SOLO el código real del backend. No inventar códigos.
                const ticketId = item.ticket_code; 
                if (!ticketId) {
                    console.error("Ticket sin código:", item);
                    return; // No mostrar tickets corruptos o pendientes
                }
                const ticketName = item.product_name || item.product?.name || 'Ticket';

                const card = document.createElement('div');
                card.className = 'ticket-card-pro';
                card.onclick = () => openTicketModal(ticketName, ticketId, item.ticket_status || 'valid');

                card.innerHTML = `
                    <div class="ticket-content">
                        <div class="ticket-type">PASE DE ACCESO</div>
                        <div class="ticket-event">${ticketName}</div>
                        <div class="qr-placeholder" style="text-align:center;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(ticketId)}" alt="QR" style="width:80px; height:80px;" onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=font-size:3rem>🎟️</div>';">
                        </div>
                        <div class="ticket-id">${ticketId}</div>
                        <div style="text-align:center; margin-top:10px; font-size:0.8rem; color:#666;">
                            (Click para ampliar)
                        </div>
                    </div>
                `;
                container.appendChild(card);
            }
        });
    });

    if (!hasTickets) {
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px; color:#666;">No posees ningún ticket válido. Ve a la tienda para adquirir uno.</div>';
    }
}

function translateStatus(status) {
    const map = {
        'pending': 'Pendiente',
        'processing': 'Procesando',
        'confirmed': 'Confirmado',
        'paid': 'Pagado',
        'completed': 'Completado',
        'cancelled': 'Cancelado',
        'refunded': 'Reembolsado'
    };
    return map[status] || status;
}

// ==========================================
// TICKET MODAL LOGIC
// ==========================================

function openTicketModal(title, id, status) {
    // Forzar recarga de datos al abrir el modal para ver estado actualizado
    document.getElementById('modalTicketStatus').innerHTML = '<span class="loading-dots">Cargando...</span>';
    
    // Fetch latest status
    fetch(`${API_URL}/orders/tickets/status/${encodeURIComponent(id)}`, {
         headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(r => r.json())
    .then(data => {
         if(data.status) updateTicketModalStatus(data.status);
    })
    .catch(() => updateTicketModalStatus(status)); // Fallback to passed status

    document.getElementById('modalTicketTitle').textContent = title.toUpperCase();
    document.getElementById('modalTicketID').textContent = id;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(id)}`;
    const qrImg = document.getElementById('modalTicketQR');
    qrImg.src = qrUrl;
    qrImg.onerror = function() {
        this.style.display = 'none';
        this.parentElement.innerHTML = '<div style="font-size:5rem; padding:20px;">🎟️</div><p style="color:#888;">QR no disponible</p>';
    };

    document.getElementById('ticketModal').classList.remove('hidden');
}

function updateTicketModalStatus(status) {
    const statusEl = document.getElementById('modalTicketStatus');
    const statusText = status === 'valid' ? 'VÁLIDO' : status === 'used' ? 'USADO' : translateStatus(status).toUpperCase();
    statusEl.textContent = statusText;
    statusEl.className = `status-badge ${status}`;
}

function closeTicketModal() {
    document.getElementById('ticketModal').classList.add('hidden');
}

window.onclick = function (event) {
    const modal = document.getElementById('ticketModal');
    if (event.target == modal) {
        closeTicketModal();
    }
}

// ==========================================
// SETTINGS ACTIONS
// ==========================================

async function updateProfile() {
    const newUsername = document.getElementById('editUsername').value;
    const newEmail = document.getElementById('editEmail').value;
    const newPass = document.getElementById('editPassword').value;

    const payload = {};
    if (newUsername) payload.username = newUsername;
    if (newEmail) payload.email = newEmail;
    if (newPass) payload.password = newPass;

    if (Object.keys(payload).length === 0) {
        alert("No has cambiado nada.");
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/users/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("✅ Perfil actualizado correctamente.");

            // 1. Actualización visual inmediata (Optimistic UI update)
            if (newUsername) {
                document.getElementById('userNameDisplay').textContent = newUsername;
                document.getElementById('userInitials').textContent = newUsername.charAt(0).toUpperCase();
            }

            // 2. Recargar datos oficiales del servidor
            checkSession();
        } else {
            const err = await res.json().catch(() => ({}));
            alert("❌ Error: " + (err.detail || "No se pudo actualizar"));
        }
    } catch (e) {
        console.error("Error actualizando perfil:", e);
        alert("🔌 Error de conexión con el servidor.");
    }
}

async function deleteAccount() {
    if (!confirm("⚠️ ¿ESTÁS SEGURO?\n\nEsta acción borrará tu cuenta permanentemente.")) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/users/me`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            alert("Cuenta eliminada. Hasta nunca.");
            logoutUser();
        } else {
            const err = await res.json().catch(() => ({}));
            alert("❌ Error: " + (err.detail || "No se pudo eliminar la cuenta"));
        }
    } catch (e) {
        console.error("Error eliminando cuenta:", e);
        alert("🔌 Error de conexión con el servidor.");
    }
}

// ==========================================
// SHOP LOGIC
// ==========================================

async function loadShopData(token) {
    try {
        const res = await fetch(`${API_URL}/products/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const products = await res.json();
            renderShop(products);
        } else {
            console.warn("No se pudieron cargar los productos");
            document.getElementById('shopList').innerHTML = '<div style="color: #666;">La tienda está cerrada temporalmente.</div>';
        }
    } catch (e) {
        console.error("Error loading shop", e);
        document.getElementById('shopList').innerHTML = '<div style="color: #666;">Error de conexión con el inframundo.</div>';
    }
}

function renderShop(products) {
    const container = document.getElementById('shopList');
    container.innerHTML = '';

    if (!products || products.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px; color:#666;">No hay ofrendas disponibles por ahora.</div>';
        return;
    }

    products.forEach(product => {
        // filter out hidden products
        if (product.is_active === false || product.is_visible === false) return;

        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Image handling - use placeholder if URL looks relative or empty
        let imgUrl = product.image_url;
        if (!imgUrl || !imgUrl.startsWith('http')) {
            // Placeholder for now
             imgUrl = 'https://placehold.co/400x300/100000/bb0a1e?text=' + encodeURIComponent(product.name);
        }
        
        card.innerHTML = `
            <div class="product-image-container">
                <img src="${imgUrl}" alt="${product.name}" class="product-image">
            </div>
            <div class="product-info">
                <div style="font-size: 0.8rem; color: #666; text-transform: uppercase;">${product.type}</div>
                <h3>${product.name}</h3>
                <p style="color: #999; font-size: 0.9rem; margin-top: 5px; flex-grow: 1;">
                    ${product.short_description || product.description || 'Sin descripción'}
                </p>
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 15px;">
                    <span class="product-price">$${parseFloat(product.price).toFixed(2)}</span>
                </div>
                <button class="add-to-cart-btn" onclick="buyProduct(${product.id}, '${product.name}', ${product.price})">
                    ADQUIRIR
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

async function buyProduct(productId, productName, price) {
    if (!confirm(`¿Deseas invocar "${productName}" por $${price}?\n\nEl precio será descontado de tu balance de almas (si aplica) o generado como orden de pago.`)) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const payload = {
            items: [
                {
                    product_id: productId,
                    quantity: 1
                }
            ]
        };

        const res = await fetch(`${API_URL}/orders/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const order = await res.json();
            alert(`¡Pacto sellado! Has adquirido: ${productName}. \nOrden #${order.order_number}`);
            // Refresh data
            checkSession(); // To update balance
        } else {
            const err = await res.json();
            alert(`❌ El ritual falló: ${err.detail || 'Error desconocido'}`);
        }
    } catch (e) {
        console.error("Error buying product", e);
        alert("Error de conexión al intentar comprar.");
    }
}

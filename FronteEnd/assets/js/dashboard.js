// ==========================================
// CONFIGURACIÓN
// ==========================================
const API_URL = "http://localhost:8000";

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
});

// ==========================================
// SESIÓN & NAVEGACIÓN
// ==========================================
async function checkSession() {
    const token = localStorage.getItem('token');

    if (!token) {
        // Redirigir silenciosamente si no hay sesión
        window.location.href = 'index.html';
        return;
    }

    try {
        // Añadimos timestamp para evitar caché del navegador
        const res = await fetch(`${API_URL}/users/me?t=${new Date().getTime()}`, {
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
        window.location.href = 'index.html';
    }
}

function setupUserUI(user) {
    const displayName = user.first_name || user.username;
    document.getElementById('userNameDisplay').textContent = displayName;
    document.getElementById('editUsername').value = user.username;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('userInitials').textContent = displayName.charAt(0).toUpperCase();
}

function logoutUser() {
    localStorage.removeItem('token');
    window.location.href = '../index.html';
}

function switchTab(tabId) {
    document.querySelectorAll('.dashboard-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.dashboard-menu li').forEach(li => li.classList.remove('active'));

    document.getElementById(`tab-${tabId}`).classList.add('active');

    const menuItems = document.querySelectorAll('.dashboard-menu li');
    menuItems.forEach(item => {
        if (item.getAttribute('onclick').includes(tabId)) {
            item.classList.add('active');
        }
    });
}

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

    // Cargar mejor puntuación local
    document.getElementById('bestScore').textContent = localStorage.getItem('localHighScore') || "0";
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
                const ticketId = item.ticket_code || `TKT-${order.id}-${item.id}`;
                const ticketName = item.product_name || item.product?.name || 'Ticket';

                const card = document.createElement('div');
                card.className = 'ticket-card-pro';
                card.onclick = () => openTicketModal(ticketName, ticketId, item.ticket_status || 'valid');

                card.innerHTML = `
                    <div class="ticket-content">
                        <div class="ticket-type">PASE DE ACCESO</div>
                        <div class="ticket-event">${ticketName}</div>
                        <div class="qr-placeholder" style="text-align:center;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${ticketId}&color=000000" alt="QR" style="width:80px; height:80px;">
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
    document.getElementById('modalTicketTitle').textContent = title.toUpperCase();
    document.getElementById('modalTicketID').textContent = id;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${id}`;
    document.getElementById('modalTicketQR').src = qrUrl;

    const statusEl = document.getElementById('modalTicketStatus');
    const statusText = status === 'valid' ? 'VÁLIDO' : status === 'used' ? 'USADO' : translateStatus(status).toUpperCase();
    statusEl.textContent = statusText;
    statusEl.className = `status-badge ${status}`;

    document.getElementById('ticketModal').classList.remove('hidden');
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

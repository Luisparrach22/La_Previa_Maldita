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

    // Primero intentar recuperar usuario desde modo demo si existe
    /* NOTA: Para producción real, siempre validar token primero. 
       Aquí mantenemos soporte híbrido por si el backend falla. */
    const demoUserStr = localStorage.getItem('demoUser');

    if (!token && !demoUserStr) {
        window.location.href = 'index.html';
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
            throw new Error('Sesión inválida o backend offline');
        }
    } catch (e) {
        console.warn("Backend error:", e);
        if (demoUserStr) {
            console.log("Usando modo demo en dashboard");
            const demoUser = JSON.parse(demoUserStr);
            setupUserUI(demoUser);
            // Cargar datos ficticios para demo
            loadMockData();
        } else {
            alert("Tu sesión ha expirado. Debes volver a ingresar.");
            window.location.href = 'index.html';
        }
    }
}

function setupUserUI(user) {
    document.getElementById('userNameDisplay').textContent = user.username;
    document.getElementById('editUsername').value = user.username;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('userInitials').textContent = user.username.charAt(0).toUpperCase();
}

function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('demoUser');
    window.location.href = 'index.html';
}

function switchTab(tabId) {
    document.querySelectorAll('.dashboard-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.dashboard-menu li').forEach(li => li.classList.remove('active'));

    document.getElementById(`tab-${tabId}`).classList.add('active');

    // Activar item de menú correspondiente
    const menuItems = document.querySelectorAll('.dashboard-menu li');
    menuItems.forEach(item => {
        if (item.getAttribute('onclick').includes(tabId)) {
            item.classList.add('active');
        }
    });
}

// ==========================================
// CARGA DE DATOS (REAL & MOCK)
// ==========================================

async function loadDashboardData(token) {
    // 1. Cargar Orders (y filtrar Tickets de ahí)
    try {
        const res = await fetch(`${API_URL}/orders/my-orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const orders = await res.json();
            renderOrders(orders);
            renderTicketsFromOrders(orders);
        }
    } catch (e) { console.error("Error loading orders", e); }

    // 2. Cargar Scores (No existe endpoint user stats directo, usamos ranking o calculamos local si hay lista)
    //    Si existe endpoint /games/my-stats sería ideal, sino simulamos o listamos todos
    //    NOTA: El backend actual tiene /games/ (get all scores). Podemos filtrar ahí.
    /* TODO: Implementar get_my_scores en backend para eficiencia. Por ahora omitimos o simulamos. */
    document.getElementById('bestScore').textContent = localStorage.getItem('localHighScore') || "0";
}

function loadMockData() {
    // Simulamos orders
    const mockOrders = [
        {
            id: 666,
            created_at: new Date().toISOString(),
            total: 19.79,
            status: 'completed',
            items: [
                { product: { name: 'Ticket Demonio', type: 'ticket' } },
                { product: { name: 'Poción de Sangre', type: 'potions' } }
            ]
        },
        {
            id: 667,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            total: 6.66,
            status: 'pending',
            items: [
                { product: { name: 'Ticket Mortal', type: 'ticket' } }
            ]
        }
    ];
    renderOrders(mockOrders);
    renderTicketsFromOrders(mockOrders);
    document.getElementById('bestScore').textContent = localStorage.getItem('localHighScore') || "666";
}

// ==========================================
// RENDERIZADO
// ==========================================

function renderOrders(orders) {
    const tbody = document.getElementById('ordersList');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px;">No hay pactos registrados.</td></tr>';
        return;
    }

    orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString();
        // Asumiendo order.items existe
        const itemNames = order.items.map(i => i.product.name).join(", ");

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-family:monospace; color:var(--dash-gold);">#${order.id}</td>
            <td>${itemNames}</td>
            <td>$${order.total}</td>
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
        // Solo mostrar tickets de ordenes pagadas/completadas? O pending también?
        // Mostremos completed y confirmed.
        if (order.status !== 'completed' && order.status !== 'confirmed') return;

        order.items.forEach(item => {
            if (item.product.type === 'ticket') {
                hasTickets = true;
                const ticketId = `TKT-${order.id}-${item.id || Math.floor(Math.random() * 1000)}`;

                const card = document.createElement('div');
                card.className = 'ticket-card-pro';
                // Añadimos evento onclick para abrir modal
                card.onclick = () => openTicketModal(item.product.name, ticketId, order.status);

                card.innerHTML = `
                    <div class="ticket-content">
                        <div class="ticket-type">PASE DE ACCESO</div>
                        <div class="ticket-event">${item.product.name}</div>
                        <div class="qr-placeholder" style="text-align:center;">
                            <!-- QR Thumbnail -->
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
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px; color:#666;">No posees ningún ticket válido. Ve a la tienda para sacrificar tu dinero.</div>';
    }
}

function translateStatus(status) {
    const map = {
        'pending': 'Pendiente',
        'confirmed': 'Confirmado',
        'completed': 'Completado',
        'cancelled': 'Cancelado'
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
    statusEl.textContent = status === 'completed' ? 'VÁLIDO' : translateStatus(status).toUpperCase();
    statusEl.className = `status-badge ${status}`;

    document.getElementById('ticketModal').classList.remove('hidden');
}

function closeTicketModal() {
    document.getElementById('ticketModal').classList.add('hidden');
}

// Cerrar modal al hacer click fuera
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
    const newEmail = document.getElementById('editEmail').value;
    const newPass = document.getElementById('editPassword').value;

    const payload = {};
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
            alert("Perfil actualizado correctamente.");
            // Si cambió password, quizas logout?
        } else {
            const err = await res.json();
            alert("Error: " + (err.detail || "No se pudo actualizar"));
        }
    } catch (e) {
        alert("Modo Demo: Perfil actualizado (simulado).");
    }
}

async function deleteAccount() {
    if (!confirm("¿ESTAS SEGURO? Esta acción borrará tu cuenta permanentemente.")) return;

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
            alert("Error al eliminar cuenta.");
        }
    } catch (e) {
        alert("Modo Demo: Cuenta eliminada (simulada).");
        logoutUser();
    }
}

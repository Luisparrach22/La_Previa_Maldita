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
    
    // Mostrar balance de almas
    const soulBalance = user.soul_balance || 0;
    document.getElementById('soulBalanceAmount').textContent = soulBalance;
    
    console.log('👻 Balance de almas:', soulBalance);
}

function logoutUser() {
    localStorage.removeItem('token');
    window.location.href = '../index.html';
}

function switchTab(tabId) {
    // Detener juegos si están activos
    stopActiveGames();

    document.querySelectorAll('.dashboard-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.dashboard-menu li').forEach(li => li.classList.remove('active'));

    document.getElementById(`tab-${tabId}`).classList.add('active');

    const menuItems = document.querySelectorAll('.dashboard-menu li');
    menuItems.forEach(item => {
        if (item.getAttribute('onclick').includes(tabId)) {
            item.classList.add('active');
        }
    });

    if (tabId === 'games') {
        // Preparar el tablero pero no auto-iniciar
        prepareMemoryGameUI();
    }
}



/* ==================== GAMES LOGIC (MEMORY ONLY) ==================== */

function prepareMemoryGameUI() {
    // Resetear tablero y UI sin auto-iniciar el juego
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    
    // Resetear estadísticas
    memorySeconds = 0;
    moves = 0;
    matchedPairs = 0;
    
    document.getElementById('memory-moves').textContent = moves;
    document.getElementById('memory-time').textContent = '00:00';
    
    // Mostrar solo el botón de Iniciar
    document.getElementById('btn-start-memory').style.display = 'inline-block';
    document.getElementById('btn-restart-memory').style.display = 'none';
    document.getElementById('btn-pause-memory').style.display = 'none';
    
    // Ocultar overlay de pausa
    document.getElementById('memory-paused-overlay').style.display = 'none';
}

let memoryInterval = null;
let memoryPeekTimeout = null;
let memorySeconds = 0;
let memoryPaused = false;
let memoryGameActive = false;

// --- Game Navigation & Cleanup ---

function stopActiveGames() {
    // Stop Memory Timer
    if (memoryInterval) {
        clearInterval(memoryInterval);
        memoryInterval = null;
    }
    if (memoryPeekTimeout) {
        clearTimeout(memoryPeekTimeout);
        memoryPeekTimeout = null;
    }
    memoryGameActive = false;
}

// Hook called when switching tabs
// We can auto-start or just reset. Let's reset but not auto-start if we want to wait for user?
// Or better, if the user clicks "Games", we start the game fresh?
// For now, `switchTab` calls this.

// --- Memory Game Logic ---
const memoryIcons = ['💀', '🧛', '🧟', '👻', '🕸️', '⚰️', '🩸', '🎃'];
let memoryCards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let lockBoard = false;

function initMemoryGame() {
    console.log('🎮 Iniciando juego de memoria con vista previa...');
    
    // Llamar a startMemoryGame para crear el tablero
    startMemoryGame();
    
    // Ocultar botón "Iniciar" y mostrar botones de control
    document.getElementById('btn-start-memory').style.display = 'none';
    document.getElementById('btn-restart-memory').style.display = 'inline-block';
    document.getElementById('btn-pause-memory').style.display = 'inline-block';
    
    // Mostrar todas las cartas durante 3 segundos (peek)
    const allCards = document.querySelectorAll('.memory-card');
    lockBoard = true; // Bloquear clics durante la vista previa
    
    // Voltear todas las cartas
    allCards.forEach(card => {
        card.classList.add('flipped');
    });
    
    console.log('👀 Mostrando todas las cartas por 3 segundos...');
    
    // Después de 3 segundos, ocultar todas las cartas y comenzar el juego
    memoryPeekTimeout = setTimeout(() => {
        console.log('🙈 Ocultando cartas - ¡El juego comienza!');
        allCards.forEach(card => {
            card.classList.remove('flipped');
        });
        lockBoard = false; // Desbloquear para que el jugador pueda jugar
    }, 3000); // 3 segundos de vista previa
}

function startMemoryGame() {
    stopActiveGames(); // Stop any running timers
    
    // Reset UI
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    document.getElementById('memory-paused-overlay').style.display = 'none';
    
    // Reset Variables
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    lockBoard = false; // Allow playing from start
    memorySeconds = 0;
    memoryPaused = false;
    memoryGameActive = true;
    
    // Update Stats
    document.getElementById('memory-moves').textContent = moves;
    updateTimerDisplay();
    
    // Setup Cards
    memoryCards = [...memoryIcons, ...memoryIcons]; 
    memoryCards.sort(() => 0.5 - Math.random());
    
    memoryCards.forEach((icon, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card'; // Start hidden (no flipped class)
        card.dataset.index = index;
        card.dataset.icon = icon;
        // Front=Icon (revealed), Back=Empty (covered/hidden with red bg from CSS)
        card.innerHTML = `<div class="front">${icon}</div>`;
        card.onclick = () => flipCard(card);
        grid.appendChild(card);
    });

    // Start Timer immediately
    startMemoryTimer();
}

function startMemoryTimer() {
    if (memoryInterval) clearInterval(memoryInterval);
    memoryInterval = setInterval(() => {
        if (!memoryPaused) {
            memorySeconds++;
            updateTimerDisplay();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const min = Math.floor(memorySeconds / 60).toString().padStart(2, '0');
    const sec = (memorySeconds % 60).toString().padStart(2, '0');
    const timerEl = document.getElementById('memory-time');
    if(timerEl) timerEl.textContent = `${min}:${sec}`;
}

function togglePauseMemory() {
    if (!memoryGameActive) return; // Can't pause if not started

    memoryPaused = !memoryPaused;
    const overlay = document.getElementById('memory-paused-overlay');
    const btn = document.getElementById('btn-pause-memory');
    
    if (memoryPaused) {
        overlay.style.display = 'flex';
        btn.textContent = "Continuar";
        lockBoard = true; // Prevent clicks while paused
    } else {
        overlay.style.display = 'none';
        btn.textContent = "Pausar";
        lockBoard = false; // Allow clicks
    }
}

function flipCard(card) {
    if (lockBoard || memoryPaused) return;
    if (card === flippedCards[0]) return; // clicking same card
    if (card.classList.contains('flipped')) return; // already revealed
    
    card.classList.add('flipped'); // Reveal (Show Back/Icon)
    flippedCards.push(card);
    
    if (flippedCards.length === 2) {
        moves++;
        document.getElementById('memory-moves').textContent = moves;
        checkMatch();
    }
}

function checkMatch() {
    lockBoard = true;
    const [c1, c2] = flippedCards;
    
    console.log(`🎯 Comparando: ${c1.dataset.icon} vs ${c2.dataset.icon}`);
    
    if (c1.dataset.icon === c2.dataset.icon) {
        console.log('✅ ¡Coinciden!');
        matchedPairs++;
        flippedCards = [];
        lockBoard = false; // unlock immediately
        
        if (matchedPairs === memoryCards.length / 2) { 
            clearInterval(memoryInterval); // Stop timer
            setTimeout(() => {
                const bonus = Math.max(0, 300 - memorySeconds); // Time bonus
                const movesBonus = Math.max(0, 25 - moves);
                const points = 10 + bonus + movesBonus;
                
                // Submit score handles alert
                submitScore(points, 'memory');
                alert(`¡Victoria! \nTiempo: ${document.getElementById('memory-time').textContent}\nMovimientos: ${moves}\nGanaste ${points} Almas.`);
            }, 500);
        }
    } else {
        console.log('❌ No coinciden - ocultando en 1 segundo...');
        setTimeout(() => {
            console.log('🔄 Ocultando cartas ahora');
            c1.classList.remove('flipped'); // Hide again (Show Front/Cover)
            c2.classList.remove('flipped'); // Hide again
            flippedCards = [];
            lockBoard = false;
        }, 1000);
    }
}

// --- Submit Score helper ---
async function submitScore(points, gameType) {
    const token = localStorage.getItem('token');
    try {
        const payload = {
            points: points,
            game_type: gameType,
            level_reached: 1,
            time_played_seconds: memorySeconds,
            device_type: "web"
        };
        
        const res = await fetch(`${API_URL}/games/score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            console.log("Puntaje guardado!");
            checkSession(); // Refresh balance
        } else {
            console.warn("No se pudo guardar el puntaje");
        }
    } catch (e) {
        console.error("Error submitting score", e);
    }
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

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${id}`;
    document.getElementById('modalTicketQR').src = qrUrl;

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

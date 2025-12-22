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
}



/* ==================== GAMES LOGIC ==================== */

// --- Game Navigation & Cleanup ---
let activeGameInterval = null;
let activeGameTimeout = null;

function stopActiveGames() {
    // Stop Whack-a-Ghost
    clearInterval(activeGameInterval);
    clearTimeout(activeGameTimeout);
    timeUp = true;
    
    // Reset Views in Games Tab if needed
    // But mainly stop the "engine" of the games
}

function showGame(gameId) {
    stopActiveGames(); // Stop previous game loop
    document.getElementById('game-intro').classList.add('hidden');
    document.querySelectorAll('.game-view').forEach(el => el.classList.add('hidden'));
    document.getElementById(`game-${gameId}`).classList.remove('hidden');
}

// --- Submit Score helper ---
async function submitScore(points, gameType) {
    const token = localStorage.getItem('token');
    try {
        const payload = {
            points: points,
            game_type: gameType,
            level_reached: 1,
            time_played_seconds: 0,
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
            
            // Custom alert styling could be better, but standard is fine for now
            alert(`☠️ ¡Ganaste ${points} Almas! Tu saldo ha aumentado.`);
        } else {
            console.warn("No se pudo guardar el puntaje");
        }
    } catch (e) {
        console.error("Error submitting score", e);
    }
}

// --- Whack-a-Ghost ---
let scoreWhack = 0;
let lastHole;
let timeUp = false;

function randomTime(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function randomHole(holes) {
    const idx = Math.floor(Math.random() * holes.length);
    const hole = holes[idx];
    if (hole === lastHole) return randomHole(holes);
    lastHole = hole;
    return hole;
}

function peep() {
    if (timeUp) return;
    const holes = document.querySelectorAll('.whack-hole');
    const time = randomTime(500, 1500); 
    const hole = randomHole(holes);
    if(!hole) return;
    
    hole.classList.add('up');
    
    activeGameTimeout = setTimeout(() => {
        hole.classList.remove('up');
        // Clean hit status for next time
        const ghost = hole.querySelector('.whack-ghost');
        if(ghost) {
             ghost.style.filter = "";
             ghost.dataset.hit = "";
        }
        if (!timeUp) peep();
    }, time);
}

function startGameWhackLogic() {
    stopActiveGames(); // Clear any existing timers
    
    const grid = document.getElementById('whack-grid');
    grid.innerHTML = '';
    for(let i=0; i<6; i++) {
        const hole = document.createElement('div');
        hole.className = 'whack-hole';
        const ghost = document.createElement('div');
        ghost.className = 'whack-ghost';
        
        // Use mousedown/touchstart for better responsiveness
        const hitHandler = function(e) {
             if(!e.isTrusted) return; 
             if(this.parentNode.classList.contains('up')) {
                 if(!this.dataset.hit) {
                    scoreWhack++;
                    this.dataset.hit = "true";
                    this.style.filter = "brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(5)"; // blood effect
                    document.getElementById('whack-score').textContent = scoreWhack;
                    
                    // Force down immediately after hit
                    setTimeout(() => {
                        this.parentNode.classList.remove('up');
                    }, 150);
                 }
             }
        };
        
        ghost.addEventListener('mousedown', hitHandler);
        ghost.addEventListener('touchstart', hitHandler);
        
        hole.appendChild(ghost);
        grid.appendChild(hole);
    }

    document.getElementById('whack-score').textContent = 0;
    document.getElementById('whack-time').textContent = 15;
    scoreWhack = 0;
    timeUp = false;
    document.getElementById('btn-start-whack').disabled = true;
    
    peep();
    
    let timeLeft = 15;
    activeGameInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('whack-time').textContent = timeLeft;
        if(timeLeft <= 0) {
            clearInterval(activeGameInterval);
            timeUp = true;
            document.getElementById('btn-start-whack').disabled = false;
            // Clear grid state
            document.querySelectorAll('.whack-hole').forEach(h => h.classList.remove('up'));
            
            if(scoreWhack > 0) {
                setTimeout(() => submitScore(scoreWhack, 'ghost_hunt'), 500);
            }
        }
    }, 1000);
}

function startWhackGame() {
    startGameWhackLogic();
}

// --- Trivia Terror ---
const triviaQuestions = [
    { q: "¿Quién es el asesino en 'Halloween'?", a: ["Jason Voorhees", "Freddy Krueger", "Michael Myers", "Leatherface"], correct: 2 },
    { q: "¿En qué año se estrenó 'El Exorcista'?", a: ["1973", "1980", "1968", "1990"], correct: 0 },
    { q: "¿Qué hotel aparece en 'El Resplandor'?", a: ["Bates Motel", "Overlook Hotel", "Cecil Hotel", "Hotel California"], correct: 1 },
    { q: "¿Qué muñeco poseído aterrorizó al mundo?", a: ["Chucky", "Annabelle", "Billy", "Brahms"], correct: 0 },
    { q: "¿Cómo se llama el payaso de 'IT'?", a: ["Pennywise", "Joker", "Pogo", "Twisty"], correct: 0 },
    { q: "¿Cuál es la regla #1 para sobrevivir en Zombieland?", a: ["Cardio", "Doble Tap", "Cinturón de seguridad", "Viajar ligero"], correct: 0 },
    { q: "¿Qué película popularizó el metraje encontrado (found footage)?", a: ["REC", "Paranormal Activity", "The Blair Witch Project", "Cloverfield"], correct: 2 }
];

function startTriviaGame() {
    document.getElementById('trivia-start-screen').classList.add('hidden');
    document.getElementById('trivia-play-screen').classList.remove('hidden');
    nextQuestion();
}

function nextQuestion() {
    const qIndex = Math.floor(Math.random() * triviaQuestions.length);
    const q = triviaQuestions[qIndex];
    
    document.getElementById('trivia-question').textContent = q.q;
    const opts = document.getElementById('trivia-options');
    opts.innerHTML = '';
    
    q.a.forEach((ans, idx) => {
        const btn = document.createElement('div');
        btn.className = 'trivia-option';
        btn.textContent = ans;
        btn.onclick = () => checkTrivia(btn, idx, q.correct);
        opts.appendChild(btn);
    });
}

function checkTrivia(btn, idx, correctIdx) {
    if(document.querySelector('.trivia-option.correct') || document.querySelector('.trivia-option.wrong')) return; 

    if(idx === correctIdx) {
        btn.classList.add('correct');
        setTimeout(() => {
            submitScore(5, 'trivia');
            document.getElementById('trivia-play-screen').classList.add('hidden');
            document.getElementById('trivia-start-screen').classList.remove('hidden');
            document.querySelector('#trivia-start-screen h3').innerHTML = "¡Correcto!<br>Ganaste 5 Almas.";
        }, 1500);
    } else {
        btn.classList.add('wrong');
        const allOpts = document.querySelectorAll('.trivia-option');
        allOpts[correctIdx].classList.add('correct');
        setTimeout(() => {
            document.getElementById('trivia-play-screen').classList.add('hidden');
            document.getElementById('trivia-start-screen').classList.remove('hidden');
            document.querySelector('#trivia-start-screen h3').innerHTML = "Fallaste.<br>Tu alma sufre.";
        }, 1500);
    }
}

// --- Memory ---
const memoryIcons = ['💀', '🧛', '🧟', '👻', '🕸️', '⚰️', '🩸', '🎃'];
let memoryCards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let lockBoard = false;

function startMemoryGame() {
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    
    // Reset State
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    lockBoard = false;
    
    memoryCards = [...memoryIcons, ...memoryIcons]; 
    memoryCards.sort(() => 0.5 - Math.random());
    
    document.getElementById('memory-moves').textContent = moves;
    
    memoryCards.forEach((icon, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.index = index;
        card.dataset.icon = icon;
        card.innerHTML = `<span class="front">${icon}</span><span class="back" style="color: #666; font-size: 1.5rem;">🦇</span>`;
        card.onclick = () => flipCard(card);
        grid.appendChild(card);
    });
}

function flipCard(card) {
    if(lockBoard) return;
    if(card === flippedCards[0]) return; // clicking same card
    if(card.classList.contains('flipped')) return; // already matched/flipped
    
    card.classList.add('flipped');
    flippedCards.push(card);
    
    if(flippedCards.length === 2) {
        moves++;
        document.getElementById('memory-moves').textContent = moves;
        checkMatch();
    }
}

function checkMatch() {
    lockBoard = true;
    const [c1, c2] = flippedCards;
    
    if(c1.dataset.icon === c2.dataset.icon) {
        matchedPairs++;
        flippedCards = [];
        lockBoard = false; // unlock immediately
        
        if(matchedPairs === memoryIcons.length) {
            setTimeout(() => {
                const bonus = Math.max(0, 25 - moves); 
                const points = 15 + bonus;
                submitScore(points, 'memory');
                alert(`¡Memoria Perfecta! Ganaste ${points} Almas.`);
            }, 500);
        }
    } else {
        setTimeout(() => {
            c1.classList.remove('flipped');
            c2.classList.remove('flipped');
            flippedCards = [];
            lockBoard = false;
        }, 1000);
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

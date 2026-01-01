// ==========================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ==========================================
const API_URL = "http://localhost:8000";
let currentUser = null;
let cart = [];
let gameScore = 0;
let gameActive = false;
let gameTimer;
let currentAuthMode = 'login';

// Performance: throttle function para scroll
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("👻 La Previa Maldita SCRIPT v2 loaded");
    
    // Asegurar que el video de fondo esté silenciado
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo) heroVideo.muted = true;

    checkAuthSession();
    fetchProducts();
    fetchTickets();
    initCountdown();
    setupScrollEffects();
    setupKeyboardListeners();
    setupSessionSync();
});

function setupKeyboardListeners() {
    // ESTRATEGIA GLOBAL: Escuchar Enter en todo el documento
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const activeId = document.activeElement.id;
            
            // Caso: Login / Registro
            if (['usernameInput', 'emailInput', 'passwordInput'].includes(activeId)) {
                e.preventDefault();
                handleAuthSubmit();
            }
            
            // Caso: Chat
            if (activeId === 'chatInput') {
                e.preventDefault();
                sendMessage();
            }
        }
    });
}

function setupSessionSync() {
    // Sincronizar logout/login entre pestañas
    window.addEventListener('storage', (event) => {
        if (event.key === 'token') {
            if (!event.newValue) {
                // Si borraron el token en otra pestaña -> Logout aquí también
                logout(false); // false = no reload loop
            } else {
                // Si pusieron token en otra pestaña -> Login aquí también
                checkAuthSession();
            }
        }
    });

    // Validar sesión al volver a la pestaña
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            checkAuthSession(false, false); // No redirect forced
        }
    });
}

// ==========================================
// AUTENTICACIÓN
// ==========================================
function checkAuthSession(redirectAfterLogin = false, forceRedirectOnHome = true) {
    const token = localStorage.getItem('token');

    if (!token) {
        if (currentUser) logout(false);
        return;
    }

    // Validar token con el backend
    fetch(`${API_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => {
            if (res.ok) return res.json();
            throw new Error('Sesión expirada');
        })
        .then(user => {
            const hasChangedUser = !currentUser || currentUser.username !== user.username;
            currentUser = user;
            
            // Actualizar UI
            updateUIForUser(user);
            
            // Lógica de Redirección Inteligente
            const isOnIndexPage = window.location.pathname.endsWith('index.html') || 
                                 window.location.pathname === '/' ||
                                 window.location.pathname.endsWith('/');

            // Solo redirigir automáticamente si estamos en Home Y (es redirección forzada O es login reciente)
            // PERO si es Admin, le permitimos quedarse en el Home para ver sus cambios (si no es un login fresco)
            if (isOnIndexPage && (redirectAfterLogin || (forceRedirectOnHome && user.role !== 'admin'))) {
                console.log('🔄 Usuario autenticado. Redirigiendo a su panel...');
                redirectToUserPage(user);
            }
            
            // Si es un login fresco (acaba de dar click en ingresar), sí mandamos al admin a su panel
            if (isOnIndexPage && user.role === 'admin' && redirectAfterLogin) {
                 redirectToUserPage(user);
            }

            if (hasChangedUser) {
                console.log(`💀 Sesión activa: ${user.username} (${user.role})`);
            }
        })
        .catch(() => {
            // Token inválido o servidor no disponible - limpiar sesión
            localStorage.removeItem('token');
            currentUser = null;
            updateUIForUser(null); // Reset UI
        });
}

// Función para redirigir según el rol del usuario
function redirectToUserPage(user) {
    // Evitar loop de redirección
    if (user.role === 'admin') {
        if (!window.location.href.includes('admin.html')) {
            window.location.href = 'pages/admin.html';
        }
    } else {
        if (!window.location.href.includes('user_page.html')) {
            window.location.href = 'pages/user_page.html';
        }
    }
}

function updateUIForUser(user) {
    document.getElementById('authActions').classList.add('hidden');
    document.getElementById('authUser').classList.remove('hidden');
    document.getElementById('usernameSpan').textContent = user.username;

    // Update Soul Balance
    updateSoulBalance(user.soul_balance || 0);
}

function updateSoulBalance(amount) {
    const el = document.getElementById('userSoulBalance');
    if (el) {
        el.textContent = amount;
        // Animation effect
        el.parentElement.classList.add('pulse-anim');
        setTimeout(() => el.parentElement.classList.remove('pulse-anim'), 1000);
    }
}

function toggleModal(mode = null) {
    const modal = document.getElementById('authModal');
    const title = document.getElementById('modalTitle');
    const usernameInput = document.getElementById('usernameInput');
    const emailInput = document.getElementById('emailInput');

    if (mode) {
        currentAuthMode = mode;
        title.textContent = mode === 'login' ? 'Ingresar a la Pesadilla' : 'Unirse al Culto';

        // Ocultar username en login
        if (mode === 'login') {
            usernameInput.style.display = 'none';
        } else {
            usernameInput.style.display = 'block';
        }

        emailInput.style.display = 'block';
        emailInput.placeholder = mode === 'login' ? 'Email' : 'Email (para contactarte)';

        document.getElementById('authError').style.display = 'none';
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

async function handleAuthSubmit() {
    const username = document.getElementById('usernameInput').value;
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const errorMsg = document.getElementById('authError');

    // Limpiar error anterior
    errorMsg.style.display = 'none';

    if (!email || !password || (currentAuthMode === 'register' && !username)) {
        errorMsg.textContent = "Todos los campos son obligatorios.";
        errorMsg.style.display = 'block';
        return;
    }

    try {
        let endpoint = currentAuthMode === 'login' ? '/users/login' : '/users/register';
        let bodyData = {};

        if (currentAuthMode === 'register') {
            bodyData = { username, email, password };
        } else {
            bodyData = { email, password };
        }

        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        if (res.ok) {
            const data = await res.json();
            if (currentAuthMode === 'register') {
                alert("✅ Cuenta creada exitosamente. Ahora puedes iniciar sesión.");

                // Cambiar a modo login automáticamente
                toggleModal('login');

                // Pre-rellenar email para facilitar login
                document.getElementById('emailInput').value = email;
                document.getElementById('passwordInput').value = ''; // Limpiar password por seguridad
                return;
            }
            localStorage.setItem('token', data.access_token);
            toggleModal(); // Cerrar modal
            // Redirigir automáticamente después del login
            checkAuthSession(true);
        } else {
            const errData = await res.json().catch(() => ({}));
            let errorMessage = "❌ Error desconocido.";

            // Manejar errores de validación de Pydantic (422)
            if (res.status === 422 && errData.detail) {
                if (Array.isArray(errData.detail)) {
                    // Pydantic devuelve un array de errores
                    const messages = errData.detail.map(e => e.msg || e.message || JSON.stringify(e));
                    errorMessage = "❌ " + messages.join(", ");
                } else if (typeof errData.detail === 'string') {
                    errorMessage = "❌ " + errData.detail;
                } else {
                    errorMessage = "❌ Datos inválidos. Verifica la información.";
                }
            } else if (res.status === 401) {
                errorMessage = "❌ Email o contraseña incorrectos.";
            } else if (res.status === 400) {
                errorMessage = typeof errData.detail === 'string' ? "❌ " + errData.detail : "❌ Datos inválidos.";
            } else if (errData.detail) {
                errorMessage = typeof errData.detail === 'string' ? "❌ " + errData.detail : "❌ Error del servidor.";
            }

            errorMsg.textContent = errorMessage;
            errorMsg.style.display = 'block';
        }

    } catch (networkError) {
        console.error("Error de conexión:", networkError);
        errorMsg.textContent = "🔌 No hay conexión con el servidor. Verifica que el backend esté activo.";
        errorMsg.style.display = 'block';
    }
}

function logout(reload = true) {
    localStorage.removeItem('token');
    currentUser = null;
    document.getElementById('authActions').classList.remove('hidden');
    document.getElementById('authUser').classList.add('hidden');
    
    if (reload) {
        window.location.reload();
    } else {
        // Si no recargamos (ej: logout desde otra pestaña), al menos redirigir al home si es página protegida
        if (window.location.pathname.includes('user_page.html')) {
            window.location.href = '../index.html';
        }
    }
}

// ==========================================
// STORE & TICKETS
// ==========================================
let allProducts = [];

async function fetchTickets() {
    const grid = document.getElementById('ticketsGrid');
    if (!grid) return; // Si no estamos en la página principal

    try {
        const res = await fetch(`${API_URL}/products/`);
        
        if (res.ok) {
            const products = await res.json();
            const tickets = products.filter(p => p.type === 'ticket' && p.is_active);
            renderTickets(tickets);
        } else {
            console.warn("Error al cargar tickets:", res.status);
            grid.innerHTML = '<p class="error-msg">Espíritus ocupados. Intenta más tarde.</p>';
        }
    } catch (e) {
        console.warn("Error de red al cargar tickets:", e);
        grid.innerHTML = '<p class="error-msg">Conexión con el inframundo fallida.</p>';
    }
}

function renderTickets(tickets) {
    const grid = document.getElementById('ticketsGrid');
    grid.innerHTML = '';

    if (tickets.length === 0) {
        grid.innerHTML = `
            <div class="loading-state" style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">
                <p>No hay pases disponibles por el momento.</p>
            </div>
        `;
        return;
    }

    tickets.forEach(ticket => {
        const isFeatured = ticket.is_featured;
        const cardClass = isFeatured ? 'ticket-card premium glass-panel' : 'ticket-card glass-panel';
        
        // Imagen del ticket
        let imageHtml = '';
        if (ticket.image_url) {
            imageHtml = `
                <div class="ticket-image" style="height: 160px; overflow: hidden;">
                    <img src="${ticket.image_url}" alt="${ticket.name}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
            `;
        }

        // Descripción (procesar saltos de línea)
        let descHtml = '';
        if (ticket.description) {
            const lines = ticket.description.split('\n').filter(l => l.trim());
            // Si parece una lista, usar UL
            if (lines.some(l => l.startsWith('-') || l.startsWith('✓') || l.startsWith('•'))) {
                descHtml = '<ul>' + lines.map(l => {
                    const content = l.replace(/^[-✓•]/, '').trim();
                    const icon = l.includes('✗') ? '✗' : '✓'; // Simple detección de negativo
                    return `<li>${icon} ${content}</li>`;
                }).join('') + '</ul>';
            } else {
                descHtml = `<p style="margin-bottom: 15px; font-size: 0.9em; opacity: 0.8;">${ticket.description}</p>`;
            }
        }

        const card = document.createElement('div');
        card.className = cardClass;
        
        const ribbon = isFeatured ? '<div class="ribbon">MÁS VENDIDO</div>' : '';
        const price = Math.floor(ticket.price);

        card.innerHTML = `
            ${ribbon}
            ${imageHtml}
            <div class="ticket-header">
                <h3>${ticket.name}</h3>
                <p class="price">👻 ${price}</p>
            </div>
            <div class="ticket-body">
                ${descHtml}
            </div>
            <button class="${isFeatured ? 'btn-blood glow-effect' : 'btn-buy'}" 
                onclick="addToCart('${ticket.name.replace(/'/g, "\\'")}', ${price}, ${ticket.id}, 'ticket')">
                ${isFeatured ? `Pactar por ${price} Almas` : `Invocar por ${price} Almas`}
            </button>
        `;
        grid.appendChild(card);
    });
}


async function fetchProducts() {
    try {
        // Intentar fetch real con timeout más largo para dar tiempo al backend
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const res = await fetch(`${API_URL}/products/`, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (res.ok) {
                const products = await res.json();
                // Filtrar solo productos activos y visibles
                allProducts = products.filter(p => p.is_active !== false && p.is_visible !== false);
            } else {
                console.warn("Error del servidor al cargar productos:", res.status);
                allProducts = [];
            }
        } catch (e) {
            console.warn("Error de red al cargar productos:", e.message);
            allProducts = [];
        }

        renderStore(allProducts);

    } catch (err) {
        console.warn("Error cargando productos", err);
        allProducts = [];
        renderStore(allProducts);
    }
}

function renderStore(products) {
    const grid = document.getElementById('storeGrid');
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p style="font-size: 1.2rem; color: #888;">🔮 No hay productos disponibles en este momento.</p>
                <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">
                    Verifica que el servidor esté activo o contacta al administrador.
                </p>
            </div>
        `;
        return;
    }

    // Filtrar tickets (se venden en otra sección)
    const storeProducts = products.filter(p => p.type !== 'ticket');
    
    if (storeProducts.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Solo hay tickets disponibles. Visita la sección de entradas.</p>';
        return;
    }

    storeProducts.forEach(p => {
        // Determinar el icono según el tipo
        const typeIcons = {
            'merchandise': '🎃',
            'item': '🔮',
            'items': '🔮',
            'drink': '🍹',
            'food': '🍕',
            'potion': '⚗️',
            'potions': '⚗️',
            'experience': '✨'
        };
        const icon = typeIcons[p.type] || '🔮';

        // Determinar la imagen o usar icono como fallback
        const imageContent = p.image_url 
            ? `<img src="${p.image_url}" alt="${p.name}" style="max-width: 100%; max-height: 120px; object-fit: contain;" onerror="this.outerHTML='<span style=\\'font-size: 4rem;\\'>${icon}</span>'">`
            : `<span style="font-size: 4rem;">${icon}</span>`;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image-container">
                ${imageContent}
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <p style="font-size: 0.8rem; color: #888; margin-bottom: 5px;">${p.description || 'Objeto misterioso'}</p>
                <div class="product-price">👻 ${Math.floor(p.price * 100)}</div>
                <button class="add-to-cart-btn" onclick="addToCart('${p.name.replace(/'/g, "\\'")}', ${Math.floor(p.price * 100)}, ${p.id})">Obtener por ${Math.floor(p.price * 100)}</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterStore(type) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (type === 'all') {
        renderStore(allProducts);
    } else {
        const filtered = allProducts.filter(p => {
            // Mapear tipos del frontend a tipos del backend
            if (type === 'items' || type === 'merchandise') {
                return p.type === 'items' || p.type === 'item' || p.type === 'merchandise';
            }
            if (type === 'potions' || type === 'drink') {
                return p.type === 'potions' || p.type === 'potion' || p.type === 'drink';
            }
            if (type === 'food') {
                return p.type === 'food';
            }
            if (type === 'experience') {
                return p.type === 'experience';
            }
            return p.type === type;
        });
        renderStore(filtered);
    }
}

// ==========================================
// CARRITO (CART)
// ==========================================
function addToCart(name, price, id = null, type = 'item') {
    cart.push({ name, price, id, type });
    updateCartIcon();
    showNotification(`Añadido: ${name}`);
    renderCart();

    // Abrir carrito
    const overlay = document.getElementById('cartOverlay');
    overlay.classList.add('active');
}

function updateCartIcon() {
    document.getElementById('cartCount').textContent = cart.length;
}

function toggleCart() {
    const overlay = document.getElementById('cartOverlay');
    overlay.classList.toggle('active');
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cartList');
    const totalEl = document.getElementById('cartTotal');

    list.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        list.innerHTML = '<li style="text-align: center; padding: 20px;">Tu alma está vacía...</li>';
    } else {
        cart.forEach((item, index) => {
            total += item.price;
            const li = document.createElement('li');
            li.style.borderBottom = "1px solid #333";
            li.style.padding = "10px 0";
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.color = "#ccc";

            li.innerHTML = `
                <span>${item.name}</span>
                <span>👻 ${item.price} <button onclick="removeFromCart(${index})" style="background:none; border:none; color:red; cursor:pointer; margin-left: 5px;">✕</button></span>
            `;
            list.appendChild(li);
        });
    }

    totalEl.textContent = total;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartIcon();
    renderCart();
}

async function checkout() {
    if (!currentUser) {
        alert("Debes identificarte primero.");
        toggleModal('login');
        toggleCart();
        return;
    }

    if (cart.length === 0) {
        alert("Tu cesta está vacía.");
        return;
    }

    // Simulación de checkout con nueva lógica de backend
    const token = localStorage.getItem('token');

    // Preparar payload
    const items = cart.map(item => ({
        product_id: item.id || 1, // Fallback ID si es mock
        quantity: 1
    }));

    // Agrupar items iguales (opcional)

    fetch(`${API_URL}/orders/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items })
    })
        .then(async res => {
            if (res.ok) {
                alert("¡Pacto Sellado! Tus almas han sido cobradas.");
                cart = [];

                // Actualizar saldo
                // Recargamos el usuario para obtener el saldo actualizado del servidor
                checkAuthSession();

                updateCartIcon();
                renderCart();
                toggleCart();
            } else {
                const err = await res.json();
                if (res.status === 402) {
                    alert(`⚠️ ${err.detail}\n\n¡Ve a la sección de JUEGOS para ganar más almas!`);
                } else {
                    alert("Error en el ritual: " + (err.detail || "Intenta de nuevo"));
                }
            }
        })
        .catch(e => {
            alert("Error de conexión con el inframundo.");
            console.error(e);
        });
}

// ==========================================
// JUEGO
// ==========================================
// ==========================================
// CENTRAL DE JUEGOS
// ==========================================

// ==========================================
// CENTRAL DE JUEGOS
// ==========================================

function enforceGameVisibility(activeGameId) {
    // 1. Ocultar selector
    const selector = document.getElementById('gameSelector');
    if (selector) selector.classList.add('hidden');

    // 2. Ocultar todos los contenedores
    document.querySelectorAll('.game-container').forEach(el => {
        el.classList.add('hidden');
    });
    
    // 3. Mostrar el activo
    const activeEl = document.getElementById(activeGameId);
    if (activeEl) {
        activeEl.classList.remove('hidden');
    } else {
        console.error(`Juego no encontrado: ${activeGameId}`);
    }
}

function selectGame(gameType) {
    console.log(`Seleccionando juego: ${gameType}`);
    enforceGameVisibility(`game-${gameType}`);
}

function showGameMenu() {
    console.log("Volviendo al menú de juegos...");
    
    document.querySelectorAll('.game-container').forEach(el => el.classList.add('hidden'));
    const selector = document.getElementById('gameSelector');
    if (selector) selector.classList.remove('hidden');
    
    // Detener juegos
    gameActive = false;
    clearTimeout(gameTimer);
    
    // Resetear Trivia
    const triviaFeedback = document.getElementById('trivia-feedback');
    const triviaOptions = document.getElementById('trivia-options');
    if (triviaFeedback) triviaFeedback.textContent = '';
    if (triviaOptions) triviaOptions.innerHTML = '';
    
    // Resetear Memory
    const memoryGrid = document.getElementById('memory-grid');
    if (memoryGrid) memoryGrid.innerHTML = '';
}

// ==========================================
// JUEGO 1: WHACK-A-GHOST
// ==========================================
function initWhackGame() {
    console.log("Iniciando Whack-a-Ghost");
    enforceGameVisibility('game-whack'); 
    
    if (gameActive) return;

    const target = document.getElementById('target');
    const scoreDisplay = document.getElementById('scoreDisplay');
    
    if (!target) return; 
    
    gameActive = true;
    gameScore = 0;
    if(scoreDisplay) scoreDisplay.textContent = '0';

    target.classList.remove('hidden');
    moveTarget();

    setTimeout(() => {
        endGame('whack');
    }, 15000);
}

function moveTarget() {
    if (!gameActive) return;

    const target = document.getElementById('target');
    const gameArea = document.getElementById('gameArea');

    if (!target || !gameArea) return;

    const maxX = gameArea.clientWidth - 50;
    const maxY = gameArea.clientHeight - 50;

    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);

    target.style.left = randomX + 'px';
    target.style.top = randomY + 'px';

    clearTimeout(gameTimer);
    gameTimer = setTimeout(moveTarget, 800 + Math.random() * 500);
}

// ==========================================
// JUEGO 2: TRIVIA MALDITA
// ==========================================
const triviaQuestions = [
    { q: "¿En qué año se estrenó 'El Exorcista'?", options: ["1973", "1980", "1968", "1975"], correct: 0 },
    { q: "¿Cómo se llama el asesino de 'Halloween'?", options: ["Jason", "Freddy", "Michael Myers", "Leatherface"], correct: 2 },
    { q: "¿Qué dicen los cuervos?", options: ["Nunca más", "Siempre", "Morirás", "Croar"], correct: 0 },
    { q: "¿Cuál es el hotel de 'El Resplandor'?", options: ["Motel Bates", "Overlook", "Hotel California", "Cecil"], correct: 1 }
];

function initTriviaGame() {
    console.log("Iniciando Trivia");
    enforceGameVisibility('game-trivia'); 

    const qIndex = Math.floor(Math.random() * triviaQuestions.length);
    const question = triviaQuestions[qIndex];
    
    const qEl = document.getElementById('trivia-question');
    const optsEl = document.getElementById('trivia-options');
    const feedbackEl = document.getElementById('trivia-feedback');

    if(qEl) qEl.textContent = question.q;
    if(optsEl) optsEl.innerHTML = '';
    if(feedbackEl) {
        feedbackEl.textContent = '';
        feedbackEl.className = 'trivia-feedback'; 
    }

    if(optsEl) {
        question.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'trivia-btn';
            btn.textContent = opt;
            btn.onclick = () => checkTriviaAnswer(index, question.correct, btn);
            optsEl.appendChild(btn);
        });
    }
}

function checkTriviaAnswer(selected, correct, btn) {
    const feedbackEl = document.getElementById('trivia-feedback');
    
    // Deshabilitar botones para evitar doble click
    document.querySelectorAll('.trivia-btn').forEach(b => b.disabled = true);

    if (selected === correct) {
        btn.classList.add('correct');
        if(feedbackEl) {
            feedbackEl.textContent = "¡CORRECTO! +50 Almas";
            feedbackEl.style.color = "#059669";
        }
        saveGameScore('trivia', 50);
    } else {
        btn.classList.add('wrong');
        if(feedbackEl) {
            feedbackEl.textContent = "INCORRECTO. Tu ignorancia es fatal.";
            feedbackEl.style.color = "#dc2626";
        }
    }
    
    // Auto-restart after delay ONLY if game is still visible
    setTimeout(() => {
        const triviaContainer = document.getElementById('game-trivia');
        if (triviaContainer && !triviaContainer.classList.contains('hidden')) {
            initTriviaGame();
        }
    }, 2000);
}


// ==========================================
// JUEGO 3: MEMORIA LETAL
// ==========================================
const memoryEmojis = ['💀', '🩸', '🕷️', '🦇', '⚰️', '🔪', '🎃', '🧟'];
let memoryCards = [];
let flippedCards = [];
let memoryLocked = false;

function initMemoryGame() {
    console.log("Iniciando Memoria");
    enforceGameVisibility('game-memory'); 

    const grid = document.getElementById('memory-grid');
    if(!grid) return;

    grid.innerHTML = '';
    flippedCards = [];
    memoryCards = [];
    
    // Crear pares
    const deck = [...memoryEmojis, ...memoryEmojis]; 
    // Barajar
    deck.sort(() => 0.5 - Math.random());
    
    deck.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.value = emoji;
        card.dataset.id = index;
        
        card.innerHTML = `
            <div class="front"></div>
            <div class="back">${emoji}</div>
        `;
        
        card.onclick = () => flipCard(card);
        grid.appendChild(card);
        memoryCards.push(card);
    });
}

function flipCard(card) {
    if (memoryLocked) return;
    if (card.classList.contains('flipped')) return;
    
    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        memoryLocked = true;
        checkMemoryMatch();
    }
}

function checkMemoryMatch() {
    const [card1, card2] = flippedCards;
    const match = card1.dataset.value === card2.dataset.value;

    if (match) {
        // Match found
        flippedCards = [];
        memoryLocked = false;
        
        // Check win condition
        if (document.querySelectorAll('.memory-card.flipped').length === memoryCards.length) {
            setTimeout(() => {
                alert("¡MEMORIA PERFECTA! +100 Almas");
                saveGameScore('memory', 100);
            }, 500);
        }
    } else {
        // No match
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            memoryLocked = false;
        }, 1000);
    }
}


function saveGameScore(gameType, score) {
    if (!currentUser) return; // Solo guardar si está logueado
    
    // Actualizar UI local
    currentUser.soul_balance = (currentUser.soul_balance || 0) + score;
    updateSoulBalance(currentUser.soul_balance);

    // Enviar al servidor
    fetch(`${API_URL}/games/score`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            game_type: gameType,
            score_value: score
        })
    }).catch(console.error);
}


function hitTarget() {
    if (!gameActive) return;

    gameScore += 10;
    const scoreEl = document.getElementById('scoreDisplay');
    if(scoreEl) scoreEl.textContent = gameScore;

    const target = document.getElementById('target');
    target.style.transform = "scale(0.8)";
    setTimeout(() => target.style.transform = "scale(1)", 100);

    moveTarget();
}

function endGame(gameType) {
    gameActive = false;
    document.getElementById('target').classList.add('hidden');
    clearTimeout(gameTimer);

    alert(`¡Tiempo! Puntuación final: ${gameScore}`);

    if (currentUser && gameScore > 0) {
        saveGameScore(gameType, gameScore);
    }
}

// ==========================================
// CHAT BOT & EXTRAS
// ==========================================
function toggleChat() {
    const chat = document.getElementById('chatWidget');
    chat.classList.toggle('closed');
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    addMessage(msg, 'user');
    input.value = '';

    setTimeout(() => {
        let reply = "Los espíritus guardan silencio...";
        if (msg.toLowerCase().includes('precio') || msg.toLowerCase().includes('ticket')) {
            reply = "El precio es tu alma... o $6.66 por un ticket mortal.";
        } else if (msg.toLowerCase().includes('hola')) {
            reply = "Te estábamos esperando...";
        }
        addMessage(reply, 'bot');
    }, 1000);
}

function addMessage(text, sender) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function openVideoModal() {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('trailerFrame');
    if (iframe && iframe.dataset.src) {
        iframe.src = iframe.dataset.src;
    }
    modal.classList.remove('hidden');
}

function closeVideoModal() {
    document.getElementById('videoModal').classList.add('hidden');
    const iframe = document.getElementById('trailerFrame');
    if (iframe) {
        iframe.src = ''; // Detener video y sonido completamente
    }
}

function showNotification(text) {
    console.log("NOTIFICACIÓN:", text);
}

// ==========================================
// GOOGLE SIGN-IN
// ==========================================
async function handleGoogleSignIn(response) {
    const googleToken = response.credential;
    const errorMsg = document.getElementById('authError');

    try {
        const res = await fetch(`${API_URL}/users/google-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: googleToken })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('token', data.access_token);
            toggleModal();
            // Redirigir automáticamente después del login con Google
            checkAuthSession(true);
        } else {
            const err = await res.json().catch(() => ({}));
            errorMsg.textContent = err.detail || "❌ Error al autenticar con Google.";
            errorMsg.style.display = 'block';
        }
    } catch (e) {
        console.error("Google Auth Error:", e);
        errorMsg.textContent = "🔌 No hay conexión con el servidor. Verifica que el backend esté activo.";
        errorMsg.style.display = 'block';
    }
}

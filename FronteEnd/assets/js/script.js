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
    checkAuthSession();
    fetchProducts();
    fetchTickets();
    initCountdown();
    setupScrollEffects();
});

function setupScrollEffects() {
    const nav = document.getElementById('mainNav');

    // Navbar scroll effect con throttle para mejor rendimiento
    const handleScroll = throttle(() => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Mobile Menu Toggle
    window.toggleMobileNav = () => {
        const menu = document.getElementById('mobileMenu');
        menu.classList.toggle('active');
    };
}

// ==========================================
// CUENTA REGRESIVA
// ==========================================
function initCountdown() {
    // Cache DOM elements for performance
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");

    // Fecha objetivo: 31 de Octubre del próximo octubre disponible
    const currentYear = new Date().getFullYear();
    const targetDate = new Date(`October 31, ${currentYear} 00:00:00`).getTime();

    // Si ya pasó Halloween este año (estamos en Nov/Dic), apuntar al próximo
    const now = new Date().getTime();
    const finalTargetDate = targetDate < now ? new Date(`October 31, ${currentYear + 1} 00:00:00`).getTime() : targetDate;

    setInterval(() => {
        const now = new Date().getTime();
        const distance = finalTargetDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        daysEl.textContent = days.toString().padStart(2, '0');
        hoursEl.textContent = hours.toString().padStart(2, '0');
        minutesEl.textContent = minutes.toString().padStart(2, '0');
        secondsEl.textContent = seconds.toString().padStart(2, '0');
    }, 1000);
}

// ==========================================
// AUTENTICACIÓN
// ==========================================
function checkAuthSession(redirectAfterLogin = false) {
    const token = localStorage.getItem('token');

    if (!token) return;

    // Validar token con el backend
    fetch(`${API_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => {
            if (res.ok) return res.json();
            throw new Error('Sesión expirada');
        })
        .then(user => {
            currentUser = user;
            updateUIForUser(user);

            // Redirigir automáticamente según el rol si es un login nuevo
            if (redirectAfterLogin) {
                redirectToUserPage(user);
            }
        })
        .catch(() => {
            // Token inválido o servidor no disponible - limpiar sesión
            localStorage.removeItem('token');
            currentUser = null;
        });
}

// Función para redirigir según el rol del usuario
function redirectToUserPage(user) {
    if (user.role === 'admin') {
        window.location.href = 'pages/admin.html';
    } else {
        window.location.href = 'pages/user_page.html';
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

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    document.getElementById('authActions').classList.remove('hidden');
    document.getElementById('authUser').classList.add('hidden');
    window.location.reload();
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
function startGame() {
    if (gameActive) return;

    const gameArea = document.getElementById('gameArea');
    const target = document.getElementById('target');
    const scoreDisplay = document.getElementById('scoreDisplay');

    gameActive = true;
    gameScore = 0;
    scoreDisplay.textContent = '0';

    target.classList.remove('hidden');
    moveTarget();

    setTimeout(() => {
        endGame();
    }, 15000);
}

function moveTarget() {
    if (!gameActive) return;

    const target = document.getElementById('target');
    const gameArea = document.getElementById('gameArea');

    const maxX = gameArea.clientWidth - 50;
    const maxY = gameArea.clientHeight - 50;

    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);

    target.style.left = randomX + 'px';
    target.style.top = randomY + 'px';

    clearTimeout(gameTimer);
    gameTimer = setTimeout(moveTarget, 800 + Math.random() * 500);
}

function hitTarget() {
    if (!gameActive) return;

    gameScore += 10;
    document.getElementById('scoreDisplay').textContent = gameScore;

    const target = document.getElementById('target');
    target.style.transform = "scale(0.8)";
    setTimeout(() => target.style.transform = "scale(1)", 100);

    moveTarget();
}

function endGame() {
    gameActive = false;
    document.getElementById('target').classList.add('hidden');
    clearTimeout(gameTimer);

    alert(`¡Sobreviviste! Has cosechado ${gameScore} Almas.`);

    if (currentUser) {
        // Enviar Puntuación y Ganar Almas
        fetch(`${API_URL}/games/score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                game_type: 'whack_a_ghost',
                score_value: gameScore
            })
        })
            .then(res => {
                if (res.ok) {
                    // Actualizar saldo localmente
                    currentUser.soul_balance = (currentUser.soul_balance || 0) + gameScore;
                    updateSoulBalance(currentUser.soul_balance);
                    showNotification(`+${gameScore} Almas añadidas a tu cuenta`);
                }
            })
            .catch(err => console.error("Error guardando score", err));
    } else {
        alert("¡Inicia sesión para guardar tus Almas!");
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
    document.getElementById('videoModal').classList.remove('hidden');
}

function closeVideoModal() {
    document.getElementById('videoModal').classList.add('hidden');
    const iframe = document.getElementById('trailerFrame');
    iframe.src = iframe.src;
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

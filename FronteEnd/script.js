// ==========================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ==========================================
const API_URL = "http://localhost:8000"; // Asegúrate de que tu backend corre aquí
let currentUser = null;
let cart = [];
let gameScore = 0;
let gameActive = false;
let gameTimer;
let currentAuthMode = 'login'; // 'login' or 'register'

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuthSession();
    fetchProducts();
    initCountdown();
    setupScrollEffects();
});

function setupScrollEffects() {
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('mainNav');
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

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

        document.getElementById("days").innerText = days.toString().padStart(2, '0');
        document.getElementById("hours").innerText = hours.toString().padStart(2, '0');
        document.getElementById("minutes").innerText = minutes.toString().padStart(2, '0');
        document.getElementById("seconds").innerText = seconds.toString().padStart(2, '0');
    }, 1000);
}

// ==========================================
// AUTENTICACIÓN
// ==========================================
function checkAuthSession() {
    const token = localStorage.getItem('token');

    // Validar usuario demo primero (para pruebas visuales)
    const demoUser = localStorage.getItem('demoUser');
    if (demoUser && token) {
        currentUser = JSON.parse(demoUser);
        updateUIForUser(currentUser);
        return;
    }

    if (token) {
        // Validar token con el backend (endpoint /users/me)
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
            })
            .catch(() => {
                // Si falla la conexión pero hay token, puede ser modo demo fallido o server caído.
                // Por seguridad, logout si era sesión real.
                logout();
            });
    }
}

function updateUIForUser(user) {
    document.getElementById('authActions').classList.add('hidden');
    document.getElementById('authUser').classList.remove('hidden');
    document.getElementById('usernameSpan').textContent = user.username;
}

function toggleModal(mode = null) {
    const modal = document.getElementById('authModal');
    const title = document.getElementById('modalTitle');
    const emailInput = document.getElementById('emailInput');

    if (mode) {
        currentAuthMode = mode;
        title.textContent = mode === 'login' ? 'Ingresar a la Pesadilla' : 'Unirse al Culto';
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

    if (!email || !password || (currentAuthMode === 'register' && !username)) {
        errorMsg.textContent = "Todos los campos son obligatorios... para tu supervivencia.";
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

        // INTENTO DE LOGIN REAL O MODO DEMO
        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                const data = await res.json();
                if (currentAuthMode === 'register') {
                    alert("Cuenta creada. Ahora ingresa...");
                    currentAuthMode = 'login';
                    document.getElementById('modalTitle').textContent = 'Ingresar';
                    return;
                }
                localStorage.setItem('token', data.access_token);
                // Limpiar demo user si existe
                localStorage.removeItem('demoUser');
            } else {
                if (res.status === 401) throw new Error("Credenciales inválidas");
                throw new Error("Error en servidor");
            }

        } catch (networkError) {
            console.warn("Backend no disponible. Activando Modo Demo. Error:", networkError);

            // ACTIVAR MODO DEMO
            const mockToken = "demo_token_" + Date.now();
            localStorage.setItem('token', mockToken);

            const mockUser = {
                username: username || email.split('@')[0] || "Viajero_Oscuro",
                email: email || "demo@lapreviamaldita.com"
            };
            localStorage.setItem('demoUser', JSON.stringify(mockUser));

            alert("⚠️ MODO DEMO ACTIVADO ⚠️\n(No se detectó el servidor, pero puedes probar la interfaz)");
        }

        checkAuthSession();
        toggleModal(); // Cerrar modal

    } catch (err) {
        errorMsg.textContent = err.message || "Error desconocido";
        errorMsg.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('demoUser');
    currentUser = null;
    document.getElementById('authActions').classList.remove('hidden');
    document.getElementById('authUser').classList.add('hidden');
    window.location.reload();
}

// ==========================================
// TIENDA (STORE)
// ==========================================
let allProducts = [];

async function fetchProducts() {
    try {
        // MOCK DATA INICIAL (Fallback)
        const mockProducts = [
            { id: 101, name: "Máscara de la Peste", price: 25.00, type: "items", image_url: "Images/mask.png", description: "Protégete de las miasmas." },
            { id: 102, name: "Vial de Sangre Falsa", price: 8.50, type: "potions", image_url: "Images/blood.png", description: "Realista y comestible." },
            { id: 103, name: "Capa de Vampiro", price: 45.00, type: "items", image_url: "Images/cape.png", description: "Terciopelo negro genuino." },
            { id: 104, name: "Elixir de Vida (Bebida)", price: 5.00, type: "potions", image_url: "Images/elixir.png", description: "Recupera energía vital." },
            { id: 105, name: "Muñeco Vudú", price: 15.66, type: "items", image_url: "Images/voodoo.png", description: "Alfileres incluidos." }
        ];

        // Intentar fetch real con timeout corto
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        try {
            const res = await fetch(`${API_URL}/products/`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                allProducts = await res.json();
            } else {
                allProducts = mockProducts;
            }
        } catch (e) {
            allProducts = mockProducts; // Fallback a mock si falla fetch o timeout
        }

        renderStore(allProducts);

    } catch (err) {
        console.warn("Error cargando productos", err);
    }
}

function renderStore(products) {
    const grid = document.getElementById('storeGrid');
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">El vacío absoluto...</p>';
        return;
    }

    products.forEach(p => {
        if (p.type === 'ticket') return;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image-container">
                <span style="font-size: 4rem;">🔮</span> 
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <p style="font-size: 0.8rem; color: #888; margin-bottom: 5px;">${p.description || 'Objeto misterioso'}</p>
                <div class="product-price">$${p.price.toFixed(2)}</div>
                <button class="add-to-cart-btn" onclick="addToCart('${p.name}', ${p.price}, ${p.id})">Añadir a la Cesta</button>
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
            if (type === 'items') return p.type === 'items' || p.type === 'item';
            if (type === 'potions') return p.type === 'potions';
            return false;
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
                <span>$${item.price.toFixed(2)} <button onclick="removeFromCart(${index})" style="background:none; border:none; color:red; cursor:pointer; margin-left: 5px;">✕</button></span>
            `;
            list.appendChild(li);
        });
    }

    totalEl.textContent = total.toFixed(2);
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

    // Simulación de checkout
    alert("¡Trato cerrado! Tu alma ha sido procesada.\n\n(En modo demo esto no se guarda en base de datos)");
    cart = [];
    updateCartIcon();
    renderCart();
    toggleCart();
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

    alert(`¡Tiempo! Puntuación final: ${gameScore}`);

    if (currentUser) {
        // Guardar score...
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
    // response.credential contiene el JWT token de Google
    const googleToken = response.credential;

    try {
        // Enviar token al backend para validar y crear/autenticar usuario
        const res = await fetch(`${API_URL}/users/google-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: googleToken })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('token', data.access_token);
            localStorage.removeItem('demoUser');

            // Cerrar modal y actualizar UI
            toggleModal();
            checkAuthSession();

            alert("¡Bienvenido! Tu cuenta de Google ha sido vinculada.");
        } else {
            const err = await res.json();
            throw new Error(err.detail || "Error al autenticar con Google");
        }
    } catch (e) {
        console.error("Google Auth Error:", e);

        // Fallback: Modo demo si el backend no responde
        if (e.message.includes("Failed to fetch") || e.message.includes("NetworkError")) {
            // Decodificar el JWT de Google para extraer datos básicos (solo el payload)
            const payload = JSON.parse(atob(googleToken.split('.')[1]));

            const mockToken = "google_demo_" + Date.now();
            localStorage.setItem('token', mockToken);
            localStorage.setItem('demoUser', JSON.stringify({
                username: payload.name || payload.email.split('@')[0],
                email: payload.email
            }));

            toggleModal();
            checkAuthSession();
            alert("⚠️ MODO DEMO ⚠️\nBackend no detectado. Usando datos de tu cuenta Google localmente.");
        } else {
            alert("Error: " + e.message);
        }
    }
}


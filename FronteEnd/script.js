/* --- Configuration --- */
const API_URL = "http://127.0.0.1:8000";

/* --- Auth Logic --- */
const authBar = document.getElementById('authBar');
const authActions = document.getElementById('authActions');
const authUser = document.getElementById('authUser');
const usernameSpan = document.getElementById('usernameSpan');
const modalOverlay = document.getElementById('modalOverlay');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput'); // New field

/* --- Notification Logic --- */
const notificationModal = document.getElementById('notificationModal');
const notifTitle = document.getElementById('notifTitle');
const notifMessage = document.getElementById('notifMessage');

let currentUser = null; // Will hold user object or name
let currentToken = localStorage.getItem('access_token');
let currentAuthMode = 'login'; // 'login' or 'register'

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (currentToken) {
        verifyToken();
    }
    loadProducts();
});

async function verifyToken() {
    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (response.ok) {
            const user = await response.json();
            loginSuccess(user);
        } else {
            logout(); // Token expired or invalid
        }
    } catch (error) {
        console.error("Error verifying token", error);
        logout();
    }
}

function toggleModal(type) {
    modalOverlay.classList.toggle('hidden');
    if (type) {
        currentAuthMode = type;
        document.getElementById('modalTitle').innerText =
            type === 'login' ? 'Entrar al Más Allá' : 'Únete a la Horda';
        usernameInput.value = '';
        passwordInput.value = '';
    }
}

function showNotification(message, title = 'Mensaje del Más Allá', type = 'info') {
    notifMessage.innerText = message;
    notifTitle.innerText = title;
    notifTitle.style.color = 'var(--spectral-green)';
    document.querySelector('.notification-content').style.borderColor = 'var(--spectral-green)';

    if (type === 'error' || type === 'blood') {
        notifTitle.style.color = 'var(--blood-red)';
        document.querySelector('.notification-content').style.borderColor = 'var(--blood-red)';
    }
    notificationModal.classList.remove('hidden');
}

function closeNotification() {
    notificationModal.classList.add('hidden');
}

async function handleAuthSubmit() {
    // Validar entradas
    let userVal = usernameInput.value;
    const password = passwordInput.value;

    if (!userVal || !password) {
        showNotification("Debes ofrecer un nombre y una clave...", "Datos Faltantes", "error");
        return;
    }

    // Auto-generar email si el usuario solo pone nombre (para simplificar UX)
    let email = userVal.includes('@') ? userVal : `${userVal}@inframundo.com`;

    try {
        let response;
        if (currentAuthMode === 'register') {
            response = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: userVal,
                    email: email,
                    password: password
                })
            });
        } else {
            // Login expects email in UserLogin schema
            response = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
        }

        if (response.ok) {
            const data = await response.json();
            if (currentAuthMode === 'login') {
                localStorage.setItem('access_token', data.access_token);
                currentToken = data.access_token;
                verifyToken();
                toggleModal();
                showNotification("Has regresado de las sombras...", "Login Exitoso", "success");
            } else {
                // After register, auto-login or ask to login
                toggleModal();
                showNotification("Tu alma ha sido registrada. Ahora, inicia sesión.", "Registro Exitoso", "success");
            }
        } else {
            const err = await response.json();
            showNotification(err.detail || "Algo salió mal en el ritual.", "Error", "error");
        }
    } catch (e) {
        showNotification("No se pudo contactar con el servidor.", "Error de Conexión", "error");
    }
}

function loginSuccess(user) {
    currentUser = user;
    usernameSpan.innerText = user.username;
    authActions.classList.add('hidden');
    authUser.classList.remove('hidden');
}

function logout() {
    currentUser = null;
    currentToken = null;
    localStorage.removeItem('access_token');
    authActions.classList.remove('hidden');
    authUser.classList.add('hidden');
    showNotification('Has escapado... por ahora.', 'Huida Exitosa', 'info');
}

/* --- Store & Cart Logic --- */
let cart = [];
const cartOverlay = document.getElementById('cartOverlay');
const cartList = document.getElementById('cartList');
const cartTotalSpan = document.getElementById('cartTotal');

async function loadProducts() {
    const storeGrid = document.querySelector('.store-grid');
    try {
        const response = await fetch(`${API_URL}/products/`);
        if (response.ok) {
            const products = await response.json();
            if (products.length === 0) {
                storeGrid.innerHTML = '<p style="color:white; text-align:center;">La tienda está vacía... por ahora.</p>';
                return;
            }
            storeGrid.innerHTML = ''; // Clear loading
            products.forEach(p => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <div class="product-icon">${p.image_url || '📦'}</div>
                    <h4>${p.name}</h4>
                    <p class="price">$${p.price.toFixed(2)}</p>
                    <button class="btn-buy small" onclick="addToCart('${p.name}', ${p.price})">Añadir</button>
                `;
                storeGrid.appendChild(card);
            });
        }
    } catch (e) {
        console.error("Error loading products", e);
        document.getElementById('loadingStore').innerText = "Error invocando productos.";
    }
}

function addToCart(itemBase, price) {
    // Note: itemBase is passing name only for simplicity, ideally pass ID.
    // Since this is a simple cart, we keep it as is.
    /*
    if (!currentUser) {
        showNotification('Debes iniciar sesión para comprar almas.', 'Acceso Denegado', 'error');
        toggleModal('login');
        return;
    }
    */
    // Allow guest cart, but require login for checkout? logic choice.
    // The previous script required login. I'll keep it open but maybe warn on checkout.

    cart.push({ item: itemBase, price: price });
    updateCart();
    cartOverlay.classList.remove('hidden');
}

function updateCart() {
    cartList.innerHTML = '';
    let total = 0;
    cart.forEach((product, index) => {
        total += product.price;
        const li = document.createElement('li');
        li.innerText = `${product.item} - $${product.price.toFixed(2)}`;
        li.style.cursor = 'pointer';
        li.title = 'Clic para eliminar';
        li.onclick = () => removeFromCart(index);
        cartList.appendChild(li);
    });
    cartTotalSpan.innerText = total.toFixed(2);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

function toggleCart() {
    cartOverlay.classList.toggle('hidden');
}

function checkout() {
    if (cart.length === 0) {
        showNotification('Tu cesta está vacía.', 'Vacío Infinito', 'error');
    } else {
        if (!currentUser) {
            showNotification('Identifícate primero para reclamar estos bienes.', 'Login Requerido', 'error');
            toggleModal('login');
            return;
        }
        showNotification('Compra realizada. Tu alma ha sido debitada.', 'Pacto Sellado', 'blood');
        cart = [];
        updateCart();
        toggleCart();
    }
}

/* --- Game Logic (Whack-a-Ghost) --- */
let score = 0;
let gameInterval;
const gameArea = document.getElementById('gameArea');
const target = document.getElementById('target');
const scoreSpan = document.getElementById('score');

function startGame() {
    score = 0;
    scoreSpan.innerText = score;
    target.classList.remove('hidden');
    moveTarget();
    clearInterval(gameInterval);
    gameInterval = setInterval(moveTarget, 1000);
    setTimeout(endGame, 15000);
}

function moveTarget() {
    const x = Math.random() * (gameArea.clientWidth - 50);
    const y = Math.random() * (gameArea.clientHeight - 50);
    target.style.left = x + 'px';
    target.style.top = y + 'px';
}

function hitTarget() {
    score++;
    scoreSpan.innerText = score;
    moveTarget();
    clearInterval(gameInterval);
    gameInterval = setInterval(moveTarget, 800);
}

async function endGame() {
    clearInterval(gameInterval);
    target.classList.add('hidden');
    showNotification(`Juego Terminado. Puntuación: ${score}.`, 'Fin del Juego', 'info');

    if (currentUser) {
        try {
            await fetch(`${API_URL}/games/score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ score: score, game_name: "Whack-a-Ghost" })
            });
            console.log("Score saved");
        } catch (e) {
            console.error("Error saving score", e);
        }
    }
}

/* --- Chat Bot Logic (Simple Local Logic Preserved) --- */
const chatWidget = document.getElementById('chatWidget');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');

function toggleChat() {
    chatWidget.classList.toggle('closed');
}

function sendMessage() {
    const text = chatInput.value;
    if (!text) return;
    addMessage(text, 'user');
    chatInput.value = '';
    setTimeout(() => {
        const response = getBotResponse(text);
        addMessage(response, 'bot');
    }, 500);
}

function getBotResponse(input) {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('comprar') || lowerInput.includes('adquirir') || lowerInput.includes('pagar') || lowerInput.includes('instrucciones')) {
        return "Para unirte a nosotros: <br> 1. Ve a la sección de 'Pase al Inframundo'. <br> 2. Elige tu destino. <br> 3. Añade al carrito y paga con tu alma.";
    }
    if (lowerInput.includes('precio') || lowerInput.includes('boleto') || lowerInput.includes('costo') || lowerInput.includes('cuanto')) {
        return "Las entradas tienen un precio de alma: <br> - Mortal (General): $6.66 <br> - Demonio (VIP): $13.13";
    }
    if (lowerInput.includes('servicio') || lowerInput.includes('ofrecen') || lowerInput.includes('que hay')) {
        return "En este campus maldito encontrarás: <br> - Proyección de películas <br> - Juego de Supervivencia <br> - Tienda de artículos oscuros";
    }
    if (lowerInput.includes('juego') || lowerInput.includes('jugar') || lowerInput.includes('trata')) {
        return "El desafío 'Sobrevive': Tienes 15 segundos para cazar tantos espectros como puedas.";
    }
    return "Esa pregunta aún no está disponible en mis conocimientos sobrenaturales...";
}

function addMessage(text, type) {
    const div = document.createElement('div');
    div.classList.add('msg', type);
    div.innerHTML = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* --- Video Logic --- */
const videoModal = document.getElementById('videoModal');
const trailerFrame = document.getElementById('trailerFrame');

function playVideo() {
    videoModal.classList.remove('hidden');
}

function closeVideo() {
    videoModal.classList.add('hidden');
    const currentSrc = trailerFrame.src;
    trailerFrame.src = '';
    trailerFrame.src = currentSrc;
}

videoModal.onclick = function (e) {
    if (e.target === videoModal) {
        closeVideo();
    }
}

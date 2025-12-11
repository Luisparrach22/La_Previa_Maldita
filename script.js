/* --- Auth Logic --- */
const authBar = document.getElementById('authBar');
const authActions = document.getElementById('authActions');
const authUser = document.getElementById('authUser');
const usernameSpan = document.getElementById('usernameSpan');
const modalOverlay = document.getElementById('modalOverlay');
const usernameInput = document.getElementById('usernameInput');

function toggleModal(type) {
    modalOverlay.classList.toggle('hidden');
    if (type) {
        document.getElementById('modalTitle').innerText =
            type === 'login' ? 'Entrar al Más Allá' : 'Únete a la Horda';
    }
}

function submitAuth() {
    const name = usernameInput.value || 'Alma Perdida';
    usernameSpan.innerText = name;
    authActions.classList.add('hidden');
    authUser.classList.remove('hidden');
    toggleModal();
    alert(`Bienvenido, ${name}... esperamos que sobrevivas.`);
}

function logout() {
    authActions.classList.remove('hidden');
    authUser.classList.add('hidden');
    alert('Has escapado... por ahora.');
}

/* --- Store & Cart Logic --- */
let cart = [];
const cartOverlay = document.getElementById('cartOverlay');
const cartList = document.getElementById('cartList');
const cartTotalSpan = document.getElementById('cartTotal');

function addToCart(item, price) {
    cart.push({ item, price });
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
        // Simple remove on click
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
        alert('Tu cesta está vacía. El vacío es eterno.');
    } else {
        alert('Compra realizada. Tu alma ha sido debitada.');
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
    gameInterval = setInterval(moveTarget, 1000); // Move every second
    setTimeout(endGame, 15000); // 15 second game
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
    // Speed up slightly?
    moveTarget();
    clearInterval(gameInterval);
    gameInterval = setInterval(moveTarget, 800);
}

function endGame() {
    clearInterval(gameInterval);
    target.classList.add('hidden');
    alert(`Juego Terminado. Puntuación: ${score}. ¿Suficiente para salvarte?`);
}

/* --- Chat Bot Logic --- */
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

    // Bot response
    setTimeout(() => {
        const response = getBotResponse(text);
        addMessage(response, 'bot');
    }, 500);
}

function getBotResponse(input) {
    const lowerInput = input.toLowerCase();

    // 1. Instrucciones de Compra (Priority over 'boleto' keyword)
    if (lowerInput.includes('comprar') || lowerInput.includes('adquirir') || lowerInput.includes('pagar') || lowerInput.includes('instrucciones')) {
        return "Para unirte a nosotros: <br> 1. Ve a la sección de 'Pase al Inframundo'. <br> 2. Elige tu destino (Mortal o Demonio). <br> 3. Añade al carrito y paga con tu alma.";
    }

    // 2. Precios / Boletos
    if (lowerInput.includes('precio') || lowerInput.includes('boleto') || lowerInput.includes('costo') || lowerInput.includes('cuanto')) {
        return "Las entradas tienen un precio de alma: <br> - Mortal (General): $6.66 <br> - Demonio (VIP): $13.13";
    }

    // 3. Servicios / Oferta
    if (lowerInput.includes('servicio') || lowerInput.includes('ofrecen') || lowerInput.includes('que hay')) {
        return "En este campus maldito encontrarás: <br> - Proyección de películas de terror <br> - Juego de Supervivencia <br> - Tienda de artículos oscuros <br> - Bebidas y snacks sangrientos";
    }

    // 4. Juego
    if (lowerInput.includes('juego') || lowerInput.includes('jugar') || lowerInput.includes('trata')) {
        return "El desafío 'Sobrevive': Tienes 15 segundos para cazar tantos espectros como puedas. Si tu puntuación es baja... tú serás el cazado.";
    }

    // 5. Default
    return "Esa pregunta aún no está disponible en mis conocimientos sobrenaturales... Intenta preguntar por precios, juegos o servicios.";
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
    // Ensure video plays or is ready (autoplay is set to 0 in HTML but users might want to click play)
    // Optional: Auto-play logic could go here if autoplay=1 was allowed and handled
}

function closeVideo() {
    videoModal.classList.add('hidden');
    // Stop video by resetting src (brute force but effective for iframes to stop audio)
    const currentSrc = trailerFrame.src;
    trailerFrame.src = '';
    trailerFrame.src = currentSrc;
}

// Close video if clicking outside content
videoModal.onclick = function (e) {
    if (e.target === videoModal) {
        closeVideo();
    }
}

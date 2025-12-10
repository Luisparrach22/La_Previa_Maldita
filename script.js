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

const botResponses = [
    "Los espíritus te observan.",
    "No mires atrás.",
    "Las entradas se agotan... igual que tu tiempo.",
    "Esa es una pregunta peligrosa.",
    "El oráculo ve oscuridad en tu futuro.",
    "Sí... o quizás no. La muerte es incierta."
];

function sendMessage() {
    const text = chatInput.value;
    if (!text) return;

    addMessage(text, 'user');
    chatInput.value = '';

    // Bot response delay
    setTimeout(() => {
        const randomResp = botResponses[Math.floor(Math.random() * botResponses.length)];
        addMessage(randomResp, 'bot');
    }, 1000);
}

function addMessage(text, type) {
    const div = document.createElement('div');
    div.classList.add('msg', type);
    div.innerText = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* --- Video Logic --- */
function playVideo() {
    alert('Reproduciendo Trailer... (Imagina gritos horribles aquí)');
}

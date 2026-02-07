
const KNOWLEDGE_BASE = {
    "hola": "Saludos, mortal... ¿Te atreves a entrar?",
    "precio": "El precio es tu alma... o $6.66 por un ticket mortal.",
    "ticket": "Los tickets están disponibles en la sección de 'Tickets'. No tardes, se agotan rápido...",
    "ubicacion": "Cementerio Central, Zona Prohibida. Solo los valientes llegan.",
    "hora": "La hora de las brujas comienza a la medianoche del 31 de Octubre.",
    "juego": "Gana almas jugando a nuestros juegos mortales: Whack-a-Ghost, Trivia y Memoria.",
    "tienda": "En la Tienda Maldita encontrarás artefactos y elixires prohibidos.",
    "contacto": "Grita al vacío... o envíanos un email si te atreves.",
    "default": "Los espíritus no entienden tu lengua... Sé más claro."
};

export function toggleChat() {
    const chat = document.getElementById('chatWidget');
    if (chat) chat.classList.toggle('closed');
}

export function sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const msg = input.value.trim();
    if (!msg) return;

    addMessage(msg, 'user');
    input.value = '';

    // Simular "escribiendo" o retraso fantasmal
    setTimeout(() => {
        const response = getBotResponse(msg);
        addMessage(response, 'bot');
    }, 1000);
}

function getBotResponse(userMsg) {
    userMsg = userMsg.toLowerCase();
    
    for (const key in KNOWLEDGE_BASE) {
        if (userMsg.includes(key)) {
            return KNOWLEDGE_BASE[key];
        }
    }
    
    return KNOWLEDGE_BASE["default"];
}

function addMessage(text, sender) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

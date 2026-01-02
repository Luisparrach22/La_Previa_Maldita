
export function setupKeyboardListeners(authSubmitCallback, sendMessageCallback) {
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const activeId = document.activeElement.id;
            
            if (['usernameInput', 'emailInput', 'passwordInput'].includes(activeId)) {
                e.preventDefault();
                if (authSubmitCallback) authSubmitCallback();
            }
            
            if (activeId === 'chatInput') {
                e.preventDefault();
                if (sendMessageCallback) sendMessageCallback();
            }
        }
    });
}

export function setupScrollEffects() {
    // Simple intersection observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    });
    
    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
    
    // Header scroll effect
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('mainNav');
        if (nav) {
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        }
    });
}

export function initCountdown() {
    const targetDate = new Date('October 31, 2025 00:00:00').getTime();
    
    function update() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        // If explicitly set elements exist
        const d = document.getElementById('days');
        const h = document.getElementById('hours');
        const m = document.getElementById('minutes');
        const s = document.getElementById('seconds');

        if (d && h && m && s) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            d.innerText = days < 10 ? '0' + days : days;
            h.innerText = hours < 10 ? '0' + hours : hours;
            m.innerText = minutes < 10 ? '0' + minutes : minutes;
            s.innerText = seconds < 10 ? '0' + seconds : seconds;
        }
    }
    
    setInterval(update, 1000);
    update();
}

export function openVideoModal() {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('trailerFrame');
    if (iframe && iframe.dataset.src) {
        iframe.src = iframe.dataset.src;
    }
    if (modal) modal.classList.remove('hidden');
}

export function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('trailerFrame');
    if (modal) modal.classList.add('hidden');
    if (iframe) {
        iframe.src = ''; 
    }
}

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
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

export function toggleMobileNav() {
    const menu = document.getElementById('mobileMenu');
    if(menu) menu.classList.toggle('active');
}

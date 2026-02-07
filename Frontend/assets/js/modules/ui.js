
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
    // Establecer el objetivo al final del año actual
    const currentYear = new Date().getFullYear();
    const targetDate = new Date(`December 31, ${currentYear} 23:59:59`).getTime();
    
    function update() {
        const now = new Date().getTime();
        let difference = targetDate - now;

        // Si la fecha ya pasó, el contador se queda en cero
        if (difference < 0) difference = 0;

        const d = document.getElementById('days');
        const h = document.getElementById('hours');
        const m = document.getElementById('minutes');
        const s = document.getElementById('seconds');

        if (d && h && m && s) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            // Formatear con ceros a la izquierda
            d.innerText = days; // Los días pueden ser más de 2 dígitos
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

// Chatbot logic moved to chatbot.js

export function toggleMobileNav() {
    const menu = document.getElementById('mobileMenu');
    if(menu) menu.classList.toggle('active');
}

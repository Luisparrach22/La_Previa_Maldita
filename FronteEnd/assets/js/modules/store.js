import { API_URL } from './config.js';

let allProducts = [];

export async function fetchTickets() {
    const grid = document.getElementById('ticketsGrid');
    if (!grid) return; 

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
        
        let imageHtml = '';
        if (ticket.image_url) {
            imageHtml = `
                <div class="ticket-image" style="height: 160px; overflow: hidden;">
                    <img src="${ticket.image_url}" alt="${ticket.name}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
            `;
        }

        let descHtml = '';
        if (ticket.description) {
            const lines = ticket.description.split('\n').filter(l => l.trim());
            if (lines.some(l => l.startsWith('-') || l.startsWith('✓') || l.startsWith('•'))) {
                descHtml = '<ul>' + lines.map(l => {
                    const content = l.replace(/^[-✓•]/, '').trim();
                    const icon = l.includes('✗') ? '✗' : '✓'; 
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
                onclick="window.addToCart('${ticket.name.replace(/'/g, "\\'")}', ${price}, ${ticket.id}, 'ticket')">
                ${isFeatured ? `Pactar por ${price} Almas` : `Invocar por ${price} Almas`}
            </button>
        `;
        grid.appendChild(card);
    });
}

export async function fetchProducts() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const res = await fetch(`${API_URL}/products/`, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (res.ok) {
                const products = await res.json();
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

export function renderStore(products) {
    const grid = document.getElementById('storeGrid');
    if (!grid) return;
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

    const storeProducts = products.filter(p => p.type !== 'ticket');
    
    if (storeProducts.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Solo hay tickets disponibles. Visita la sección de entradas.</p>';
        return;
    }

    storeProducts.forEach(p => {
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
                <button class="add-to-cart-btn" onclick="window.addToCart('${p.name.replace(/'/g, "\\'")}', ${Math.floor(p.price * 100)}, ${p.id})">Obtener por ${Math.floor(p.price * 100)}</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

export function filterStore(type) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    
    // Attempt to match target from window.event
    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    }

    if (type === 'all') {
        renderStore(allProducts);
    } else {
        const filtered = allProducts.filter(p => {
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

import { API_URL } from './config.js';
import { getCurrentUser, checkAuthSession, toggleModal } from './auth.js';
import { showNotification } from './utils.js';

let cart = [];

export function getCart() { return cart; }

export function addToCart(name, price, id = null, type = 'item') {
    cart.push({ name, price, id, type });
    updateCartIcon();
    showNotification(`Añadido: ${name}`);
    renderCart();

    // Abrir carrito
    const overlay = document.getElementById('cartOverlay');
    if (overlay) overlay.classList.add('active');
}

export function updateCartIcon() {
    const el = document.getElementById('cartCount');
    if (el) el.textContent = cart.length;
}

export function toggleCart() {
    const overlay = document.getElementById('cartOverlay');
    if (overlay) {
        overlay.classList.toggle('active');
        renderCart();
    }
}

export function renderCart() {
    const list = document.getElementById('cartList');
    const totalEl = document.getElementById('cartTotal');
    if (!list || !totalEl) return;

    list.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        list.innerHTML = '<li class="cart-empty-msg">Tu alma está vacía...</li>';
    } else {
        cart.forEach((item, index) => {
            total += item.price;
            const li = document.createElement('li');
            li.className = 'cart-item';

            const itemIcon = item.type === 'ticket' ? '🎟️' : '💀';

            li.innerHTML = `
                <div class="cart-item-img">${itemIcon}</div>
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>👻 ${item.price}</p>
                </div>
                <button class="remove-btn btn-remove" data-index="${index}">✕</button>
            `;
            list.appendChild(li);
        });
        
        // Add listeners
        list.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                removeFromCart(parseInt(btn.dataset.index));
            });
        });
    }

    totalEl.textContent = total;
}

export function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartIcon();
    renderCart();
}

export async function checkout() {
    const currentUser = getCurrentUser();
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

    const token = localStorage.getItem('token');

    const items = cart.map(item => ({
        product_id: item.id || 1, 
        quantity: 1
    }));

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
                cart.length = 0; 

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

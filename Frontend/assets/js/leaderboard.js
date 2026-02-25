/**
 * leaderboard.js — La Previa Maldita
 * Lógica del leaderboard: carga de datos, renderizado de pódium,
 * lista de ranking, tarjeta del usuario y partículas decorativas.
 */

// ============================================================
// CONFIG
// ============================================================
const PROD_API_URL = 'http://72.62.170.24:8000';
const IS_LOCAL = window.location.hostname === 'localhost' ||
                 window.location.hostname === '127.0.0.1' ||
                 window.location.hostname.startsWith('192.168.') ||
                 window.location.hostname.startsWith('10.') ||
                 window.location.hostname.startsWith('172.');

const API_URL = IS_LOCAL ? `http://${window.location.hostname}:8000` : PROD_API_URL;

const LIMIT = 20;

const GAME_LABELS = {
    ghost_hunt: '👻 Whack-a-Ghost',
    trivia:     '🧠 Trivia Maldita',
    memory:     '🃏 Memoria Letal',
};

let currentFilter = null;
let currentUserId = null;
let allEntries    = [];

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    spawnParticles();
    setLastUpdated();
    await loadCurrentUser();
    await loadLeaderboard();
});

function setLastUpdated() {
    const el = document.getElementById('lastUpdated');
    if (el) el.textContent = `Actualizado: ${new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}`;
}

async function loadCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const res = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const user = await res.json();
            currentUserId = user.id;
            showMyRankCard(user);
        }
    } catch (_) {}
}

// ============================================================
// FILTER
// ============================================================
function setFilter(gameType, btn) {
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = gameType;
    loadLeaderboard();
}

// ============================================================
// LOAD DATA
// ============================================================
async function loadLeaderboard() {
    const listEl   = document.getElementById('rankingList');
    const podiumEl = document.getElementById('podium');

    // Mostrar esqueletos mientras carga
    listEl.innerHTML = Array(5).fill(0).map((_, i) =>
        `<div class="skeleton" style="opacity:${1 - i * 0.18}; height:${i === 0 ? 68 : 62}px"></div>`
    ).join('');
    podiumEl.innerHTML = '';

    try {
        let url = `${API_URL}/games/leaderboard?limit=${LIMIT}`;
        if (currentFilter) url += `&game_type=${currentFilter}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al cargar');

        allEntries = await res.json();

        renderPodium(allEntries.slice(0, 3));
        renderList(allEntries);
        updateMyRankPosition(allEntries);

    } catch (e) {
        listEl.innerHTML = `
            <div class="state-container">
                <span class="state-icon">🕸️</span>
                <div class="state-title">El inframundo está en silencio...</div>
                <div class="state-text">No se pudo cargar la tabla. Verifica tu conexión e intenta de nuevo.</div>
            </div>`;
        podiumEl.innerHTML = '';
    }
}

// ============================================================
// RENDER PODIUM
// ============================================================
function renderPodium(top3) {
    const el = document.getElementById('podium');

    if (top3.length === 0) {
        el.innerHTML = `<div class="state-container" style="padding:30px">
            <span class="state-icon">👁️</span>
            <div class="state-title">Nadie se ha atrevido aún</div>
            <div class="state-text">Sé el primero en inscribir tu nombre entre los condenados.</div>
        </div>`;
        return;
    }

    const order   = [1, 0, 2]; // orden visual: 2°, 1°, 3°
    const classes = ['second', 'first', 'third'];
    const crowns  = ['🥈', '👑', '🥉'];

    el.innerHTML = order.map(i => {
        const entry = top3[i];
        if (!entry) return `<div class="podium-slot ${classes[order.indexOf(i)]}">
            <div class="podium-card"><div class="podium-empty">—</div></div>
            <div class="podium-base"></div>
        </div>`;

        const cls       = classes[order.indexOf(i)];
        const crown     = crowns[order.indexOf(i)];
        const name      = entry.player?.first_name || entry.player?.username || `Alma #${entry.user_id}`;
        const initial   = name.charAt(0).toUpperCase();
        const pos       = i + 1;
        const gameLabel = GAME_LABELS[entry.game_type] || entry.game_type;
        const isMe      = currentUserId && entry.player?.id === currentUserId;

        return `
        <div class="podium-slot ${cls}">
            <div class="podium-card">
                <div class="podium-crown">${crown}</div>
                <div class="podium-avatar">${initial}</div>
                <div class="podium-position">#${pos} ${cls === 'first' ? '— Señor de la Oscuridad' : ''}</div>
                <div class="podium-name">${name}${isMe ? ' (Tú)' : ''}</div>
                <div class="podium-game-badge">${gameLabel}</div>
                <div class="podium-points">${entry.points.toLocaleString('es-ES')} 👁️</div>
                <div class="podium-rank-badge">${entry.player?.rank || 'Mortal'}</div>
            </div>
            <div class="podium-base"></div>
        </div>`;
    }).join('');
}

// ============================================================
// RENDER LIST (posiciones 4 en adelante)
// ============================================================
function renderList(entries) {
    const el = document.getElementById('rankingList');

    if (entries.length === 0) {
        el.innerHTML = `
            <div class="state-container">
                <span class="state-icon">🕯️</span>
                <div class="state-title">Nadie ha jugado aún</div>
                <div class="state-text">Completa un minijuego para aparecer aquí.</div>
            </div>`;
        return;
    }

    const rest = entries.slice(3);
    if (rest.length === 0) {
        el.innerHTML = `<div class="state-container" style="padding:20px">
            <span style="font-size:24px">🌑</span><br>
            <span style="font-size:13px;color:var(--text-muted)">Solo hay 3 mortales en el registro.</span>
        </div>`;
        return;
    }

    el.innerHTML = rest.map((entry, idx) => {
        const pos       = idx + 4;
        const name      = entry.player?.first_name || entry.player?.username || `Alma #${entry.user_id}`;
        const initial   = name.charAt(0).toUpperCase();
        const gameLabel = GAME_LABELS[entry.game_type] || entry.game_type;
        const souls     = entry.player?.soul_balance ?? '—';
        const rank      = entry.player?.rank || 'Mortal';
        const isMe      = currentUserId && entry.player?.id === currentUserId;
        const isTop3    = pos <= 3;

        return `
        <div class="ranking-row ${isMe ? 'is-me' : ''}">
            <div class="rank-num ${isTop3 ? 'top3' : ''}">#${pos}</div>
            <div class="rank-info">
                <div class="rank-avatar">${initial}</div>
                <div class="rank-text">
                    <div class="rank-username">${name}${isMe ? ' 👈 Tú' : ''}</div>
                    <div class="rank-meta">
                        <span class="rank-game-tag">${gameLabel}</span>
                        <span>${rank}</span>
                        <span>👻 ${Number(souls).toLocaleString('es-ES')} almas</span>
                    </div>
                </div>
            </div>
            <div class="rank-points-col">
                <div class="rank-points">${entry.points.toLocaleString('es-ES')}</div>
                <div class="rank-souls">puntos</div>
            </div>
        </div>`;
    }).join('');
}

// ============================================================
// MY RANK CARD
// ============================================================
function showMyRankCard(user) {
    const card = document.getElementById('myRankCard');
    if (!card) return;
    document.getElementById('myRankAvatar').textContent = (user.first_name || user.username || '?').charAt(0).toUpperCase();
    document.getElementById('myRankName').textContent   = user.first_name || user.username;
    document.getElementById('myRankSub').textContent    = `${user.rank} · 👻 ${(user.soul_balance || 0).toLocaleString('es-ES')} almas`;
    card.classList.remove('hidden');
}

function updateMyRankPosition(entries) {
    if (!currentUserId) return;
    const idx   = entries.findIndex(e => e.player?.id === currentUserId);
    const posEl = document.getElementById('myRankPos');
    if (posEl) posEl.textContent = idx >= 0 ? `#${idx + 1}` : '—';
}

// ============================================================
// PARTICLES
// ============================================================
function spawnParticles() {
    for (let i = 0; i < 18; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left              = Math.random() * 100 + 'vw';
        p.style.animationDuration = (8 + Math.random() * 14) + 's';
        p.style.animationDelay    = (Math.random() * 10) + 's';
        p.style.width             = (1 + Math.random() * 3) + 'px';
        p.style.height            = p.style.width;
        document.body.appendChild(p);
    }
}

import { API_URL } from './config.js';
import { getCurrentUser, updateSoulBalance } from './auth.js';

// --- Estado Global Compartido ---
let gameActive = false;

// --- Utilidades ---
function getEl(id) {
    return document.getElementById(id);
}

function hideAllGames() {
    document.querySelectorAll('.game-container').forEach(el => el.classList.add('hidden'));
}

export function enforceGameVisibility(activeGameId) {
    const selector = getEl('gameSelector');
    if (selector) selector.classList.add('hidden');

    hideAllGames();
    
    const activeEl = getEl(activeGameId);
    if (activeEl) {
        activeEl.classList.remove('hidden');
    } else {
        console.error(`Juego no encontrado: ${activeGameId}`);
    }
}

export function selectGame(gameType) {
    console.log(`Seleccionando juego: ${gameType}`);
    enforceGameVisibility(`game-${gameType}`);
}

export function showGameMenu() {
    console.log("Volviendo al menú de juegos...");
    
    hideAllGames();
    const selector = getEl('gameSelector');
    if (selector) selector.classList.remove('hidden');
    
    resetAllGameStates();
}

function resetAllGameStates() {
    gameActive = false;

    // Reset Whack-a-Ghost
    stopWhackGame();
    
    // Reset Trivia
    const triviaFeedback = getEl('trivia-feedback');
    const triviaOptions = getEl('trivia-options');
    if (triviaFeedback) triviaFeedback.textContent = '';
    if (triviaOptions) triviaOptions.innerHTML = '';
    
    // Reset Memory
    const memoryGrid = getEl('memory-grid');
    if (memoryGrid) memoryGrid.innerHTML = '';
}

// ==========================================
// JUEGO 1: WHACK-A-GHOST (Premium Version)
// ==========================================

let whackState = {
    score: 0,
    combo: 0,
    maxCombo: 0,
    ghostsCaught: 0,
    timeLeft: 30,
    isActive: false,
    timers: {
        gameLoop: null,
        spawn: null,
        shake: null
    }
};

const ghostTypes = [
    { emoji: '👻', points: 10, duration: 1100, weight: 60 },
    { emoji: '💀', points: 20, duration: 800, weight: 25 },
    { emoji: '🎃', points: 30, duration: 600, weight: 10 },
    { emoji: '😈', points: 50, duration: 450, weight: 5 },
];

function getRandomGhostType() {
    const totalWeight = ghostTypes.reduce((sum, g) => sum + g.weight, 0);
    let random = Math.random() * totalWeight;
    for (const ghost of ghostTypes) {
        random -= ghost.weight;
        if (random <= 0) return ghost;
    }
    return ghostTypes[0];
}

function stopWhackGame() {
    whackState.isActive = false;
    clearInterval(whackState.timers.gameLoop);
    clearTimeout(whackState.timers.spawn);
    
    document.querySelectorAll('.whack-hole').forEach(hole => {
        hole.classList.remove('active', 'hit');
    });

    const startOverlay = getEl('whackStartOverlay');
    const gameOverOverlay = getEl('whackGameOver');
    const gameArea = getEl('whackGameArea');
    if (startOverlay) startOverlay.classList.remove('hidden');
    if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
    if (gameArea) gameArea.classList.add('hidden');
}

export function initWhackGame() {
    console.log("Iniciando Whack-a-Ghost Premium...");
    enforceGameVisibility('game-whack');
    stopWhackGame(); // Asegurar limpieza previa

    // Reset Variables
    whackState.isActive = true;
    whackState.score = 0;
    whackState.combo = 0;
    whackState.maxCombo = 0;
    whackState.ghostsCaught = 0;
    whackState.timeLeft = 30;

    // UI Inicial
    updateWhackUI();
    const startOverlay = getEl('whackStartOverlay');
    const gameOverOverlay = getEl('whackGameOver');
    const gameArea = getEl('whackGameArea');
    if (startOverlay) startOverlay.classList.add('hidden');
    if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
    if (gameArea) gameArea.classList.remove('hidden');

    const bestScore = localStorage.getItem('whackBestScore') || '0';
    const bestScoreDisplay = getEl('bestScoreDisplay');
    if (bestScoreDisplay) bestScoreDisplay.textContent = bestScore;

    // Configurar Tablero
    const holes = document.querySelectorAll('.wh');
    holes.forEach(hole => {
        // Clonar para eliminar listeners antiguos de forma segura
        const newHole = hole.cloneNode(true);
        hole.parentNode.replaceChild(newHole, hole);
        
        newHole.classList.remove('active', 'hit');
        newHole.addEventListener('click', () => handleHoleClick(newHole));
    });

    // Iniciar Loops
    whackState.timers.gameLoop = setInterval(() => {
        whackState.timeLeft--;
        updateWhackTimerUI();
        if (whackState.timeLeft <= 0) endWhackGame();
    }, 1000);

    spawnGhost();
}

function handleHoleClick(hole) {
    if (!whackState.isActive) return;

    if (!hole.classList.contains('active')) {
        // Fallo (rompe el combo)
        whackState.combo = 0;
        updateComboUI();
        return;
    }

    whackHitGhost(hole);
}

function whackHitGhost(hole) {
    if (hole.classList.contains('hit')) return;

    const ghostEmoji = hole.dataset.ghost || '👻';
    const ghostData = ghostTypes.find(g => g.emoji === ghostEmoji) || ghostTypes[0];

    // Lógica de Puntuación
    whackState.combo++;
    if (whackState.combo > whackState.maxCombo) whackState.maxCombo = whackState.combo;
    whackState.ghostsCaught++;

    const multiplier = Math.min(Math.floor(whackState.combo / 10) + 1, 5);
    const points = ghostData.points * multiplier;
    whackState.score += points;

    // Actualizar UI
    updateWhackUI(multiplier);
    
    // Animaciones
    hole.classList.remove('active');
    hole.classList.add('hit');
    triggerBoardShake();
    showScorePopup(hole, points, multiplier);

    setTimeout(() => {
        if(hole) hole.classList.remove('hit');
    }, 300);
}

function triggerBoardShake() {
    const board = getEl('whackBoard');
    if (board) {
        board.classList.remove('shake-anim');
        void board.offsetWidth; // Reflow forzado para reiniciar animación
        board.classList.add('shake-anim');
        setTimeout(() => board.classList.remove('shake-anim'), 300);
    }
}

function showScorePopup(hole, points, multiplier) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = multiplier > 1 ? `+${points} (${multiplier}x)` : `+${points}`;
    hole.appendChild(popup);
    setTimeout(() => popup.remove(), 800);
}

function updateWhackUI(multiplier = 1) {
    const scoreDisplay = getEl('scoreDisplay');
    if (scoreDisplay) scoreDisplay.textContent = whackState.score;
    updateComboUI(multiplier);
}

function updateComboUI(multiplier = 1) {
    const comboDisplay = getEl('comboDisplay');
    if (comboDisplay) {
        comboDisplay.textContent = `x${multiplier}`;
        if (multiplier > 1) {
            comboDisplay.style.transform = 'scale(1.2)';
            setTimeout(() => comboDisplay.style.transform = 'scale(1)', 150);
        }
    }
}

function updateWhackTimerUI() {
    const timeDisplay = getEl('timeDisplay');
    const timerFill = getEl('timerFill');
    if (timeDisplay) timeDisplay.textContent = whackState.timeLeft;
    if (timerFill) {
        const percentage = (whackState.timeLeft / 30) * 100;
        timerFill.style.width = `${percentage}%`;
    }
}

function spawnGhost() {
    if (!whackState.isActive) return;

    const holes = Array.from(document.querySelectorAll('.wh:not(.active):not(.hit)'));
    
    if (holes.length > 0) {
        const randomHole = holes[Math.floor(Math.random() * holes.length)];
        const ghost = getRandomGhostType();
        
        const ghostTarget = randomHole.querySelector('.wh-ghost');
        if (ghostTarget) {
            ghostTarget.textContent = ghost.emoji;
            randomHole.dataset.ghost = ghost.emoji;
            randomHole.classList.add('active');

            // Duración dinámica (más difícil cuanto menos tiempo queda)
            const difficultyRatio = (30 - whackState.timeLeft) / 30; 
            const duration = ghost.duration * (1 - difficultyRatio * 0.4);

            setTimeout(() => {
                if (whackState.isActive && randomHole.classList.contains('active')) {
                    randomHole.classList.remove('active');
                    // Penalización por dejar escapar fantasma (opcional: reset combo)
                    whackState.combo = 0;
                    updateComboUI();
                }
            }, duration);
        }
    }

    // Calcular siguiente aparición
    const baseDelay = 1000;
    const difficultyRatio = (30 - whackState.timeLeft) / 30;
    const nextSpawnDelay = Math.max(400, baseDelay - (difficultyRatio * 600));

    // IMPORTANTE: Guardar el ID del timer para poder cancelarlo si el juego termina
    whackState.timers.spawn = setTimeout(spawnGhost, nextSpawnDelay);
}

function endWhackGame() {
    whackState.isActive = false;
    clearInterval(whackState.timers.gameLoop);
    clearTimeout(whackState.timers.spawn);

    // Guardar mejor puntuación local
    let currentBest = parseInt(localStorage.getItem('whackBestScore') || '0');
    if (whackState.score > currentBest) {
        localStorage.setItem('whackBestScore', whackState.score);
    }

    // Mostrar Resultados
    const finalScoreEl = getEl('finalScoreDisplay');
    const caughtEl = getEl('ghostsCaughtDisplay');
    const maxComboEl = getEl('maxComboDisplay');
    
    if(finalScoreEl) finalScoreEl.textContent = whackState.score;
    if(caughtEl) caughtEl.textContent = whackState.ghostsCaught;
    if(maxComboEl) maxComboEl.textContent = `x${Math.min(Math.floor(whackState.maxCombo / 5) + 1, 5)}`;
    
    const goOverlay = getEl('whackGameOver');
    const gameArea = getEl('whackGameArea');
    if(goOverlay) goOverlay.classList.remove('hidden');
    if(gameArea) gameArea.classList.add('hidden');

    // Guardar en servidor
    if (whackState.score > 0) {
        saveGameScore('whack', whackState.score);
    }
}

// ==========================================
// JUEGO 2: TRIVIA
// ==========================================

const triviaQuestions = [
    { q: "¿En qué año se estrenó 'El Exorcista'?", options: ["1973", "1980", "1968", "1975"], correct: 0 },
    { q: "¿Cómo se llama el asesino de 'Halloween'?", options: ["Jason", "Freddy", "Michael Myers", "Leatherface"], correct: 2 },
    { q: "¿Qué dicen los cuervos?", options: ["Nunca más", "Siempre", "Morirás", "Croar"], correct: 0 },
    { q: "¿Cuál es el hotel de 'El Resplandor'?", options: ["Motel Bates", "Overlook", "Hotel California", "Cecil"], correct: 1 }
];

export function initTriviaGame() {
    console.log("Iniciando Trivia");
    enforceGameVisibility('game-trivia'); 

    const qIndex = Math.floor(Math.random() * triviaQuestions.length);
    const question = triviaQuestions[qIndex];
    
    const qEl = getEl('trivia-question');
    const optsEl = getEl('trivia-options');
    const feedbackEl = getEl('trivia-feedback');

    if (qEl) qEl.textContent = question.q;
    
    if (feedbackEl) {
        feedbackEl.textContent = '';
        feedbackEl.className = 'trivia-feedback'; 
    }

    if (optsEl) {
        optsEl.innerHTML = ''; // Limpiar opciones anteriores
        question.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'trivia-btn';
            btn.textContent = opt;
            btn.onclick = (e) => checkTriviaAnswer(index, question.correct, e.target);
            optsEl.appendChild(btn);
        });
    }
}

function checkTriviaAnswer(selected, correct, btn) {
    const feedbackEl = getEl('trivia-feedback');
    const optsEl = getEl('trivia-options');
    
    // Deshabilitar todos los botones para evitar doble clic
    if (optsEl) {
        Array.from(optsEl.children).forEach(b => b.disabled = true);
    }

    if (selected === correct) {
        btn.classList.add('correct');
        if (feedbackEl) {
            feedbackEl.textContent = "¡CORRECTO! +50 Almas";
            feedbackEl.style.color = "#059669";
        }
        saveGameScore('trivia', 50);
    } else {
        btn.classList.add('wrong');
        if (feedbackEl) {
            feedbackEl.textContent = "INCORRECTO. Tu ignorancia es fatal.";
            feedbackEl.style.color = "#dc2626";
        }
    }
    
    setTimeout(() => {
        // Verificar si el usuario sigue en la pantalla de trivia antes de recargar
        const triviaContainer = getEl('game-trivia');
        if (triviaContainer && !triviaContainer.classList.contains('hidden')) {
            initTriviaGame();
        }
    }, 2000);
}

// ==========================================
// JUEGO 3: MEMORY
// ==========================================

const memoryEmojis = ['💀', '🩸', '🕷️', '🦇', '⚰️', '🔪', '🎃', '🧟'];
let memoryState = {
    cards: [],
    flipped: [],
    locked: false
};

export function initMemoryGame() {
    console.log("Iniciando Memoria");
    enforceGameVisibility('game-memory'); 

    const grid = getEl('memory-grid');
    if (!grid) return;

    grid.innerHTML = '';
    memoryState.flipped = [];
    memoryState.cards = [];
    memoryState.locked = false;
    
    // Crear baraja duplicada y mezclar
    const deck = [...memoryEmojis, ...memoryEmojis]; 
    deck.sort(() => 0.5 - Math.random());
    
    deck.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.value = emoji;
        card.dataset.id = index;
        
        card.innerHTML = `
            <div class="front"></div>
            <div class="back">${emoji}</div>
        `;
        
        card.addEventListener('click', () => flipCard(card));
        grid.appendChild(card);
        memoryState.cards.push(card);
    });
}

function flipCard(card) {
    if (memoryState.locked) return;
    if (card.classList.contains('flipped')) return; // No voltear si ya está volteada
    
    card.classList.add('flipped');
    memoryState.flipped.push(card);

    if (memoryState.flipped.length === 2) {
        memoryState.locked = true; // Bloquear input
        checkMemoryMatch();
    }
}

function checkMemoryMatch() {
    const [card1, card2] = memoryState.flipped;
    const match = card1.dataset.value === card2.dataset.value;

    if (match) {
        // Coincidencia
        memoryState.flipped = [];
        memoryState.locked = false;
        
        // Verificar victoria
        const allFlipped = document.querySelectorAll('.memory-card.flipped').length === memoryState.cards.length;
        if (allFlipped) {
            setTimeout(() => {
                alert("¡MEMORIA PERFECTA! +100 Almas");
                saveGameScore('memory', 100);
                showGameMenu(); // Volver al menú al ganar
            }, 500);
        }
    } else {
        // No coincidencia
        setTimeout(() => {
            if (card1) card1.classList.remove('flipped');
            if (card2) card2.classList.remove('flipped');
            memoryState.flipped = [];
            memoryState.locked = false;
        }, 1000);
    }
}

// ==========================================
// SERVIDOR Y UTILIDADES
// ==========================================

async function saveGameScore(gameType, score) {
    const currentUser = getCurrentUser();
    if (!currentUser) return; 
    
    // Actualización optimista del UI
    const newBalance = (currentUser.soul_balance || 0) + score;
    updateSoulBalance(newBalance);

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token");

        const response = await fetch(`${API_URL}/games/score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                game_type: gameType,
                score_value: score
            })
        });

        if (!response.ok) {
            throw new Error("Error saving score");
        }
    } catch (err) {
        console.error("Error guardando puntuación:", err);
        // Opcional: Revertir balance si falla la API
        // updateSoulBalance(currentUser.soul_balance); 
    }
}

// Funciones heredadas (Deprecated)
export function hitTarget() {}
export function moveTarget() {}
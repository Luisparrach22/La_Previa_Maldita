import { API_URL } from './config.js';
import { getCurrentUser, updateSoulBalance } from './auth.js';

let gameScore = 0;
let gameActive = false;
let gameTimer;

export function enforceGameVisibility(activeGameId) {
    const selector = document.getElementById('gameSelector');
    if (selector) selector.classList.add('hidden');

    document.querySelectorAll('.game-container').forEach(el => {
        el.classList.add('hidden');
    });
    
    const activeEl = document.getElementById(activeGameId);
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
    
    document.querySelectorAll('.game-container').forEach(el => el.classList.add('hidden'));
    const selector = document.getElementById('gameSelector');
    if (selector) selector.classList.remove('hidden');
    
    gameActive = false;
    clearTimeout(gameTimer);
    
    // Reset Trivia
    const triviaFeedback = document.getElementById('trivia-feedback');
    const triviaOptions = document.getElementById('trivia-options');
    if (triviaFeedback) triviaFeedback.textContent = '';
    if (triviaOptions) triviaOptions.innerHTML = '';
    
    // Reset Memory
    const memoryGrid = document.getElementById('memory-grid');
    if (memoryGrid) memoryGrid.innerHTML = '';
}

// WHACK-A-GHOST
export function initWhackGame() {
    console.log("Iniciando Whack-a-Ghost");
    enforceGameVisibility('game-whack'); 
    
    if (gameActive) return;

    const target = document.getElementById('target');
    const scoreDisplay = document.getElementById('scoreDisplay');
    
    if (!target) return; 
    
    gameActive = true;
    gameScore = 0;
    if(scoreDisplay) scoreDisplay.textContent = '0';

    target.classList.remove('hidden');
    moveTarget();

    setTimeout(() => {
        endGame('whack');
    }, 15000);
}

export function moveTarget() {
    if (!gameActive) return;

    const target = document.getElementById('target');
    const gameArea = document.getElementById('gameArea');

    if (!target || !gameArea) return;

    const maxX = gameArea.clientWidth - 50;
    const maxY = gameArea.clientHeight - 50;

    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);

    target.style.left = randomX + 'px';
    target.style.top = randomY + 'px';

    clearTimeout(gameTimer);
    gameTimer = setTimeout(moveTarget, 800 + Math.random() * 500);
}

export function hitTarget() {
    if (!gameActive) return;

    gameScore += 10;
    const scoreEl = document.getElementById('scoreDisplay');
    if(scoreEl) scoreEl.textContent = gameScore;

    const target = document.getElementById('target');
    target.style.transform = "scale(0.8)";
    setTimeout(() => target.style.transform = "scale(1)", 100);

    moveTarget();
}

// TRIVIA
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
    
    const qEl = document.getElementById('trivia-question');
    const optsEl = document.getElementById('trivia-options');
    const feedbackEl = document.getElementById('trivia-feedback');

    if(qEl) qEl.textContent = question.q;
    if(optsEl) optsEl.innerHTML = '';
    if(feedbackEl) {
        feedbackEl.textContent = '';
        feedbackEl.className = 'trivia-feedback'; 
    }

    if(optsEl) {
        question.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'trivia-btn';
            btn.textContent = opt;
            
            // We need to use pass-by-reference or closure for function call
            // Since we can't easily inline the function in onclick string here if we were using string injection.
            // But we are using createElement, so we can attach listener directly.
            btn.addEventListener('click', () => checkTriviaAnswer(index, question.correct, btn));
            optsEl.appendChild(btn);
        });
    }
}

function checkTriviaAnswer(selected, correct, btn) {
    const feedbackEl = document.getElementById('trivia-feedback');
    
    document.querySelectorAll('.trivia-btn').forEach(b => b.disabled = true);

    if (selected === correct) {
        btn.classList.add('correct');
        if(feedbackEl) {
            feedbackEl.textContent = "¡CORRECTO! +50 Almas";
            feedbackEl.style.color = "#059669";
        }
        saveGameScore('trivia', 50);
    } else {
        btn.classList.add('wrong');
        if(feedbackEl) {
            feedbackEl.textContent = "INCORRECTO. Tu ignorancia es fatal.";
            feedbackEl.style.color = "#dc2626";
        }
    }
    
    setTimeout(() => {
        const triviaContainer = document.getElementById('game-trivia');
        if (triviaContainer && !triviaContainer.classList.contains('hidden')) {
            initTriviaGame();
        }
    }, 2000);
}

// MEMORY
const memoryEmojis = ['💀', '🩸', '🕷️', '🦇', '⚰️', '🔪', '🎃', '🧟'];
let memoryCards = [];
let flippedCards = [];
let memoryLocked = false;

export function initMemoryGame() {
    console.log("Iniciando Memoria");
    enforceGameVisibility('game-memory'); 

    const grid = document.getElementById('memory-grid');
    if(!grid) return;

    grid.innerHTML = '';
    flippedCards = [];
    memoryCards = [];
    
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
        
        card.onclick = () => flipCard(card);
        grid.appendChild(card);
        memoryCards.push(card);
    });
}

function flipCard(card) {
    if (memoryLocked) return;
    if (card.classList.contains('flipped')) return;
    
    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        memoryLocked = true;
        checkMemoryMatch();
    }
}

function checkMemoryMatch() {
    const [card1, card2] = flippedCards;
    const match = card1.dataset.value === card2.dataset.value;

    if (match) {
        flippedCards = [];
        memoryLocked = false;
        
        if (document.querySelectorAll('.memory-card.flipped').length === memoryCards.length) {
            setTimeout(() => {
                alert("¡MEMORIA PERFECTA! +100 Almas");
                saveGameScore('memory', 100);
            }, 500);
        }
    } else {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            memoryLocked = false;
        }, 1000);
    }
}

function saveGameScore(gameType, score) {
    const currentUser = getCurrentUser();
    if (!currentUser) return; 
    
    // Update local state implicitly via auth module if possible? 
    // Auth module exports currentUser variable but it is a const binding if imported as {currentUser}.
    // However, objects are mutable.
    if (currentUser) {
        currentUser.soul_balance = (currentUser.soul_balance || 0) + score;
        updateSoulBalance(currentUser.soul_balance);
    }

    fetch(`${API_URL}/games/score`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            game_type: gameType,
            score_value: score
        })
    }).catch(console.error);
}

function endGame(gameType) {
    gameActive = false;
    document.getElementById('target').classList.add('hidden');
    clearTimeout(gameTimer);

    alert(`¡Tiempo! Puntuación final: ${gameScore}`);

    const currentUser = getCurrentUser();
    if (currentUser && gameScore > 0) {
        saveGameScore(gameType, gameScore);
    }
}

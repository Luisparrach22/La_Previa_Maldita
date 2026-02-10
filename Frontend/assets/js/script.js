import { checkAuthSession, handleAuthSubmit, toggleModal, logout, handleGoogleSignIn, setupSessionSync, setupAuthListeners } from './modules/auth.js';
import { fetchTickets, fetchProducts, filterStore } from './modules/store.js';
import { addToCart, toggleCart, removeFromCart, checkout } from './modules/cart.js';
import { 
    initWhackGame, hitTarget, 
    initTriviaGame, 
    initMemoryGame, 
    selectGame, showGameMenu 
} from './modules/games.js';
import { 
    setupScrollEffects, initCountdown, setupKeyboardListeners, 
    closeVideoModal, toggleMobileNav 
} from './modules/ui.js';
import { toggleChat, sendMessage } from './modules/chatbot.js';

// Expose functions to window for HTML onclick compatibility
window.toggleModal = toggleModal;
window.handleAuthSubmit = handleAuthSubmit;
window.handleGoogleSignIn = handleGoogleSignIn;
window.logout = logout;

window.addToCart = addToCart;
window.toggleCart = toggleCart;
window.removeFromCart = removeFromCart;
window.checkout = checkout;

window.filterStore = filterStore;

window.selectGame = selectGame;
window.showGameMenu = showGameMenu;
window.initWhackGame = initWhackGame;
window.hitTarget = hitTarget;
window.initTriviaGame = initTriviaGame;
window.initMemoryGame = initMemoryGame;


window.closeVideoModal = closeVideoModal;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.toggleMobileNav = toggleMobileNav;

document.addEventListener('DOMContentLoaded', () => {
    console.log("👻 La Previa Maldita SCRIPT v2 (Modular) loaded");
    
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo) heroVideo.muted = true;

    checkAuthSession(false, false);
    fetchProducts();
    fetchTickets();
    initCountdown();
    setupScrollEffects();
    
    setupKeyboardListeners(handleAuthSubmit, sendMessage);
    setupAuthListeners();
    setupSessionSync();
});

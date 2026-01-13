import { API_URL } from './config.js';

export let currentUser = null;
let currentAuthMode = 'login';

export function getCurrentUser() {
    return currentUser;
}

export function updateSoulBalance(amount) {
    // Desktop
    const el = document.getElementById('userSoulBalance');
    if (el) {
        el.textContent = amount;
        // Animation effect
        el.parentElement.classList.add('pulse-anim');
        setTimeout(() => el.parentElement.classList.remove('pulse-anim'), 1000);
    }
    // Mobile
    const mobileEl = document.getElementById('mobileSoulBalance');
    if (mobileEl) mobileEl.textContent = amount;
}

export function updateUIForUser(user) {
    // Desktop UI
    const authActions = document.getElementById('authActions');
    const authUser = document.getElementById('authUser');
    
    // Mobile UI
    const mobileAuthActions = document.getElementById('mobileAuthActions');
    const mobileUserSection = document.getElementById('mobileUserSection');
    
    if (!user) {
        // Reset UI if user is null (fallback) - Show login buttons
        if (authActions) authActions.classList.remove('hidden');
        if (authUser) authUser.classList.add('hidden');
        if (mobileAuthActions) mobileAuthActions.classList.remove('hidden');
        if (mobileUserSection) mobileUserSection.classList.add('hidden');
        return;
    }
    
    // User is logged in - Show user info, hide login buttons
    if (authActions) authActions.classList.add('hidden');
    if (authUser) authUser.classList.remove('hidden');
    if (mobileAuthActions) mobileAuthActions.classList.add('hidden');
    if (mobileUserSection) mobileUserSection.classList.remove('hidden');
    
    // Update username
    const usernameSpan = document.getElementById('usernameSpan');
    if (usernameSpan) usernameSpan.textContent = user.username;

    // Update Soul Balance (desktop and mobile)
    updateSoulBalance(user.soul_balance || 0);
}

export function setCurrentUser(user) {
    currentUser = user;
}

export function logout(reload = true) {
    localStorage.removeItem('token');
    currentUser = null;
    document.getElementById('authActions').classList.remove('hidden');
    document.getElementById('authUser').classList.add('hidden');
    
    if (reload) {
        window.location.reload();
    } else {
        if (window.location.pathname.includes('user_page.html')) {
            window.location.href = '../index.html';
        }
    }
}

export function redirectToUserPage(user) {
    if (user.role === 'admin') {
        if (!window.location.href.includes('admin.html')) {
            window.location.href = 'pages/admin.html';
        }
    } else {
        if (!window.location.href.includes('user_page.html')) {
            window.location.href = 'pages/user_page.html';
        }
    }
}

export function checkAuthSession(redirectAfterLogin = false, forceRedirectOnHome = true) {
    const token = localStorage.getItem('token');

    if (!token) {
        if (currentUser) logout(false);
        return;
    }

    fetch(`${API_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => {
            if (res.ok) return res.json();
            throw new Error('Sesión expirada');
        })
        .then(user => {
            const hasChangedUser = !currentUser || currentUser.username !== user.username;
            currentUser = user;
            
            updateUIForUser(user);
            
            const isOnIndexPage = window.location.pathname.endsWith('index.html') || 
                                 window.location.pathname === '/' ||
                                 window.location.pathname.endsWith('/');

            if (isOnIndexPage && (redirectAfterLogin || (forceRedirectOnHome && user.role !== 'admin'))) {
                console.log('🔄 Usuario autenticado. Redirigiendo a su panel...');
                redirectToUserPage(user);
            }
            
            if (isOnIndexPage && user.role === 'admin' && redirectAfterLogin) {
                 redirectToUserPage(user);
            }

            if (hasChangedUser) {
                console.log(`💀 Sesión activa: ${user.username} (${user.role})`);
            }
        })
        .catch(() => {
            localStorage.removeItem('token');
            currentUser = null;
            updateUIForUser(null);
        });
}

export function toggleModal(mode = null) {
    const modal = document.getElementById('authModal');
    const title = document.getElementById('modalTitle');
    const usernameInput = document.getElementById('usernameInput');
    const emailInput = document.getElementById('emailInput');

    if (mode) {
        currentAuthMode = mode;
        title.textContent = mode === 'login' ? 'Ingresar a la Pesadilla' : 'Unirse al Culto';

        if (mode === 'login') {
            usernameInput.style.display = 'none';
        } else {
            usernameInput.style.display = 'block';
        }

        emailInput.style.display = 'block';
        emailInput.placeholder = mode === 'login' ? 'Email' : 'Email (para contactarte)';

        document.getElementById('authError').style.display = 'none';
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

export async function handleAuthSubmit() {
    const username = document.getElementById('usernameInput').value;
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const errorMsg = document.getElementById('authError');

    // Limpiar error anterior
    errorMsg.style.display = 'none';

    if (!email || !password || (currentAuthMode === 'register' && !username)) {
        errorMsg.textContent = "Todos los campos son obligatorios.";
        errorMsg.style.display = 'block';
        return;
    }

    try {
        let endpoint = currentAuthMode === 'login' ? '/users/login' : '/users/register';
        let bodyData = {};

        if (currentAuthMode === 'register') {
            bodyData = { username, email, password };
        } else {
            bodyData = { email, password };
        }

        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        if (res.ok) {
            const data = await res.json();
            if (currentAuthMode === 'register') {
                alert("✅ Cuenta creada exitosamente. Ahora puedes iniciar sesión.");
                toggleModal('login');
                document.getElementById('emailInput').value = email;
                document.getElementById('passwordInput').value = '';
                return;
            }
            localStorage.setItem('token', data.access_token);
            toggleModal(); 
            checkAuthSession(true);
        } else {
            const errData = await res.json().catch(() => ({}));
            let errorMessage = "❌ Error desconocido.";

            if (res.status === 422 && errData.detail) {
                if (Array.isArray(errData.detail)) {
                    const messages = errData.detail.map(e => e.msg || e.message || JSON.stringify(e));
                    errorMessage = "❌ " + messages.join(", ");
                } else if (typeof errData.detail === 'string') {
                    errorMessage = "❌ " + errData.detail;
                } else {
                    errorMessage = "❌ Datos inválidos. Verifica la información.";
                }
            } else if (res.status === 401) {
                errorMessage = "❌ Email o contraseña incorrectos.";
            } else if (res.status === 400) {
                errorMessage = typeof errData.detail === 'string' ? "❌ " + errData.detail : "❌ Datos inválidos.";
            } else if (errData.detail) {
                errorMessage = typeof errData.detail === 'string' ? "❌ " + errData.detail : "❌ Error del servidor.";
            }

            errorMsg.textContent = errorMessage;
            errorMsg.style.display = 'block';
        }

    } catch (networkError) {
        console.error("Error de conexión:", networkError);
        errorMsg.textContent = "🔌 No hay conexión con el servidor. Verifica que el backend esté activo.";
        errorMsg.style.display = 'block';
    }
}

export async function handleGoogleSignIn(response) {
    const googleToken = response.credential;
    const errorMsg = document.getElementById('authError');

    try {
        const res = await fetch(`${API_URL}/users/google-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: googleToken })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('token', data.access_token);
            toggleModal();
            checkAuthSession(true);
        } else {
            const err = await res.json().catch(() => ({}));
            errorMsg.textContent = err.detail || "❌ Error al autenticar con Google.";
            errorMsg.style.display = 'block';
        }
    } catch (e) {
        console.error("Google Auth Error:", e);
        errorMsg.textContent = "🔌 No hay conexión con el servidor. Verifica que el backend esté activo.";
        errorMsg.style.display = 'block';
    }
}

export function setupSessionSync() {
    window.addEventListener('storage', (event) => {
        if (event.key === 'token') {
            if (!event.newValue) {
                logout(false);
            } else {
                checkAuthSession();
            }
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            checkAuthSession(false, false);
        }
    });
}

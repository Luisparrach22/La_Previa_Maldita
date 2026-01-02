export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export function showNotification(text) {
    console.log("NOTIFICACIÓN:", text);
    // Aquí se podría implementar una notificación visual real
}

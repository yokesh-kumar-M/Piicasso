export const validatePassword = (password) => {
    const minLength = 10;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);

    const errors = [];
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
        errors.push('Password must contain at least one number');
    }
    if (!hasNonalphas) {
        errors.push('Password must contain at least one special character');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

export const validateUsername = (username) => {
    const errors = [];
    if (!username || username.length < 3) {
        errors.push('Username must be at least 3 characters');
    }
    if (username.length > 30) {
        errors.push('Username must be at most 30 characters');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.push('Username may only contain letters, numbers, underscores, and hyphens');
    }
    return { isValid: errors.length === 0, errors };
};

export const validateEmail = (email) => {
    const errors = [];
    if (email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        errors.push('Invalid email format');
    }
    return { isValid: errors.length === 0, errors };
};

/**
 * Sanitize user input to prevent XSS when displayed.
 * React auto-escapes JSX, but this is an extra safety layer for non-JSX contexts.
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
};

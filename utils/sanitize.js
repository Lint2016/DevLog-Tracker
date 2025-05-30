/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - The input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
    if (!input) return '';
    
    // Convert to string if it's not
    const str = String(input);
    
    // Remove any HTML tags and limit length
    return str.replace(/<[^>]*>?/gm, '').substring(0, 5000);
};

/**
 * Validates and sanitizes email format
 * @param {string} email - The email to validate
 * @returns {string|boolean} Sanitized email or false if invalid
 */
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase()) ? sanitizeInput(email) : false;
};

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @returns {Object} Object containing validation results
 */
export const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    
    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars, isLongEnough]
        .filter(Boolean).length;
    
    return {
        isValid: hasUpperCase && hasLowerCase && hasNumbers && isLongEnough,
        strength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChars,
        isLongEnough,
        message: !isLongEnough ? 'Password must be at least 8 characters long' :
                !hasUpperCase ? 'Password must contain at least one uppercase letter' :
                !hasLowerCase ? 'Password must contain at least one lowercase letter' :
                !hasNumbers ? 'Password must contain at least one number' :
                'Password is strong'
    };
};

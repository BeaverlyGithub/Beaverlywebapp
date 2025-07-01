/**
 * Forgot Password Script for Chilla AI Dashboard
 * Handles password reset requests
 */

// API Configuration
const API_BASE_URL = 'https://cook.beaverlyai.com';

/**
 * Initialize forgot password functionality
 */
function initializeForgotPassword() {
    const form = document.getElementById('forgot-password-form');
    if (form) {
        form.addEventListener('submit', handleForgotPasswordSubmission);
        addFormValidation();
    }
}

/**
 * Handle forgot password form submission
 * @param {Event} event - Form submit event
 */
async function handleForgotPasswordSubmission(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    
    // Validate form data
    const validation = validateFormData({ email });
    if (!validation.isValid) {
        showError(validation.message);
        return;
    }
    
    // Clear any previous messages
    hideError();
    hideSuccess();
    
    // Set loading state
    setLoadingState(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/forgot_password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess('Password reset link sent! Check your email inbox.');
            document.getElementById('forgot-password-form').reset();
            
            // Track successful submission
            trackFormSubmission('forgot-password', 'success');
            
            // Optional: Redirect after success
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        } else {
            throw new Error(data.detail || 'Failed to send reset link');
        }
        
    } catch (error) {
        console.error('Forgot password error:', error);
        showError(error.message || 'Failed to send reset link. Please try again.');
        trackFormSubmission('forgot-password', 'error');
    } finally {
        setLoadingState(false);
    }
}

/**
 * Validate form data
 * @param {Object} data - Form data to validate
 * @returns {Object} Validation result
 */
function validateFormData(data) {
    if (!data.email) {
        return { isValid: false, message: 'Email address is required' };
    }
    
    if (!isValidEmail(data.email)) {
        return { isValid: false, message: 'Please enter a valid email address' };
    }
    
    return { isValid: true };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Set loading state for the form
 * @param {boolean} loading - Loading state
 */
function setLoadingState(loading) {
    const submitBtn = document.getElementById('reset-btn');
    const loadingText = submitBtn.querySelector('.loading-text');
    const loadingSpinner = submitBtn.querySelector('.loading-spinner');
    
    if (loading) {
        submitBtn.disabled = true;
        loadingText.textContent = 'Sending...';
        loadingSpinner.classList.remove('hidden');
    } else {
        submitBtn.disabled = false;
        loadingText.textContent = 'Send Reset Link';
        loadingSpinner.classList.add('hidden');
    }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
    
    // Hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

/**
 * Hide error message
 */
function hideError() {
    const errorDiv = document.getElementById('error-message');
    errorDiv.classList.add('hidden');
}

/**
 * Show success message
 * @param {string} message - Success message to display
 */
function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    const successText = document.getElementById('success-text');
    
    successText.textContent = message;
    successDiv.classList.remove('hidden');
}

/**
 * Hide success message
 */
function hideSuccess() {
    const successDiv = document.getElementById('success-message');
    successDiv.classList.add('hidden');
}

/**
 * Add real-time form validation
 */
function addFormValidation() {
    const emailField = document.getElementById('email');
    
    if (emailField) {
        emailField.addEventListener('blur', () => validateField(emailField));
        emailField.addEventListener('input', () => clearFieldError(emailField));
    }
}

/**
 * Validate individual form field
 * @param {HTMLElement} field - Form field to validate
 */
function validateField(field) {
    const value = field.value.trim();
    let errorMessage = '';
    
    switch (field.id) {
        case 'email':
            if (!value) {
                errorMessage = 'Email address is required';
            } else if (!isValidEmail(value)) {
                errorMessage = 'Please enter a valid email address';
            }
            break;
    }
    
    if (errorMessage) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
}

/**
 * Show field error
 * @param {HTMLElement} field - Form field
 * @param {string} message - Error message
 */
function showFieldError(field, message) {
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        field.classList.add('border-red-500');
    }
}

/**
 * Clear field error
 * @param {HTMLElement} field - Form field
 */
function clearFieldError(field) {
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
        field.classList.remove('border-red-500');
    }
}

/**
 * Track form submission for analytics
 * @param {string} formName - Name of the form
 * @param {string} status - Submission status
 */
function trackFormSubmission(formName, status) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'form_submission', {
            'form_name': formName,
            'status': status
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeForgotPassword);

// Export functions for global use
window.forgotPasswordFunctions = {
    initializeForgotPassword,
    validateFormData,
    isValidEmail,
    showError,
    hideError,
    showSuccess,
    hideSuccess
};

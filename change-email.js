/**
 * Change Email Script for Chilla AI Dashboard
 * Handles email address changes with verification
 */

// API Configuration
const API_BASE_URL = 'https://cook.beaverlyai.com';

/**
 * Initialize change email functionality
 */
function initializeChangeEmail() {
    const form = document.getElementById('change-email-form');
    if (form) {
        form.addEventListener('submit', handleChangeEmailSubmission);
        addFormValidation();
    }
    
    // Load current user email
    loadCurrentUserEmail();
}

/**
 * Load current user email from auth token
 */
async function loadCurrentUserEmail() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/verify_token`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            const currentEmailField = document.getElementById('current-email');
            if (currentEmailField && data.email) {
                currentEmailField.value = data.email;
            }
        }
    } catch (error) {
        console.error('Failed to load current email:', error);
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
    }
}

/**
 * Handle change email form submission
 * @param {Event} event - Form submit event
 */
async function handleChangeEmailSubmission(event) {
    event.preventDefault();
    
    const currentEmail = document.getElementById('current-email').value.trim();
    const newEmail = document.getElementById('new-email').value.trim();
    const password = document.getElementById('password').value;
    
    // Validate form data
    const validation = validateFormData({ currentEmail, newEmail, password });
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
        const response = await fetch(`${API_BASE_URL}/api/change_email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ 
                current_email: currentEmail,
                new_email: newEmail,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess('Email change request sent! Please check your new email inbox to verify the change.');
            document.getElementById('change-email-form').reset();
            document.getElementById('current-email').value = currentEmail; // Keep current email displayed
            
            // Track successful submission
            trackFormSubmission('change-email', 'success');
            
            // Optional: Redirect after success
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 5000);
        } else {
            throw new Error(data.detail || 'Failed to change email');
        }
        
    } catch (error) {
        console.error('Change email error:', error);
        showError(error.message || 'Failed to change email. Please try again.');
        trackFormSubmission('change-email', 'error');
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
    if (!data.currentEmail) {
        return { isValid: false, message: 'Current email is required' };
    }
    
    if (!data.newEmail) {
        return { isValid: false, message: 'New email address is required' };
    }
    
    if (!isValidEmail(data.newEmail)) {
        return { isValid: false, message: 'Please enter a valid new email address' };
    }
    
    if (data.currentEmail === data.newEmail) {
        return { isValid: false, message: 'New email must be different from current email' };
    }
    
    if (!data.password) {
        return { isValid: false, message: 'Current password is required' };
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
    const submitBtn = document.getElementById('change-email-btn');
    const loadingText = submitBtn.querySelector('.loading-text');
    const loadingSpinner = submitBtn.querySelector('.loading-spinner');
    
    if (loading) {
        submitBtn.disabled = true;
        loadingText.textContent = 'Processing...';
        loadingSpinner.classList.remove('hidden');
    } else {
        submitBtn.disabled = false;
        loadingText.textContent = 'Change Email';
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
    const newEmailField = document.getElementById('new-email');
    const passwordField = document.getElementById('password');
    
    if (newEmailField) {
        newEmailField.addEventListener('blur', () => validateField(newEmailField));
        newEmailField.addEventListener('input', () => clearFieldError(newEmailField));
    }
    
    if (passwordField) {
        passwordField.addEventListener('blur', () => validateField(passwordField));
        passwordField.addEventListener('input', () => clearFieldError(passwordField));
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
        case 'new-email':
            if (!value) {
                errorMessage = 'New email address is required';
            } else if (!isValidEmail(value)) {
                errorMessage = 'Please enter a valid email address';
            } else {
                const currentEmail = document.getElementById('current-email').value;
                if (value === currentEmail) {
                    errorMessage = 'New email must be different from current email';
                }
            }
            break;
            
        case 'password':
            if (!value) {
                errorMessage = 'Current password is required';
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
document.addEventListener('DOMContentLoaded', initializeChangeEmail);

// Export functions for global use
window.changeEmailFunctions = {
    initializeChangeEmail,
    validateFormData,
    isValidEmail,
    showError,
    hideError,
    showSuccess,
    hideSuccess
};
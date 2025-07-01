/**
 * Reset Password Script for Chilla AI Dashboard
 * Handles password reset with token validation
 */

// API Configuration
const API_BASE_URL = 'https://cook.beaverlyai.com';

/**
 * Initialize reset password functionality
 */
function initializeResetPassword() {
    const form = document.getElementById('reset-password-form');
    if (form) {
        form.addEventListener('submit', handleResetPasswordSubmission);
        addFormValidation();
    }
    
    // Check if token exists in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showError('Invalid or missing reset token. Please request a new password reset link.');
        document.getElementById('reset-btn').disabled = true;
    }
}

/**
 * Handle reset password form submission
 * @param {Event} event - Form submit event
 */
async function handleResetPasswordSubmission(event) {
    event.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    // Validate form data
    const validation = validateFormData({ password, confirmPassword });
    if (!validation.isValid) {
        showError(validation.message);
        return;
    }
    
    if (!token) {
        showError('Invalid or missing reset token.');
        return;
    }
    
    // Clear any previous messages
    hideError();
    hideSuccess();
    
    // Set loading state
    setLoadingState(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/reset_password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ 
                token: token,
                new_password: password 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess('Password updated successfully! Redirecting to login...');
            document.getElementById('reset-password-form').reset();
            
            // Track successful submission
            trackFormSubmission('reset-password', 'success');
            
            // Redirect to login after success
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            throw new Error(data.detail || 'Failed to reset password');
        }
        
    } catch (error) {
        console.error('Reset password error:', error);
        showError(error.message || 'Failed to reset password. Please try again.');
        trackFormSubmission('reset-password', 'error');
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
    if (!data.password) {
        return { isValid: false, message: 'New password is required' };
    }
    
    if (data.password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    
    if (!data.confirmPassword) {
        return { isValid: false, message: 'Please confirm your password' };
    }
    
    if (data.password !== data.confirmPassword) {
        return { isValid: false, message: 'Passwords do not match' };
    }
    
    return { isValid: true };
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
        loadingText.textContent = 'Updating...';
        loadingSpinner.classList.remove('hidden');
    } else {
        submitBtn.disabled = false;
        loadingText.textContent = 'Update Password';
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
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirm-password');
    
    if (passwordField) {
        passwordField.addEventListener('blur', () => validateField(passwordField));
        passwordField.addEventListener('input', () => {
            clearFieldError(passwordField);
            // Re-validate confirm password if it has a value
            if (confirmPasswordField.value) {
                validateField(confirmPasswordField);
            }
        });
    }
    
    if (confirmPasswordField) {
        confirmPasswordField.addEventListener('blur', () => validateField(confirmPasswordField));
        confirmPasswordField.addEventListener('input', () => clearFieldError(confirmPasswordField));
    }
}

/**
 * Validate individual form field
 * @param {HTMLElement} field - Form field to validate
 */
function validateField(field) {
    const value = field.value;
    let errorMessage = '';
    
    switch (field.id) {
        case 'password':
            if (!value) {
                errorMessage = 'Password is required';
            } else if (value.length < 8) {
                errorMessage = 'Password must be at least 8 characters long';
            }
            break;
            
        case 'confirm-password':
            const password = document.getElementById('password').value;
            if (!value) {
                errorMessage = 'Please confirm your password';
            } else if (value !== password) {
                errorMessage = 'Passwords do not match';
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
document.addEventListener('DOMContentLoaded', initializeResetPassword);

// Export functions for global use
window.resetPasswordFunctions = {
    initializeResetPassword,
    validateFormData,
    showError,
    hideError,
    showSuccess,
    hideSuccess
};

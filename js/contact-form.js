/**
 * Contact Form Script for Chilla AI Dashboard
 * Handles form submission using EmailJS
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeContactForm();
});

/**
 * Initialize contact form functionality
 */
function initializeContactForm() {
    const form = document.getElementById('contact-form');
    
    if (form) {
        form.addEventListener('submit', handleFormSubmission);
        
        // Initialize EmailJS
        initializeEmailJS();
        
        // Add real-time validation
        addFormValidation();
    }
}

/**
 * Initialize EmailJS with service configuration
 */
function initializeEmailJS() {
    // Get EmailJS configuration from environment variables or use defaults
    const publicKey = '0w-mDmXc8j3hyp1hw';
    const serviceId = 'service_y3t9c3s';
    const templateId = 'template_b5c3sacid';
    
    // Initialize EmailJS
    if (window.emailjs) {
        emailjs.init(publicKey);
    }
    
    // Store configuration for form submission
    window.emailjsConfig = {
        serviceId: serviceId,
        templateId: templateId
    };
}



/**
 * Handle contact form submission
 * @param {Event} event - Form submit event
 */
async function handleFormSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('#submit-btn');
    const messageElement = document.getElementById('form-message');
    
    // Get form data
    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
    };
    
    // Validate form data
    const validation = validateFormData(data);
    if (!validation.isValid) {
        showFormMessage(validation.message, 'error');
        return;
    }
    
    // Show loading state
    if (window.ChillaAI) {
        window.ChillaAI.setButtonLoading(submitButton, true);
    }
    
    try {
        // Send email using EmailJS
        await sendEmail(data);
        
        // Show success message
        showFormMessage('Your message has been sent successfully! We\'ll get back to you within 24 hours.', 'success');
        
        // Reset form
        form.reset();
        
        // Track successful submission (if analytics is implemented)
        trackFormSubmission('contact_form', 'success');
        
    } catch (error) {
        console.error('Form submission error:', error);
        showFormMessage('Failed to send message. Please try again or contact us directly.', 'error');
        
        // Track failed submission
        trackFormSubmission('contact_form', 'error');
    } finally {
        // Remove loading state
        if (window.ChillaAI) {
            window.ChillaAI.setButtonLoading(submitButton, false);
        }
    }
}

/**
 * Validate form data
 * @param {Object} data - Form data to validate
 * @returns {Object} Validation result
 */
function validateFormData(data) {
    // Check required fields
    if (!data.name || data.name.trim().length < 2) {
        return {
            isValid: false,
            message: 'Please enter your full name (at least 2 characters).'
        };
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        return {
            isValid: false,
            message: 'Please enter a valid email address.'
        };
    }
    
    if (!data.subject) {
        return {
            isValid: false,
            message: 'Please select a subject for your message.'
        };
    }
    
    if (!data.message || data.message.trim().length < 10) {
        return {
            isValid: false,
            message: 'Please enter a detailed message (at least 10 characters).'
        };
    }
    
   

/**
 * Send email using EmailJS
 * @param {Object} data - Form data to send
 * @returns {Promise} EmailJS send promise
 */
async function sendEmail(data) {
    if (!window.emailjs) {
        throw new Error('EmailJS not loaded');
    }
    
    const config = window.emailjsConfig;
    if (!config || !config.serviceId || !config.templateId) {
        throw new Error('EmailJS configuration missing');
    }
    
    // Prepare template parameters
    const templateParams = {
        from_name: data.name,
        from_email: data.email,
        subject: data.subject,
        message: data.message,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        page_url: window.location.href
    };
    
    // Send email
    return emailjs.send(config.serviceId, config.templateId, templateParams);
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
 * Show form message
 * @param {string} message - Message to display
 * @param {string} type - Message type (success, error, info)
 */
function showFormMessage(message, type) {
    const messageElement = document.getElementById('form-message');
    
    let className = 'message-info';
    let iconSvg = '';
    
    switch (type) {
        case 'success':
            className = 'message-success';
            iconSvg = `
                <svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            `;
            break;
        case 'error':
            className = 'message-error';
            iconSvg = `
                <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
            `;
            break;
        default:
            iconSvg = `
                <svg class="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            `;
    }
    
    messageElement.innerHTML = `
        <div class="${className}">
            <div class="flex items-start space-x-3">
                ${iconSvg}
                <p class="flex-1">${message}</p>
            </div>
        </div>
    `;
    
    messageElement.classList.remove('hidden');
    
    // Scroll to message
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto-hide success messages after 10 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageElement.classList.add('hidden');
        }, 10000);
    }
}

/**
 * Add real-time form validation
 */
function addFormValidation() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            // Clear error state when user starts typing
            clearFieldError(this);
        });
    });
}

/**
 * Validate individual form field
 * @param {HTMLElement} field - Form field to validate
 */
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    switch (field.name) {
        case 'name':
            if (!value || value.length < 2) {
                isValid = false;
                errorMessage = 'Name must be at least 2 characters long';
            }
            break;
            
        case 'email':
            if (!value) {
                isValid = false;
                errorMessage = 'Email is required';
            } else if (!isValidEmail(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            break;
            
        case 'mt5_id':
            if (value && !isValidMT5AccountId(value)) {
                isValid = false;
                errorMessage = 'MT5 Account ID must be 8+ digits';
            }
            break;
            
        case 'subject':
            if (!value) {
                isValid = false;
                errorMessage = 'Please select a subject';
            }
            break;
            
        case 'message':
            if (!value || value.length < 10) {
                isValid = false;
                errorMessage = 'Message must be at least 10 characters long';
            }
            break;
    }
    
    if (isValid) {
        clearFieldError(field);
        field.classList.add('form-success');
    } else {
        showFieldError(field, errorMessage);
    }
}

/**
 * Show field error
 * @param {HTMLElement} field - Form field
 * @param {string} message - Error message
 */
function showFieldError(field, message) {
    field.classList.add('form-error');
    field.classList.remove('form-success');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorElement = document.createElement('p');
    errorElement.className = 'field-error text-red-500 text-sm mt-1';
    errorElement.textContent = message;
    field.parentNode.appendChild(errorElement);
}

/**
 * Clear field error
 * @param {HTMLElement} field - Form field
 */
function clearFieldError(field) {
    field.classList.remove('form-error');
    
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

/**
 * Track form submission for analytics
 * @param {string} formName - Name of the form
 * @param {string} status - Submission status
 */
function trackFormSubmission(formName, status) {
    // Placeholder for analytics tracking
    // In a real implementation, this would send data to analytics service
    console.log(`Form submission tracked: ${formName} - ${status}`);
    
    // Example: Google Analytics event tracking
    if (window.gtag) {
        gtag('event', 'form_submission', {
            form_name: formName,
            status: status
        });
    }
}

/**
 * Export functions for global use
 */
window.ContactForm = {
    validateFormData,
    isValidEmail,
    showFormMessage
};

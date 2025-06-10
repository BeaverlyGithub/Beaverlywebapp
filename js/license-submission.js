/**
 * License Submission Script for Chilla AI Dashboard
 * Handles license details submission via SendGrid email
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeLicenseSubmission();
});

/**
 * Initialize license submission functionality
 */
function initializeLicenseSubmission() {
    const form = document.getElementById('license-submission-form');
    
    if (form) {
        form.addEventListener('submit', handleLicenseSubmission);
    }
}

/**
 * Open license submission modal
 */
function openLicenseSubmissionModal() {
    const modal = document.getElementById('license-submission-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Focus on first input
        setTimeout(() => {
            const nameInput = document.getElementById('submission-name');
            if (nameInput) nameInput.focus();
        }, 100);
    }
}

/**
 * Close license submission modal
 */
function closeLicenseSubmissionModal() {
    const modal = document.getElementById('license-submission-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Reset form and messages
        const form = document.getElementById('license-submission-form');
        const messageElement = document.getElementById('submission-message');
        
        if (form) form.reset();
        if (messageElement) {
            messageElement.classList.add('hidden');
            messageElement.innerHTML = '';
        }
    }
}

/**
 * Handle license submission form
 * @param {Event} event - Form submit event
 */
async function handleLicenseSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('#submission-submit-btn');
    const messageElement = document.getElementById('submission-message');
    
    // Get form data
    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        license_details: formData.get('license_details')
    };
    
    // Validate form data
    const validation = validateSubmissionData(data);
    if (!validation.isValid) {
        showSubmissionMessage(validation.message, 'error');
        return;
    }
    
    // Show loading state
    if (window.ChillaAI) {
        window.ChillaAI.setButtonLoading(submitButton, true);
    }
    
    try {
        // Send email using mailto
        sendLicenseSubmissionEmail(data);
        
        // Show success message
        showSubmissionMessage(
            'Your email client will open with the license details. Please send the email to complete your submission. We\'ll validate your license within 24 hours and send you an update via email. If you don\'t hear from us within 24 hours, please contact support.',
            'success'
        );
        
        // Reset form after delay
        setTimeout(() => {
            form.reset();
        }, 3000);
        
    } catch (error) {
        console.error('License submission error:', error);
        showSubmissionMessage(
            'Failed to open email client. Please manually send your license details to beaverlytechnologies@gmail.com',
            'error'
        );
    } finally {
        // Remove loading state
        if (window.ChillaAI) {
            window.ChillaAI.setButtonLoading(submitButton, false);
        }
    }
}

/**
 * Validate submission form data
 * @param {Object} data - Form data to validate
 * @returns {Object} Validation result
 */
function validateSubmissionData(data) {
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
    
    if (!data.license_details || data.license_details.trim().length < 20) {
        return {
            isValid: false,
            message: 'Please paste the complete license generator output (at least 20 characters).'
        };
    }
    
    return { isValid: true };
}

/**
 * Send license submission email using mailto
 * @param {Object} data - Form data to send
 */
function sendLicenseSubmissionEmail(data) {
    const subject = `License Details Submission - ${data.name}`;
    const body = generateEmailBody(data);
    
    // Create mailto URL
    const mailtoURL = `mailto:beaverlytechnologies@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open email client
    window.location.href = mailtoURL;
}

/**
 * Generate email body for license submission
 * @param {Object} data - Form data
 * @returns {string} Plain text email body
 */
function generateEmailBody(data) {
    return `License Details Submission - Chilla AI Dashboard

Customer Information:
Name: ${data.name}
Email: ${data.email}
Submission Time: ${new Date().toLocaleString()}

License Generator Output:
${data.license_details}

Action Required:
- Validate the provided license details
- Add user to the users.json database if valid
- Reply to customer within 24 hours at: ${data.email}
- If invalid, provide clear instructions for next steps

This email was sent from the Chilla AI Dashboard license submission system.
Beaverly Technologies - Autonomous Execution, Total Control`;
}

/**
 * Show submission message
 * @param {string} message - Message to display
 * @param {string} type - Message type (success, error, info)
 */
function showSubmissionMessage(message, type) {
    const messageElement = document.getElementById('submission-message');
    
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
 * Close modal when clicking outside
 */
document.addEventListener('click', function(event) {
    const modal = document.getElementById('license-submission-modal');
    if (modal && event.target === modal) {
        closeLicenseSubmissionModal();
    }
});

/**
 * Close modal with Escape key
 */
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('license-submission-modal');
        if (modal && !modal.classList.contains('hidden')) {
            closeLicenseSubmissionModal();
        }
    }
});

/**
 * Export functions for global use
 */
window.LicenseSubmission = {
    openLicenseSubmissionModal,
    closeLicenseSubmissionModal,
    validateSubmissionData,
    isValidEmail
};
/**
 * License Validation Script for Chilla AI Dashboard
 * Handles MT5 Account ID validation and user license verification
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeLicenseValidator();
});

/**
 * Initialize license validation functionality
 */
function initializeLicenseValidator() {
    const form = document.getElementById('license-form');
    const loadingElement = document.getElementById('loading');
    const resultElement = document.getElementById('validation-result');
    
    if (form) {
        form.addEventListener('submit', handleLicenseValidation);
    }
}

/**
 * Handle license validation form submission
 * @param {Event} event - Form submit event
 */
async function handleLicenseValidation(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const mt5Input = form.querySelector('#mt5-account');
    const loadingElement = document.getElementById('loading');
    const resultElement = document.getElementById('validation-result');
    
    const mt5AccountId = mt5Input.value.trim();
    
    // Validate input
    if (!mt5AccountId) {
        showValidationError('Please enter your MT5 Account ID');
        return;
    }
    
    if (!isValidMT5AccountId(mt5AccountId)) {
        showValidationError('Please enter a valid MT5 Account ID (8+ digits)');
        return;
    }
    
    // Show loading state
    form.style.display = 'none';
    loadingElement.classList.remove('hidden');
    resultElement.classList.add('hidden');
    
    try {
        // Validate license against users.json
        const licenseData = await validateLicense(mt5AccountId);
        
        if (licenseData) {
            showValidationSuccess(licenseData);
        } else {
            showValidationError('License not found or expired. Please contact support if you believe this is an error.');
        }
    } catch (error) {
        console.error('License validation error:', error);
        showValidationError('An error occurred while validating your license. Please try again.');
    } finally {
        // Hide loading state
        loadingElement.classList.add('hidden');
        resultElement.classList.remove('hidden');
    }
}

/**
 * Validate MT5 Account ID format
 * @param {string} accountId - MT5 Account ID to validate
 * @returns {boolean} Whether the account ID is valid
 */
function isValidMT5AccountId(accountId) {
    // MT5 Account IDs are typically 8+ digit numbers
    const mt5Regex = /^\d{8,}$/;
    return mt5Regex.test(accountId);
}

/**
 * Validate license against user database
 * @param {string} mt5AccountId - MT5 Account ID to validate
 * @returns {Promise<Object|null>} License data or null if not found
 */
async function validateLicense(mt5AccountId) {
    try {
        // Fetch user data
        const response = await fetch('data/users.json');
        
        if (!response.ok) {
            throw new Error('Failed to load user data');
        }
        
        const userData = await response.json();
        
        // Find user by MT5 Account ID
        const user = userData.users.find(u => u.account === mt5AccountId);
        
        if (!user) {
            return null;
        }
        
        // Check if license is expired
        const expiryDate = new Date(user.expiry);
        const now = new Date();
        
        if (expiryDate < now) {
            return null; // License expired
        }
        
        return user;
    } catch (error) {
        console.error('Error validating license:', error);
        throw error;
    }
}

/**
 * Show validation success result
 * @param {Object} licenseData - License data from validation
 */
function showValidationSuccess(licenseData) {
    const resultElement = document.getElementById('validation-result');
    
    // Store license data for download page
    localStorage.setItem('validatedLicense', JSON.stringify(licenseData));
    
    const expiryDate = new Date(licenseData.expiry);
    const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    resultElement.innerHTML = `
        <div class="license-valid">
            <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div>
                    <h3 class="text-xl font-semibold text-green-800 mb-1">License Valid!</h3>
                    <p class="text-green-600">Your Chilla AI™ license is active and ready to use.</p>
                </div>
            </div>
            
            <div class="bg-white rounded-lg p-6 mb-6 border border-green-200">
                <div class="grid md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">Account ID</label>
                        <p class="text-lg font-semibold text-gray-900">${licenseData.account}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">Plan</label>
                        <p class="text-lg font-semibold text-gray-900">${licenseData.plan}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">Expires</label>
                        <p class="text-lg font-semibold text-gray-900">${formattedExpiry}</p>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-4">
                <a href="download.html" class="btn-primary flex-1 text-center">
                    Access Download Center
                </a>
                <button onclick="startOver()" class="btn-secondary flex-1">
                    Validate Another License
                </button>
            </div>
        </div>
    `;
    
    // Show success notification
    if (window.ChillaAI) {
        window.ChillaAI.showNotification('License validation successful!', 'success');
    }
}

/**
 * Show validation error result
 * @param {string} message - Error message to display
 */
function showValidationError(message) {
    const resultElement = document.getElementById('validation-result');
    
    resultElement.innerHTML = `
        <div class="license-invalid">
            <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                </div>
                <div>
                    <h3 class="text-xl font-semibold text-red-800 mb-1">Validation Failed</h3>
                    <p class="text-red-600">${message}</p>
                </div>
            </div>
            
            <div class="bg-white rounded-lg p-6 mb-6 border border-red-200">
                <h4 class="font-semibold text-gray-900 mb-3">What to do next:</h4>
                <ul class="space-y-2 text-gray-600">
                    <li class="flex items-start space-x-2">
                        <svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Double-check your MT5 Account ID for any typos</span>
                    </li>
                    <li class="flex items-start space-x-2">
                        <svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Use the license generator tool to get your correct account details</span>
                    </li>
                    <li class="flex items-start space-x-2">
                        <svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Contact support if you continue to have issues</span>
                    </li>
                </ul>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-4">
                <button onclick="startOver()" class="btn-primary flex-1">
                    Try Again
                </button>
                <a href="contact.html" class="btn-secondary flex-1 text-center">
                    Contact Support
                </a>
            </div>
        </div>
    `;
    
    // Show error notification
    if (window.ChillaAI) {
        window.ChillaAI.showNotification(message, 'error');
    }
}

/**
 * Reset form to start over
 */
function startOver() {
    const form = document.getElementById('license-form');
    const loadingElement = document.getElementById('loading');
    const resultElement = document.getElementById('validation-result');
    const mt5Input = document.getElementById('mt5-account');
    
    // Reset form
    if (form) {
        form.reset();
        form.style.display = 'block';
    }
    
    // Hide loading and results
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
    
    if (resultElement) {
        resultElement.classList.add('hidden');
        resultElement.innerHTML = '';
    }
    
    // Focus on input
    if (mt5Input) {
        mt5Input.focus();
    }
    
    // Clear stored license data
    localStorage.removeItem('validatedLicense');
}

/**
 * Handle input validation in real-time
 */
document.addEventListener('DOMContentLoaded', function() {
    const mt5Input = document.getElementById('mt5-account');
    
    if (mt5Input) {
        mt5Input.addEventListener('input', function() {
            const value = this.value.trim();
            
            // Remove any non-numeric characters
            this.value = value.replace(/\D/g, '');
            
            // Validate format
            if (value && !isValidMT5AccountId(value)) {
                this.classList.add('form-error');
                this.classList.remove('form-success');
            } else if (value) {
                this.classList.remove('form-error');
                this.classList.add('form-success');
            } else {
                this.classList.remove('form-error', 'form-success');
            }
        });
    }
});

/**
 * Export functions for global use
 */
window.LicenseValidator = {
    validateLicense,
    isValidMT5AccountId,
    startOver
};

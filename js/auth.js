document.addEventListener('DOMContentLoaded', function () {
    const authForm = document.getElementById('auth-form');
    const authBtn = document.getElementById('auth-btn');
    const authText = document.getElementById('auth-text');
    const authSpinner = document.getElementById('auth-spinner');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const gmailLoginBtn = document.getElementById('gmail-login-btn');
    
    let isLoginMode = true;

    // Check cookie-based auth by pinging backend
    (async () => {
    try {
        const res = await fetch('https://cook.beaverlyai.com/api/verify_token', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: null })
        });

        if (!res.ok) return;

        const json = await res.json();
        if (json.status === "valid") {
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        }
    } catch (err) {
        console.warn('Silent auth check failed:', err);
    }
})();


    // Tab switching functionality
    loginTab.addEventListener('click', function() {
        isLoginMode = true;
        loginTab.className = 'flex-1 py-2 px-4 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm';
        registerTab.className = 'flex-1 py-2 px-4 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900';
        authText.textContent = 'Sign In';
    });

    registerTab.addEventListener('click', function() {
        isLoginMode = false;
        registerTab.className = 'flex-1 py-2 px-4 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm';
        loginTab.className = 'flex-1 py-2 px-4 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900';
        authText.textContent = 'Sign Up';
    });

    // Gmail login functionality
    gmailLoginBtn.addEventListener('click', async function() {
        setLoadingState(true);
        hideError();
        
        try {
            // Implement Gmail OAuth flow here
            showError('Gmail login will be implemented soon. Please use email/password for now.');
        } catch (error) {
            showError('Gmail login failed. Please try email/password instead.');
        } finally {
            setLoadingState(false);
        }
    });

    authForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }

        setLoadingState(true);
        hideError();

        try {
            const endpoint = isLoginMode ? 'login' : 'register';
            const response = await fetch(`https://cook.beaverlyai.com/api/${endpoint}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `${isLoginMode ? 'Login' : 'Registration'} failed`);
            }

            const data = await response.json();
            
            if (data.status === 'success') {
                // Store user email for later use
                localStorage.setItem('chilla_user_email', email);
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                throw new Error(data.message || `${isLoginMode ? 'Login' : 'Registration'} failed`);
            }

        } catch (error) {
            console.error(error);
            showError(error.message || 'Connection failed.');
        } finally {
            setLoadingState(false);
        }
    });

    function setLoadingState(loading) {
        authBtn.disabled = loading;
        authText.textContent = loading ? (isLoginMode ? 'Signing In...' : 'Signing Up...') : (isLoginMode ? 'Sign In' : 'Sign Up');
        authSpinner.classList.toggle('hidden', !loading);
    }

    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }
});

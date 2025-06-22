document.addEventListener('DOMContentLoaded', function() {
    const connectionForm = document.getElementById('connection-form');
    const connectBtn = document.getElementById('connect-btn');
    const connectText = document.getElementById('connect-text');
    const connectSpinner = document.getElementById('connect-spinner');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    // Check if user is already connected
    const authToken = localStorage.getItem('chilla_auth_token');
    if (authToken) {
        window.location.href = 'dashboard.html';
    }

    connectionForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const mt5Id = document.getElementById('mt5-id').value;
        const mt5Password = document.getElementById('mt5-password').value;

        // Validate inputs
        if (!mt5Id || !mt5Password) {
            showError('Please fill in all required fields');
            return;
        }

        setLoadingState(true);
        hideError();

        try {
            // Step 1: Validate license with MT5 ID
            const licenseResponse = await fetch('https://cloud-m2-production.up.railway.app/api/license_status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mt5_account_id: mt5Id
                })
            });

            if (!licenseResponse.ok) {
                throw new Error('MT5 account not licensed. Please ensure your account has an active Chilla AI license.');
            }

            const licenseData = await licenseResponse.json();
            
            // Step 2: Connect MT5 credentials to backend
            const connectResponse = await fetch('/connect_mt5', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mt5_account_id: mt5Id,
                    mt5_password: mt5Password,
                    license_data: licenseData
                })
            });

            if (!connectResponse.ok) {
                throw new Error('Failed to connect MT5 account. Please check your credentials.');
            }

            const connectData = await connectResponse.json();
            
            // Store auth token and user data
            localStorage.setItem('chilla_auth_token', connectData.auth_token || 'temp_token');
            localStorage.setItem('chilla_license_data', JSON.stringify(licenseData));
            localStorage.setItem('chilla_mt5_id', mt5Id);
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error('Connection error:', error);
            showError(error.message || 'Connection failed. Please check your credentials and try again.');
        } finally {
            setLoadingState(false);
        }
    });

    function setLoadingState(loading) {
        connectBtn.disabled = loading;
        if (loading) {
            connectText.textContent = 'Connecting...';
            connectSpinner.classList.remove('hidden');
        } else {
            connectText.textContent = 'Connect to Chilla AI';
            connectSpinner.classList.add('hidden');
        }
    }

    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        setTimeout(() => {
            hideError();
        }, 5000);
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const connectionForm = document.getElementById('connection-form');
    const connectBtn = document.getElementById('connect-btn');
    const connectText = document.getElementById('connect-text');
    const connectSpinner = document.getElementById('connect-spinner');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    // Auto-redirect if already authenticated
    fetch('https://cloud-m2-production.up.railway.app/api/verify_token', {
        method: 'POST',
        credentials: 'include'
    })
    .then(res => {
        if (res.ok) {
            window.location.href = 'dashboard.html';
        }
    })
    .catch(() => { /* fail silently */ });

    connectionForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const mt5Id = document.getElementById('mt5-id').value.trim();
        const mt5Password = document.getElementById('mt5-password').value.trim();
        const broker = document.getElementById('mt5-broker').value.trim();
        const server = document.getElementById('mt5-server').value.trim();

        if (!mt5Id || !mt5Password || !broker || !server) {
            showError('Please fill in all fields (ID, password, broker, server)');
            return;
        }

        setLoadingState(true);
        hideError();

        try {
            const connectResponse = await fetch(`https://cloud-m2-production.up.railway.app/api/connect_mt5`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    mt5_id: mt5Id,
                    mt5_password: mt5Password,
                    broker: broker,
                    server: server
                })
            });

            if (!connectResponse.ok) {
                throw new Error('Failed to connect MT5 account.');
            }

            // Store minimal session info
            localStorage.setItem('chilla_mt5_id', mt5Id);
            localStorage.setItem('chilla_broker', broker);

            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error(error);
            showError(error.message || 'Connection failed.');
        } finally {
            setLoadingState(false);
        }
    });

    function setLoadingState(loading) {
        connectBtn.disabled = loading;
        connectText.textContent = loading ? 'Connecting...' : 'Connect to Chilla AI';
        connectSpinner.classList.toggle('hidden', !loading);
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

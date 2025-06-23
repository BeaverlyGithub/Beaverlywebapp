document.addEventListener('DOMContentLoaded', function () {
    const connectionForm = document.getElementById('connection-form');
    const connectBtn = document.getElementById('connect-btn');
    const connectText = document.getElementById('connect-text');
    const connectSpinner = document.getElementById('connect-spinner');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    // Check cookie-based auth by pinging backend
    fetch('https://cloud-m2-production.up.railway.app/api/verify_token', {
        method: 'POST',
        credentials: 'include', // <-- send cookie automatically
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: null }) // token body not used; backend checks cookie
    })
    .then(res => {
        if (res.ok) {
            window.location.href = 'dashboard.html';
        }
    })
    .catch(() => { /* silently ignore if unauthenticated */ });

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
            const licenseResponse = await fetch(`https://cloud-m2-production.up.railway.app/api/license_status?mt5_id=${mt5Id}`);

            if (!licenseResponse.ok) {
                throw new Error('MT5 account not licensed.');
            }

            const licenseData = await licenseResponse.json();

            const connectResponse = await fetch(`https://cloud-m2-production.up.railway.app/api/connect_mt5`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // <-- required to store secure cookie
                body: JSON.stringify({
                    mt5_account_id: mt5Id,
                    mt5_password: mt5Password,
                    broker: broker,
                    server: server,
                    license_data: licenseData
                })
            });

            if (!connectResponse.ok) {
                throw new Error('Failed to connect MT5 account.');
            }

            // ✅ We are NOT storing auth_token anymore — only non-sensitive local info
            localStorage.setItem('chilla_license_data', JSON.stringify(licenseData));
            localStorage.setItem('chilla_mt5_id', mt5Id);
            localStorage.setItem('chilla_broker', broker);
            localStorage.setItem('chilla_server', server);

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

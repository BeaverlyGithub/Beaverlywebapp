document.addEventListener('DOMContentLoaded', function () {
    const connectionForm = document.getElementById('connection-form');
    const connectBtn = document.getElementById('connect-btn');
    const connectText = document.getElementById('connect-text');
    const connectSpinner = document.getElementById('connect-spinner');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    const authToken = localStorage.getItem('chilla_auth_token');
    if (authToken) {
        window.location.href = 'dashboard.html';
    }

    connectionForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const mt5Id = document.getElementById('mt5-id').value.trim();
        const mt5Password = document.getElementById('mt5-password').value.trim();

        if (!mt5Id || !mt5Password) {
            showError('Please fill in all required fields');
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

            const connectResponse = await fetch(`https://cloud-m2-production.up.railway.app/connect_mt5`, {
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
                throw new Error('Failed to connect MT5 account.');
            }

            const connectData = await connectResponse.json();

            localStorage.setItem('chilla_auth_token', connectData.auth_token || 'temp_token');
            localStorage.setItem('chilla_license_data', JSON.stringify(licenseData));
            localStorage.setItem('chilla_mt5_id', mt5Id);

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

document.addEventListener('DOMContentLoaded', async function () {
    let userProfile = null;
    let isAuthenticated = false;

    // Verify user authentication using secure cookie
    try {
        const res = await fetch('https://cook.beaverlyai.com/api/verify_token', {
            method: 'POST',
            credentials: 'include'
        });

        if (!res.ok) {
            localStorage.clear();
            window.location.href = 'index.html';
            return;
        }

        const data = await res.json();
        if (data.status === 'valid') {
            isAuthenticated = true;
            userProfile = data.users || {};
        } else {
            localStorage.clear();
            window.location.href = 'index.html';
            return;
        }
    } catch (e) {
        console.error('Authentication failed:', e);
        localStorage.clear();
        window.location.href = 'index.html';
        return;
    }

    // Initialize dashboard with user-specific features
    initializeDashboard(userProfile);
    loadDashboardData();
    setInterval(loadDashboardData, 30000);

    document.getElementById('logout-btn').addEventListener('click', async function() {
        localStorage.clear();
        try {
            await fetch('https://cook.beaverlyai.com/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (err) {
            console.warn('Logout failed silently:', err);
        }
        window.location.href = 'index.html';
    });

    async function loadDashboardData() {
        try {
            const api_key = localStorage.getItem('chilla_api_key');
            if (!api_key) {
                updateDashboardUI(getFallbackData());
                return;
            }
            console.log('Stored API Key:', localStorage.getItem('chilla_api_key'));
            

            const response = await fetch(`https://cook.beaverlyai.com/stats/${api_key}`, {
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to load dashboard data');

            const data = await response.json();
            updateDashboardUI(data);
            checkForNewProfits(data);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            updateDashboardUI(getFallbackData());
        }
    }

    function initializeDashboard(userProfile) {
        // Set up user interface based on plan
        setupUserInterface(userProfile);
        
        // Initialize modals and panels
        initializeModals();
        
        // Set up chart
        const chartElement = document.getElementById('profitChart');
        if (chartElement) {
            const ctx = chartElement.getContext('2d');
            window.profitChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Profit/Loss',
                        data: [],
                        borderColor: '#000000',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            display: true,
                            grid: { display: false }
                        },
                        y: {
                            display: true,
                            grid: { color: '#E5E7EB' },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    function updateDashboardUI(data) {
        document.getElementById('balance').textContent = formatCurrency(data.balance || 0);
        document.getElementById('equity').textContent = formatCurrency(data.equity || 0);
        document.getElementById('win-rate').textContent = formatPercentage(data.win_rate || 0);
        document.getElementById('open-trades').textContent = data.open_trades?.length || 0;

        if (data.profit_history?.length > 0) updateProfitChart(data.profit_history);
        updateTradesTable(data.open_trades || []);
    }

    function updateProfitChart(history) {
        const labels = history.map(i => formatTime(i.timestamp));
        const profits = history.map(i => i.profit);

        window.profitChart.data.labels = labels;
        window.profitChart.data.datasets[0].data = profits;
        window.profitChart.update();
    }

    function updateTradesTable(trades) {
        const tbody = document.getElementById('trades-table');
        
        if (trades.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <svg class="w-8 h-8 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                            <span>No active trades</span>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = trades.map(trade => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${trade.symbol}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${trade.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${trade.type}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${trade.volume}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(trade.entry_price)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(trade.current_price)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${formatCurrency(trade.pnl)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDuration(trade.duration)}</td>
            </tr>
        `).join('');
    }

    function getFallbackData() {
        const start = Date.now() - 6 * 86400000;
        return {
            balance: 10000,
            equity: 10000 + Math.floor(Math.random() * 200 - 100),
            win_rate: parseFloat((Math.random() * 30 + 50).toFixed(1)),
            open_trades: [],
            profit_history: Array.from({ length: 7 }, (_, i) => ({
                timestamp: start + i * 86400000,
                profit: 50 * (i + 1) + Math.random() * 100
            }))
        };
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD'
        }).format(amount);
    }

    function formatPercentage(value) {
        return value.toFixed(1) + '%';
    }

    function formatTime(timestamp) {
        return new Date(timestamp).toLocaleDateString();
    }

    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }


    function updateapiConnectionStatus() {
    const statusText = document.getElementById('api-connection-status-text');
    const statusDot = document.getElementById('api-connection-status-dot');
    const broker = localStorage.getItem('chilla_broker');

    if (!statusText || !statusDot) return;

    if (broker) {
        statusText.textContent = 'Connected';
        statusDot.className = 'w-2 h-2 bg-green-400 rounded-full';
    } else {
        statusText.textContent = 'Not Connected';
        statusDot.className = 'w-2 h-2 bg-gray-400 rounded-full';
    }
}


    function setupUserInterface(userProfile) {
        const userPlan = (userProfile?.plan || "Chilla's Gift").toLowerCase();
        const userEmail = userProfile?.email || localStorage.getItem('chilla_user_email') || '';
        const isGmailUser = userProfile?.auth_provider === 'gmail';
        const isPaidUser = ['level one', 'deep chill', 'peak chill'].includes(userPlan);
        if (!isPaidUser) {
    document.getElementById('connect-chilla-btn')?.classList.add('hidden');
    document.getElementById('api-status-section')?.classList.add('hidden');
}
        console.log('User Plan:', userPlan);
        console.log('Is Paid User:', isPaidUser);
 


        // Update profile panel
        document.getElementById('user-email-display').value = userEmail;
        document.getElementById('current-plan').textContent = userPlan;
        
        // Set plan badge color
        const planBadge = document.getElementById('current-plan');
        if (isPaidUser || !isPaidUser) {
            planBadge.className = 'px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded';
        }

        // Show/hide Connect Chilla button based on plan
        const connectBtn = document.getElementById('connect-chilla-btn');
        if (isPaidUser || !isPaidUser) {
            connectBtn.classList.remove('hidden');
        }


        // Show/hide email verification for manual signups
        const emailVerification = document.getElementById('email-verification');
        const verificationDot = document.getElementById('verification-status-dot');
        const verificationText = document.getElementById('verification-status-text');
        
        if (!isGmailUser && userEmail) {
            emailVerification.classList.remove('hidden');
            if (userProfile?.email_verified) {
                verificationDot.className = 'w-2 h-2 bg-green-400 rounded-full';
                verificationText.textContent = 'Email verified';
            }
        }
       // Show api status section 
       const apiStatusSection = document.getElementById('api-status-section');
       if (isPaidUser) {
           apiStatusSection.classList.remove('hidden');
           updateapiConnectionStatus();
        }
    }

    function initializeModals() {
        // API Connection Modal
        const apiModal = document.getElementById('api-modal');
        const connectChillaBtn = document.getElementById('connect-chilla-btn');
        const closeapiModal = document.getElementById('close-api-modal');
        const cancelapiBtn = document.getElementById('cancel-api-btn');
        const apiForm = document.getElementById('api-connection-form');

        connectChillaBtn?.addEventListener('click', () => {
            apiModal.classList.remove('hidden');
        });

        [closeapiModal, cancelapiBtn].forEach(btn => {
            btn?.addEventListener('click', () => {
                apiModal.classList.add('hidden');
            });
        });

        // Profile Panel
        const profilePanel = document.getElementById('profile-panel');
        const profileBtn = document.getElementById('profile-btn');
        const closeProfilePanel = document.getElementById('close-profile-panel');

        profileBtn?.addEventListener('click', () => {
            profilePanel.classList.remove('hidden');
        });

        closeProfilePanel?.addEventListener('click', () => {
            profilePanel.classList.add('hidden');
        });


        // api Form Submission
        apiForm?.addEventListener('submit', handleapiConnection);

        // Disconnect Chilla
        const disconnectBtn = document.getElementById('disconnect-chilla-btn');
        disconnectBtn?.addEventListener('click', handleDisconnectChilla);

      const verifyEmailBtn = document.getElementById('verify-email-btn');

verifyEmailBtn?.addEventListener('click', async () => {
    const email = localStorage.getItem('chilla_user_email'); // you already store this when they log in
    if (!email) {
        alert("No email found. Please log in again.");
        return;
    }

    try {
        const response = await fetch('https://cook.beaverlyai.com/api/send_verification_email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const result = await response.json();
        if (response.ok) {
            alert("Verification email sent! Check your inbox.");
        } else {
            alert(result.error || "Failed to send verification email.");
        }
    } catch (err) {
        console.error(err);
        alert("An error occurred. Please try again.");
    }
});

    }

   async function handleapiConnection(e) {
    e.preventDefault();
    
    const api_key = document.getElementById('api_key').value.trim();
    const broker = document.getElementById('api-broker').value.trim();
    const wallet_id = document.getElementById('wallet_id').value.trim();

    if (!api_key || !broker) {
        showapiError('Please fill in all fields');
        return;
    }

    setapiLoadingState(true);
    hideapiError();

    try {
        // 🌐 Connect API directly 
        const connectResponse = await fetch('https://cook.beaverlyai.com/api/connect_api', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: api_key,
                broker: broker,
                wallet_id: wallet_id,
            })
        });
        console.log('Stored API key:', localStorage.getItem('chilla_api_key'));

        const connectResult = await connectResponse.json();

        if (!connectResponse.ok) {
            // Show backend error if any (e.g., free user, failed connection, etc.)
            throw new Error(connectResult.error || 'Failed to connect broker account.');
        }

        // 📝 Store api info locally
        localStorage.setItem('chilla_broker', broker);
    
        // ✅ Update UI
        updateapiConnectionStatus();
        document.getElementById('api-modal').classList.add('hidden');

        // 🔄 Refresh dashboard
        loadDashboardData();

    } catch (error) {
        console.error(error);
        showapiError(error.message || 'Connection failed.');
    } finally {
        setapiLoadingState(false);
    }
}


    async function handleDisconnectChilla() {
    const confirmDisconnect = confirm('Are you sure you want to disconnect Chilla? This will stop automated execution.');

    if (!confirmDisconnect) {
        return;
    }

    try {
        const response = await fetch('https://cook.beaverlyai.com/api/disconnect_api', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || result.error || 'Failed to disconnect.');
        }

        // 🔄 Clear local api storage
        localStorage.removeItem('chilla_broker');

        // ✅ Update dashboard UI
        updateapiConnectionStatus();
        document.getElementById('profile-panel')?.classList.add('hidden');

        alert('Chilla disconnected successfully.');

    } catch (error) {
        console.error('Disconnect error:', error);
        alert(error.message || 'Failed to disconnect. Please try again.');
    }
}



    function setapiLoadingState(loading) {
        const btn = document.getElementById('connect-api-btn');
        const text = document.getElementById('connect-api-text');
        const spinner = document.getElementById('connect-api-spinner');

        btn.disabled = loading;
        text.textContent = loading ? 'Connecting...' : 'Connect';
        spinner.classList.toggle('hidden', !loading);
    }

    function showapiError(message) {
        const errorMessage = document.getElementById('api-error-message');
        const errorText = document.getElementById('api-error-text');
        
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    function hideapiError() {
        document.getElementById('api-error-message').classList.add('hidden');
    }


    /**
     * Initialize change email functionality
     */
    function initializeChangeEmailButton() {
        const changeEmailBtn = document.getElementById('change-email-btn');
        if (changeEmailBtn) {
            changeEmailBtn.addEventListener('click', () => {
                window.location.href = 'change-email.html';
            });
        }
    }

    // Add change email button initialization to the existing initialization
    initializeChangeEmailButton();
});

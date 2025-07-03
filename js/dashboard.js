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
            userProfile = data.user || {};
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
            // Get user data first to check if they're paid user
            const userResponse = await fetch('https://cook.beaverlyai.com/api/verify_token', {
                method: 'POST',
                credentials: 'include'
            });

            if (!userResponse.ok) {
                console.error('User verification failed');
                return;
            }

            const userData = await userResponse.json();
            const userProfile = userData.user || {};
            const isPaidUser = ['level one', 'deep chill', 'peak chill'].includes(userProfile.plan_status?.toLowerCase());

            if (!isPaidUser) {
                // For free users, show demo data but no profit nudges
                updateDashboardUI(getFallbackData());
                return;
            }

            // For paid users, fetch real MT5 data
            const mt5Id = userProfile.mt5_id || localStorage.getItem('chilla_mt5_id');
            if (!mt5Id) {
                updateDashboardUI(getFallbackData());
                return;
            }

            // Fetch real MT5 trading data
            const response = await fetch(`https://cook.beaverlyai.com/api/stats/${mt5Id}`, {
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to load dashboard data');

            const data = await response.json();
            
            // Check for new profits and show nudge if applicable
            checkForNewProfits(data);
            
            updateDashboardUI(data);
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

    function setupUserInterface(userProfile) {
        const userPlan = userProfile?.plan || 'Free';
        const userEmail = userProfile?.email || localStorage.getItem('chilla_user_email') || '';
        const isGmailUser = userProfile?.auth_provider === 'gmail';
        const isPaidUser = ['level one', 'deep chill', 'peak chill'].includes(userPlan);
        if (!isPaidUser) {
    document.getElementById('connect-chilla-btn')?.classList.add('hidden');
    document.getElementById('mt5-status-section')?.classList.add('hidden');
}


        // Update profile panel
        document.getElementById('user-email-display').value = userEmail;
        document.getElementById('current-plan').textContent = userPlan;
        
        // Set plan badge color
        const planBadge = document.getElementById('current-plan');
        if (isPaidUser) {
            planBadge.className = 'px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded';
        }

        // Show/hide Connect Chilla button based on plan
        const connectBtn = document.getElementById('connect-chilla-btn');
        if (isPaidUser) {
            connectBtn.classList.remove('hidden');
        }

        // Show/hide upgrade nudge for Free users
        const upgradeNudge = document.getElementById('upgrade-nudge');
        if (userPlan === 'Free') {
            upgradeNudge.classList.remove('hidden');
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

        // Show MT5 status section for paid users
        const mt5StatusSection = document.getElementById('mt5-status-section');
        if (isPaidUser) {
            mt5StatusSection.classList.remove('hidden');
            updateMT5ConnectionStatus();
        }
    }

    function initializeModals() {
        // MT5 Connection Modal
        const mt5Modal = document.getElementById('mt5-modal');
        const connectChillaBtn = document.getElementById('connect-chilla-btn');
        const closeMT5Modal = document.getElementById('close-mt5-modal');
        const cancelMT5Btn = document.getElementById('cancel-mt5-btn');
        const mt5Form = document.getElementById('mt5-connection-form');

        connectChillaBtn?.addEventListener('click', () => {
            mt5Modal.classList.remove('hidden');
        });

        [closeMT5Modal, cancelMT5Btn].forEach(btn => {
            btn?.addEventListener('click', () => {
                mt5Modal.classList.add('hidden');
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

        // Close nudge
        const closeNudge = document.getElementById('close-nudge');
        closeNudge?.addEventListener('click', () => {
            document.getElementById('upgrade-nudge').classList.add('hidden');
        });

        // MT5 Form Submission
        mt5Form?.addEventListener('submit', handleMT5Connection);

        // Disconnect Chilla
        const disconnectBtn = document.getElementById('disconnect-chilla-btn');
        disconnectBtn?.addEventListener('click', handleDisconnectChilla);

        // Email verification
        const verifyEmailBtn = document.getElementById('verify-email-btn');
        verifyEmailBtn?.addEventListener('click', () => {
            alert('Email verification will be implemented soon.');
        });
    }

    async function handleMT5Connection(e) {
        e.preventDefault();
        
        const mt5Id = document.getElementById('mt5-id').value.trim();
        const mt5Password = document.getElementById('mt5-password').value.trim();
        const broker = document.getElementById('mt5-broker').value.trim();
        const server = document.getElementById('mt5-server').value.trim();

        if (!mt5Id || !mt5Password || !broker || !server) {
            showMT5Error('Please fill in all fields');
            return;
        }

        setMT5LoadingState(true);
        hideMT5Error();

        try {
            // Check license status
            const licenseResponse = await fetch(`https://cook.beaverlyai.com/api/license_status?mt5_id=${mt5Id}`);
            if (!licenseResponse.ok) {
                throw new Error('MT5 account not licensed.');
            }

            const licenseData = await licenseResponse.json();

            // Connect MT5
            const connectResponse = await fetch('https://cook.beaverlyai.com/api/connect_mt5', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
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

            // Store MT5 info locally
            localStorage.setItem('chilla_license_data', JSON.stringify(licenseData));
            localStorage.setItem('chilla_mt5_id', mt5Id);
            localStorage.setItem('chilla_broker', broker);
            localStorage.setItem('chilla_server', server);

            // Update UI
            updateMT5ConnectionStatus();
            updateVPSStatus(true);
            document.getElementById('mt5-modal').classList.add('hidden');
            
            // Refresh dashboard data
            loadDashboardData();

        } catch (error) {
            console.error(error);
            showMT5Error(error.message || 'Connection failed.');
        } finally {
            setMT5LoadingState(false);
        }
    }

    async function handleDisconnectChilla() {
        if (!confirm('Are you sure you want to disconnect Chilla? This will stop automated execution.')) {
            return;
        }

        try {
            const response = await fetch('https://cook.beaverlyai.com/api/disconnect_mt5', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                // Clear local MT5 data
                localStorage.removeItem('chilla_mt5_id');
                localStorage.removeItem('chilla_broker');
                localStorage.removeItem('chilla_server');
                localStorage.removeItem('chilla_license_data');

                // Update UI
                updateMT5ConnectionStatus();
                updateVPSStatus(false);
                document.getElementById('profile-panel').classList.add('hidden');
            } else {
                throw new Error('Failed to disconnect');
            }
        } catch (error) {
            console.error('Disconnect error:', error);
            alert('Failed to disconnect. Please try again.');
        }
    }

    function updateMT5ConnectionStatus() {
        const mt5Id = localStorage.getItem('chilla_mt5_id');
        const broker = localStorage.getItem('chilla_broker');
        const connectedInfo = document.getElementById('mt5-connected-info');
        const notConnected = document.getElementById('mt5-not-connected');

        if (mt5Id && broker) {
            document.getElementById('connected-mt5-id').textContent = mt5Id;
            document.getElementById('connected-broker').textContent = broker;
            connectedInfo.classList.remove('hidden');
            notConnected.classList.add('hidden');
        } else {
            connectedInfo.classList.add('hidden');
            notConnected.classList.remove('hidden');
        }
    }

    function updateVPSStatus(connected) {
        const statusDot = document.getElementById('vps-status-dot');
        const statusText = document.getElementById('vps-status-text');

        if (connected) {
            statusDot.className = 'w-2 h-2 bg-green-400 rounded-full';
            statusText.textContent = 'Chilla Connected';
        } else {
            statusDot.className = 'w-2 h-2 bg-gray-400 rounded-full';
            statusText.textContent = 'Chilla Disconnected';
        }
    }

    function setMT5LoadingState(loading) {
        const btn = document.getElementById('connect-mt5-btn');
        const text = document.getElementById('connect-mt5-text');
        const spinner = document.getElementById('connect-mt5-spinner');

        btn.disabled = loading;
        text.textContent = loading ? 'Connecting...' : 'Connect';
        spinner.classList.toggle('hidden', !loading);
    }

    function showMT5Error(message) {
        const errorMessage = document.getElementById('mt5-error-message');
        const errorText = document.getElementById('mt5-error-text');
        
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    function hideMT5Error() {
        document.getElementById('mt5-error-message').classList.add('hidden');
    }

    /**
     * Check for new profits and show personalized nudge
     */
    function checkForNewProfits(data) {
        const currentProfit = data.total_profit || data.balance || 0;
        const lastProfit = parseFloat(localStorage.getItem('last_profit') || '0');
        
        // Only show nudge if profit actually increased
        if (currentProfit > lastProfit && currentProfit > 0) {
            const profitIncrease = currentProfit - lastProfit;
            showProfitNudge(profitIncrease);
            localStorage.setItem('last_profit', currentProfit.toString());
        } else {
            // Update stored profit without showing nudge
            localStorage.setItem('last_profit', currentProfit.toString());
        }
    }

    /**
     * Show profit nudge with actual profit change
     */
    function showProfitNudge(profitIncrease) {
        const upgradeNudge = document.getElementById('upgrade-nudge');
        const nudgeText = upgradeNudge.querySelector('p');
        
        if (upgradeNudge && nudgeText) {
            nudgeText.innerHTML = `You just gained ${formatCurrency(profitIncrease)} today 📈`;
            upgradeNudge.classList.remove('hidden');
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                upgradeNudge.classList.add('hidden');
            }, 10000);
        }
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

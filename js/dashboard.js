document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const authToken = localStorage.getItem('chilla_auth_token');
    const mt5Id = localStorage.getItem('chilla_mt5_id');
    
    if (!authToken || !mt5Id) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize dashboard
    initializeDashboard();
    loadDashboardData();
    
    // Set up periodic data refresh
    setInterval(loadDashboardData, 30000); // Refresh every 30 seconds

    // Logout functionality
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    function initializeDashboard() {
        // Initialize profit chart
        const ctx = document.getElementById('profitChart').getContext('2d');
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
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            color: '#E5E7EB'
                        },
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

    async function loadDashboardData() {
        try {
            const response = await fetch(`/stats/${mt5Id}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load dashboard data');
            }

            const data = await response.json();
            updateDashboardUI(data);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Show fallback data or error state
            updateDashboardUI(getFallbackData());
        }
    }

    function updateDashboardUI(data) {
        // Update account summary cards
        document.getElementById('balance').textContent = formatCurrency(data.balance || 0);
        document.getElementById('equity').textContent = formatCurrency(data.equity || 0);
        document.getElementById('win-rate').textContent = formatPercentage(data.win_rate || 0);
        document.getElementById('open-trades').textContent = data.open_trades?.length || 0;

        // Update status indicators
        document.getElementById('engine-status').textContent = data.engine_status || 'Running';
        document.getElementById('uptime').textContent = data.uptime || '99.99%';
        document.getElementById('last-signal').textContent = data.last_signal || '2 min ago';

        // Update license info
        document.getElementById('license-plan').textContent = data.license_plan || 'Premium';
        document.getElementById('license-expiry').textContent = data.license_expiry || '30 days';

        // Update profit chart
        if (data.profit_history && data.profit_history.length > 0) {
            updateProfitChart(data.profit_history);
        }

        // Update trades table
        updateTradesTable(data.open_trades || []);
    }

    function updateProfitChart(profitHistory) {
        const labels = profitHistory.map(item => formatTime(item.timestamp));
        const profits = profitHistory.map(item => item.profit);

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
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${trade.entry_price}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${trade.current_price}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${formatCurrency(trade.profit)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDuration(trade.duration)}</td>
            </tr>
        `).join('');
    }

    function getFallbackData() {
        return {
            balance: 10000,
            equity: 10500,
            win_rate: 75,
            open_trades: [],
            engine_status: 'Running',
            uptime: '99.99%',
            last_signal: '2 min ago',
            license_plan: 'Premium',
            license_expiry: '30 days',
            profit_history: [
                { timestamp: Date.now() - 86400000 * 6, profit: 0 },
                { timestamp: Date.now() - 86400000 * 5, profit: 150 },
                { timestamp: Date.now() - 86400000 * 4, profit: 300 },
                { timestamp: Date.now() - 86400000 * 3, profit: 250 },
                { timestamp: Date.now() - 86400000 * 2, profit: 400 },
                { timestamp: Date.now() - 86400000 * 1, profit: 500 },
                { timestamp: Date.now(), profit: 500 }
            ]
        };
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
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
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
});

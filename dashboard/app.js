// Meta Ads Dashboard - Main Application
let currentData = null;
let charts = {};

// Argentina Ecommerce Benchmarks (2026)
const BENCHMARKS = {
    ctr: 2.1, // % - Ecommerce average for Argentina/LATAM
    cpc: 0.23, // USD - Argentina average
    cpm: 4.50, // USD - Adjusted for Argentina market
    conversionRate: 2.0, // % - Ecommerce average
    addToCartRate: 7.0, // % of clicks
    checkoutRate: 45.0, // % of add to carts
    purchaseRate: 50.0 // % of checkouts
};

// Format helpers
const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
};

const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(num);
};

const formatPercent = (num) => {
    return num.toFixed(2) + '%';
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Load metrics data
async function loadMetrics(period = '30d') {
    try {
        const fileMap = {
            '7d': 'data/metrics_7d.json',
            '30d': 'data/metrics.json',
            '90d': 'data/metrics_90d.json'
        };

        const response = await fetch(fileMap[period] || fileMap['30d']);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        currentData = await response.json();
        updateDashboard();
    } catch (error) {
        console.error('Error loading metrics:', error);
        showError('Failed to load metrics data. Using demo data.');

        // Fallback to demo data if file doesn't exist
        currentData = {
            generated_at: new Date().toISOString(),
            date_range: { since: '2026-02-02', until: '2026-03-04' },
            aggregated: {
                impressions: 0,
                clicks: 0,
                spend: 0,
                cpc: 0,
                cpm: 0,
                ctr: 0,
                conversions: 0,
                cost_per_conversion: 0,
                conversion_rate: 0
            },
            time_series: [],
            campaigns: [],
            demographics: { countries: [], devices: [] }
        };
        updateDashboard();
    }
}

// Update all dashboard elements
function updateDashboard() {
    if (!currentData) return;

    updateDateRange();
    updateMetrics();
    updateCharts();
    updateTables();
    updateLastUpdated();
}

// Update date range display
function updateDateRange() {
    const { since, until } = currentData.date_range;
    const display = `Data from ${formatDate(since)} to ${formatDate(until)}`;
    document.getElementById('dateRangeDisplay').textContent = display;
}

// Update metric cards
function updateMetrics() {
    const m = currentData.aggregated;

    document.getElementById('metric-impressions').textContent = formatNumber(m.impressions);
    document.getElementById('metric-clicks').textContent = formatNumber(m.clicks);
    document.getElementById('metric-ctr').textContent = formatPercent(m.ctr);
    document.getElementById('metric-purchases').textContent = formatNumber(m.purchases || 0);
    document.getElementById('metric-spend').textContent = formatCurrency(m.spend);
    document.getElementById('metric-cpc').textContent = formatCurrency(m.cpc);
    document.getElementById('metric-cpm').textContent = formatCurrency(m.cpm);
    document.getElementById('metric-cost-per-conversion').textContent = formatCurrency(m.cost_per_purchase || m.cost_per_conversion || 0);
    document.getElementById('metric-conversion-rate').textContent = formatPercent(m.conversion_rate);

    // Add benchmark comparisons
    updateBenchmarkComparison('ctr', m.ctr, BENCHMARKS.ctr, '%', true);
    updateBenchmarkComparison('cpc', m.cpc, BENCHMARKS.cpc, '$', false);
    updateBenchmarkComparison('cpm', m.cpm, BENCHMARKS.cpm, '$', false);
    updateBenchmarkComparison('conversion-rate', m.conversion_rate, BENCHMARKS.conversionRate, '%', true);
}

// Update benchmark comparison display
function updateBenchmarkComparison(metricId, actual, benchmark, unit, higherIsBetter) {
    const element = document.getElementById(`benchmark-${metricId}`);
    if (!element) return;

    const diff = actual - benchmark;
    const diffPercent = ((diff / benchmark) * 100).toFixed(1);
    const isGood = higherIsBetter ? diff > 0 : diff < 0;

    const color = isGood ? 'text-green-600' : 'text-red-600';
    const arrow = isGood ? '↑' : '↓';
    const prefix = diff > 0 ? '+' : '';

    const benchmarkText = unit === '$' ? formatCurrency(benchmark) : `${benchmark}%`;
    element.className = `text-xs ${color} mt-1 font-medium`;
    element.textContent = `${arrow} ${prefix}${Math.abs(diffPercent)}% vs benchmark (${benchmarkText})`;
}

// Update all charts
function updateCharts() {
    updateSpendChart();
    updateFunnelVisualization();
}

// Spend Over Time Chart
function updateSpendChart() {
    const ctx = document.getElementById('spendChart');
    if (!ctx) return;

    if (charts.spend) {
        charts.spend.destroy();
    }

    const data = currentData.time_series;

    charts.spend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => formatDate(d.date)),
            datasets: [{
                label: 'Spend',
                data: data.map(d => d.spend),
                borderColor: '#DC2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => 'Spend: ' + formatCurrency(context.parsed.y)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    },
                    grid: {
                        color: '#e5e5e5'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Visual Funnel with Benchmarks
function updateFunnelVisualization() {
    const container = document.getElementById('funnelVisualization');
    if (!container) return;

    const funnel = currentData.funnel;
    if (!funnel || !funnel.steps) return;

    const steps = funnel.steps;
    const clicks = steps[0].value;

    // Calculate actual rates
    const actualRates = {
        addToCart: (steps[1].value / clicks) * 100,
        checkout: (steps[2].value / steps[1].value) * 100,
        purchase: (steps[4].value / steps[2].value) * 100
    };

    const funnelHTML = `
        <div class="space-y-6">
            ${steps.map((step, index) => {
                const prevValue = index > 0 ? steps[index - 1].value : clicks;
                const dropoff = index > 0 ? prevValue - step.value : 0;
                const dropoffPercent = index > 0 ? ((dropoff / prevValue) * 100).toFixed(1) : 0;
                const retentionPercent = index > 0 ? ((step.value / prevValue) * 100).toFixed(1) : 100;

                // Get benchmark for this step
                let benchmark = null;
                let benchmarkLabel = '';
                if (index === 1) { // Add to Cart
                    benchmark = BENCHMARKS.addToCartRate;
                    benchmarkLabel = 'de clicks';
                } else if (index === 2) { // Checkout
                    benchmark = BENCHMARKS.checkoutRate;
                    benchmarkLabel = 'de carritos';
                } else if (index === 4) { // Purchase
                    benchmark = BENCHMARKS.purchaseRate;
                    benchmarkLabel = 'de checkouts';
                }

                const actualRate = index > 0 ? parseFloat(retentionPercent) : 100;
                const comparison = benchmark ?
                    (actualRate > benchmark ?
                        `<span class="text-green-600">↑ ${(actualRate - benchmark).toFixed(1)}% vs benchmark (${benchmark}%)</span>` :
                        `<span class="text-red-600">↓ ${(benchmark - actualRate).toFixed(1)}% vs benchmark (${benchmark}%)</span>`) :
                    '';

                const width = ((step.value / clicks) * 100).toFixed(1);

                return `
                    <div class="relative">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex-1">
                                <div class="flex items-center gap-3">
                                    <span class="text-lg font-bold">${step.name}</span>
                                    ${index > 0 ? `<span class="text-sm text-gray-500">(${retentionPercent}% ${benchmarkLabel})</span>` : ''}
                                </div>
                                ${comparison ? `<div class="text-xs mt-1">${comparison}</div>` : ''}
                            </div>
                            <div class="text-right">
                                <div class="text-2xl font-bold">${formatNumber(step.value)}</div>
                                <div class="text-xs text-gray-500">${step.percentage.toFixed(2)}% de clicks totales</div>
                            </div>
                        </div>

                        <div class="relative h-12 bg-gray-100 rounded overflow-hidden">
                            <div class="absolute inset-y-0 left-0 bg-gradient-to-r ${getGradientColor(index)}"
                                 style="width: ${width}%">
                            </div>
                        </div>

                        ${index > 0 && index < steps.length ? `
                            <div class="flex items-center gap-2 mt-2 text-sm text-red-600">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                </svg>
                                <span>Pérdida: ${formatNumber(dropoff)} usuarios (${dropoffPercent}%)</span>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;

    container.innerHTML = funnelHTML;
}

function getGradientColor(index) {
    const colors = [
        'from-blue-400 to-blue-600',    // Clicks
        'from-red-400 to-red-600',      // Add to Cart
        'from-yellow-400 to-yellow-600', // Checkout
        'from-purple-400 to-purple-600', // Payment Info
        'from-green-400 to-green-600'    // Purchase
    ];
    return colors[index] || 'from-gray-400 to-gray-600';
}

// Update last updated timestamp
function updateLastUpdated() {
    const timestamp = new Date(currentData.generated_at);
    document.getElementById('lastUpdated').textContent = timestamp.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show error message
function showError(message) {
    const dataSource = document.getElementById('dataSource');
    dataSource.className = 'flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200';
    dataSource.querySelector('span').textContent = message;
}

// Event listeners
document.getElementById('datePreset').addEventListener('change', (e) => {
    loadMetrics(e.target.value);
});

document.getElementById('refreshBtn').addEventListener('click', () => {
    const btn = document.getElementById('refreshBtn');
    const svg = btn.querySelector('svg');
    svg.classList.add('animate-spin');

    const currentPeriod = document.getElementById('datePreset').value;
    loadMetrics(currentPeriod).finally(() => {
        setTimeout(() => {
            svg.classList.remove('animate-spin');
        }, 500);
    });
});

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadMetrics('30d');
});

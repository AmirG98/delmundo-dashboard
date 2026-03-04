// Meta Ads Dashboard - Main Application
let currentData = null;
let charts = {};

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
}

// Update all charts
function updateCharts() {
    updateSpendChart();
    updateDeviceChart();
    updatePerformanceChart();
    updateFunnelChart();
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

// Device Distribution Chart
function updateDeviceChart() {
    const ctx = document.getElementById('deviceChart');
    if (!ctx) return;

    if (charts.device) {
        charts.device.destroy();
    }

    const devices = currentData.demographics?.devices || [];

    const deviceColors = {
        mobile: '#1877F2',
        desktop: '#DC2626',
        tablet: '#9333EA'
    };

    charts.device = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: devices.map(d => d.device.charAt(0).toUpperCase() + d.device.slice(1)),
            datasets: [{
                data: devices.map(d => d.spend),
                backgroundColor: devices.map(d => deviceColors[d.device] || '#888888'),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Performance Metrics Chart
function updatePerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    if (charts.performance) {
        charts.performance.destroy();
    }

    const data = currentData.time_series;

    charts.performance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => formatDate(d.date)),
            datasets: [
                {
                    label: 'Clicks',
                    data: data.map(d => d.clicks),
                    borderColor: '#DC2626',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'Purchases',
                    data: data.map(d => d.purchases || d.conversions || 0),
                    borderColor: '#000000',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'Impressions',
                    data: data.map(d => d.impressions),
                    borderColor: '#4285F4',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 2,
                    borderDash: [5, 5],
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 11
                        },
                        usePointStyle: true
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Clicks / Purchases'
                    },
                    grid: {
                        color: '#e5e5e5'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Impressions'
                    },
                    grid: {
                        drawOnChartArea: false,
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

// Funnel Chart
function updateFunnelChart() {
    const ctx = document.getElementById('funnelChart');
    if (!ctx) return;

    if (charts.funnel) {
        charts.funnel.destroy();
    }

    const funnel = currentData.funnel;
    if (!funnel || !funnel.steps) return;

    const steps = funnel.steps;

    charts.funnel = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: steps.map(s => s.name),
            datasets: [{
                label: 'Count',
                data: steps.map(s => s.value),
                backgroundColor: [
                    '#4285F4',
                    '#DC2626',
                    '#F59E0B',
                    '#9333EA',
                    '#10B981'
                ],
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = formatNumber(context.parsed.x);
                            const step = steps[context.dataIndex];
                            return `${value} (${step.percentage.toFixed(2)}% of clicks)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: '#e5e5e5'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Update tables
function updateTables() {
    updateAdsTable();
}

// Update ads table
function updateAdsTable() {
    const tbody = document.getElementById('adsTable');
    const ads = currentData.ads || currentData.campaigns || [];

    if (ads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">No ads available</td></tr>';
        return;
    }

    tbody.innerHTML = ads.map(ad => `
        <tr class="border-b border-gray-200 hover:bg-gray-50">
            <td class="py-3 font-medium max-w-xs truncate" title="${ad.ad_name || ad.name}">
                ${ad.ad_name || ad.name}
            </td>
            <td class="py-3 text-sm text-gray-600 max-w-xs truncate" title="${ad.campaign_name || ''}">
                ${ad.campaign_name || ''}
            </td>
            <td class="text-right py-3 font-mono">${formatNumber(ad.impressions)}</td>
            <td class="text-right py-3 font-mono">${formatNumber(ad.clicks)}</td>
            <td class="text-right py-3 font-mono">${formatCurrency(ad.spend)}</td>
            <td class="text-right py-3 font-mono">${formatPercent(ad.ctr)}</td>
            <td class="text-right py-3 font-mono">${formatNumber(ad.purchases || ad.conversions || 0)}</td>
            <td class="text-right py-3 font-mono">${formatPercent(ad.conversion_rate)}</td>
        </tr>
    `).join('');
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

// Connect to WebSocket
const socket = io();

let config = null;
let refreshInterval = 20;

// Format functions
function formatUSD(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function formatNumber(value, decimals = 3) {
    return value.toFixed(decimals);
}

function formatAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
}

// Update UI elements
function updateConnectionStatus(connected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    if (connected) {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
    } else {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Disconnected';
    }
}

function updateHealthFactorBar(data) {
    const { current, target, tolerance, lowerBound, upperBound } = data.healthFactor;
    
    // Update text values
    document.getElementById('currentHF').textContent = formatNumber(current);
    document.getElementById('targetHF').textContent = formatNumber(target, 2);
    document.getElementById('hfRange').textContent = `[${formatNumber(lowerBound, 2)} - ${formatNumber(upperBound, 2)}]`;
    
    // Calculate positions for the bar (scale 1.0 to 2.0)
    const min = 1.0;
    const max = 2.0;
    const range = max - min;
    
    const currentPos = ((current - min) / range) * 100;
    const targetPos = ((target - min) / range) * 100;
    const lowerPos = ((lowerBound - min) / range) * 100;
    const upperPos = ((upperBound - min) / range) * 100;
    
    // Update bar elements
    const rangeBar = document.getElementById('hfRangeBar');
    rangeBar.style.left = `${lowerPos}%`;
    rangeBar.style.width = `${upperPos - lowerPos}%`;
    
    const targetLine = document.getElementById('hfTargetLine');
    targetLine.style.left = `${targetPos}%`;
    
    const currentMarker = document.getElementById('hfCurrentMarker');
    currentMarker.style.left = `${currentPos}%`;
    
    // Update marker color based on status
    currentMarker.classList.remove('warning', 'danger');
    if (current < lowerBound) {
        currentMarker.classList.add('danger');
    } else if (current > upperBound) {
        currentMarker.classList.add('warning');
    }
}

function updateActionIndicator(status) {
    const indicator = document.getElementById('actionIndicator');
    const icon = indicator.querySelector('.action-icon');
    const text = indicator.querySelector('.action-text');
    
    indicator.classList.remove('in-range', 'lever-up', 'lever-down');
    
    switch(status.action) {
        case 'IN_RANGE':
            indicator.classList.add('in-range');
            icon.textContent = '✅';
            text.textContent = 'IN RANGE (no action needed)';
            break;
        case 'LEVER_UP':
            indicator.classList.add('lever-up');
            icon.textContent = '⬆️';
            text.textContent = 'LEVER UP (borrow more)';
            break;
        case 'LEVER_DOWN':
            indicator.classList.add('lever-down');
            icon.textContent = '⬇️';
            text.textContent = 'LEVER DOWN (reduce debt)';
            break;
    }
}

function updatePositionMetrics(position) {
    document.getElementById('collateral').textContent = formatUSD(position.collateral);
    document.getElementById('debt').textContent = formatUSD(position.debt);
    document.getElementById('netValue').textContent = formatUSD(position.netValue);
    document.getElementById('availableBorrow').textContent = formatUSD(position.availableBorrows);
}

function updateLeverage(leverage) {
    document.getElementById('leverageValue').textContent = `${formatNumber(leverage.current, 2)}x`;
    
    const leverageBar = document.getElementById('leverageBar');
    const maxLeverage = 4.0;
    const width = Math.min((leverage.current / maxLeverage) * 100, 100);
    leverageBar.style.width = `${width}%`;
    
    document.getElementById('utilization').textContent = `${formatNumber(leverage.utilization, 1)}% utilization`;
}

function updateStatus(status) {
    const riskBadge = document.getElementById('riskStatus').querySelector('.status-badge') || 
                      document.createElement('span');
    riskBadge.className = 'status-badge';
    
    switch(status.riskLevel) {
        case 'LOW':
            riskBadge.classList.add('low-risk');
            riskBadge.textContent = '🟢 LOW RISK';
            break;
        case 'MEDIUM':
            riskBadge.classList.add('medium-risk');
            riskBadge.textContent = '🟡 MEDIUM RISK';
            break;
        case 'HIGH':
            riskBadge.classList.add('high-risk');
            riskBadge.textContent = '🔴 HIGH RISK';
            break;
    }
    document.getElementById('riskStatus').innerHTML = '';
    document.getElementById('riskStatus').appendChild(riskBadge);
    
    const balanceBadge = document.getElementById('balanceStatus').querySelector('.status-badge') || 
                         document.createElement('span');
    balanceBadge.className = 'status-badge';
    
    if (status.needsRebalance) {
        balanceBadge.classList.add('medium-risk');
        balanceBadge.textContent = '🔄 REBALANCE NEEDED';
    } else {
        balanceBadge.classList.add('low-risk');
        balanceBadge.textContent = '✅ BALANCED';
    }
    document.getElementById('balanceStatus').innerHTML = '';
    document.getElementById('balanceStatus').appendChild(balanceBadge);
    
    // Liquidation warning
    const liquidationWarning = document.getElementById('liquidationWarning');
    if (status.nearLiquidation) {
        liquidationWarning.style.display = 'block';
    } else {
        liquidationWarning.style.display = 'none';
    }
}

function updateRefreshProgress() {
    const progress = document.getElementById('refreshProgress');
    progress.style.transition = 'none';
    progress.style.width = '0%';
    
    setTimeout(() => {
        progress.style.transition = `width ${refreshInterval}s linear`;
        progress.style.width = '100%';
    }, 100);
}

// Handle position updates
function handlePositionUpdate(data) {
    if (!data) return;
    
    // Update contract info
    document.getElementById('contractAddress').textContent = formatAddress(data.contract);
    document.getElementById('lastUpdate').textContent = formatTime(data.timestamp);
    
    // Update all sections
    updateHealthFactorBar(data);
    updateActionIndicator(data.status);
    updatePositionMetrics(data.position);
    updateLeverage(data.leverage);
    updateStatus(data.status);
    
    // Reset refresh progress
    updateRefreshProgress();
}

// Socket event handlers
socket.on('connect', () => {
    console.log('Connected to server');
    updateConnectionStatus(true);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateConnectionStatus(false);
});

socket.on('positionUpdate', (data) => {
    console.log('Position update received:', data);
    handlePositionUpdate(data);
});

// Fetch initial config
fetch('/api/config')
    .then(res => res.json())
    .then(data => {
        config = data;
        refreshInterval = data.refreshInterval;
        document.getElementById('refreshInterval').textContent = refreshInterval;
        updateRefreshProgress();
    })
    .catch(err => console.error('Failed to fetch config:', err));
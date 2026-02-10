export function formatCurrency(value, compact = false) {
  if (value == null || isNaN(value)) return '$0';

  if (compact && Math.abs(value) >= 1000000) {
    return '$' + (value / 1000000).toFixed(1) + 'M';
  }
  if (compact && Math.abs(value) >= 1000) {
    return '$' + (value / 1000).toFixed(0) + 'K';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value, decimals = 1) {
  if (value == null || isNaN(value)) return '0%';
  return value.toFixed(decimals) + '%';
}

export function formatNumber(value) {
  if (value == null || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function getSuccessColor(rate) {
  if (rate >= 90) return '#10b981'; // green
  if (rate >= 75) return '#f59e0b'; // amber
  if (rate >= 50) return '#f97316'; // orange
  return '#ef4444'; // red
}

export function getSuccessLabel(rate) {
  if (rate >= 95) return 'Excellent';
  if (rate >= 85) return 'Strong';
  if (rate >= 75) return 'Good';
  if (rate >= 60) return 'Fair';
  if (rate >= 40) return 'Risky';
  return 'Critical';
}

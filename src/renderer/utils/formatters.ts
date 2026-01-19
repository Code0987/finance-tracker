import { format, parseISO, isValid } from 'date-fns';

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const formatDate = (dateStr: string, formatStr: string = 'dd MMM yyyy'): string => {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, formatStr);
  } catch {
    return dateStr;
  }
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

export const formatCompactNumber = (num: number): string => {
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(1)}Cr`;
  } else if (num >= 100000) {
    return `${(num / 100000).toFixed(1)}L`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return formatNumber(num);
};

export const getRelativeDate = (dateStr: string): string => {
  const date = parseISO(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

export const getMonthName = (monthStr: string): string => {
  // Convert YYYY-MM to month name
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return format(date, 'MMM yyyy');
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

export const getTransactionType = (type: 'credit' | 'debit'): {
  label: string;
  color: string;
  bgColor: string;
} => {
  if (type === 'credit') {
    return {
      label: 'Credit',
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    };
  }
  return {
    label: 'Debit',
    color: 'text-danger-500',
    bgColor: 'bg-danger-50',
  };
};

export const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'Food & Dining': '🍔',
    'Groceries': '🛒',
    'Shopping': '🛍️',
    'Transportation': '🚗',
    'Rent': '🏠',
    'Utilities': '💡',
    'Entertainment': '🎬',
    'Healthcare': '🏥',
    'Education': '📚',
    'Insurance': '🛡️',
    'Investments': '📈',
    'Salary': '💰',
    'Interest Credit': '🏦',
    'Refund': '↩️',
    'Transfer': '↔️',
    'ATM Withdrawal': '🏧',
    'EMI': '📅',
    'Credit Card Payment': '💳',
    'Travel': '✈️',
    'Subscriptions': '📱',
    'Personal Care': '💇',
    'Donations': '🎁',
    'Taxes': '📋',
    'Other': '📝',
  };
  return icons[category] || '📝';
};

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Food & Dining': '#ef4444',
    'Groceries': '#22c55e',
    'Shopping': '#8b5cf6',
    'Transportation': '#3b82f6',
    'Rent': '#f59e0b',
    'Utilities': '#06b6d4',
    'Entertainment': '#ec4899',
    'Healthcare': '#14b8a6',
    'Education': '#6366f1',
    'Insurance': '#84cc16',
    'Investments': '#10b981',
    'Salary': '#22c55e',
    'Interest Credit': '#0ea5e9',
    'Refund': '#a855f7',
    'Transfer': '#64748b',
    'ATM Withdrawal': '#78716c',
    'EMI': '#f97316',
    'Credit Card Payment': '#0891b2',
    'Travel': '#7c3aed',
    'Subscriptions': '#d946ef',
    'Personal Care': '#f472b6',
    'Donations': '#fb923c',
    'Taxes': '#4b5563',
    'Other': '#94a3b8',
  };
  return colors[category] || '#94a3b8';
};

export const getAccountTypeLabel = (type: 'bank' | 'credit_card'): string => {
  return type === 'bank' ? 'Bank Account' : 'Credit Card';
};

export const getBankColor = (bankName: string): string => {
  const colors: Record<string, string> = {
    'sbi': '#3b5998',
    'hdfc': '#004b8d',
    'icici': '#f37920',
    'axis': '#800000',
    'kotak': '#ed1c24',
    'pnb': '#1e4096',
    'bob': '#f36f21',
    'canara': '#ffd100',
    'idfc': '#9c1d26',
    'yes': '#0069aa',
  };
  const key = bankName.toLowerCase();
  for (const [bank, color] of Object.entries(colors)) {
    if (key.includes(bank)) return color;
  }
  return '#3b82f6';
};

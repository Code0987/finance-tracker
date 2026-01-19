// Mock API for development without Electron
// This provides sample data for testing the UI

import { v4 as uuidv4 } from 'uuid';

const mockAccounts = [
  {
    id: uuidv4(),
    name: 'Salary Account',
    bankName: 'HDFC Bank',
    accountNumber: 'XXXX1234',
    type: 'bank' as const,
    currency: 'INR',
    color: '#004b8d',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Savings Account',
    bankName: 'SBI',
    accountNumber: 'XXXX5678',
    type: 'bank' as const,
    currency: 'INR',
    color: '#3b5998',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Premium Card',
    bankName: 'ICICI Bank',
    accountNumber: 'XXXX9012',
    type: 'credit_card' as const,
    currency: 'INR',
    color: '#f37920',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const categories = [
  'Food & Dining', 'Shopping', 'Transportation', 'Utilities', 
  'Entertainment', 'Healthcare', 'Groceries', 'Rent',
  'Salary', 'Interest Credit', 'Investments', 'Other'
];

const generateTransactions = () => {
  const transactions = [];
  const now = new Date();
  
  for (let i = 0; i < 100; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    const isCredit = Math.random() > 0.7;
    const account = mockAccounts[Math.floor(Math.random() * mockAccounts.length)];
    
    transactions.push({
      id: uuidv4(),
      accountId: account.id,
      accountName: account.name,
      bankName: account.bankName,
      accountType: account.type,
      date: date.toISOString().split('T')[0],
      description: isCredit 
        ? ['Salary Credit', 'Refund', 'Interest Credit', 'UPI/Cash Deposit'][Math.floor(Math.random() * 4)]
        : ['Swiggy', 'Amazon', 'Uber', 'Netflix', 'Electricity Bill', 'Rent Payment', 'ATM Withdrawal'][Math.floor(Math.random() * 7)],
      remarks: '',
      amount: Math.floor(Math.random() * (isCredit ? 50000 : 5000)) + 100,
      type: isCredit ? 'credit' as const : 'debit' as const,
      category: isCredit 
        ? ['Salary', 'Interest Credit', 'Refund'][Math.floor(Math.random() * 3)]
        : categories[Math.floor(Math.random() * (categories.length - 3))],
      subcategory: '',
      merchant: '',
      balance: Math.floor(Math.random() * 100000) + 10000,
      reference: `REF${Math.floor(Math.random() * 1000000)}`,
      mode: ['UPI', 'NEFT', 'Card', 'ATM'][Math.floor(Math.random() * 4)],
      isRecurring: Math.random() > 0.9,
      tags: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const mockTransactions = generateTransactions();

const mockCategories = [
  { id: uuidv4(), name: 'Food & Dining', icon: '🍔', color: '#ef4444', keywords: 'swiggy,zomato,restaurant', parentId: null, type: 'expense' as const },
  { id: uuidv4(), name: 'Shopping', icon: '🛍️', color: '#8b5cf6', keywords: 'amazon,flipkart,myntra', parentId: null, type: 'expense' as const },
  { id: uuidv4(), name: 'Transportation', icon: '🚗', color: '#3b82f6', keywords: 'uber,ola,petrol', parentId: null, type: 'expense' as const },
  { id: uuidv4(), name: 'Utilities', icon: '💡', color: '#06b6d4', keywords: 'electricity,water,gas', parentId: null, type: 'expense' as const },
  { id: uuidv4(), name: 'Entertainment', icon: '🎬', color: '#ec4899', keywords: 'netflix,spotify,movie', parentId: null, type: 'expense' as const },
  { id: uuidv4(), name: 'Healthcare', icon: '🏥', color: '#14b8a6', keywords: 'hospital,pharmacy', parentId: null, type: 'expense' as const },
  { id: uuidv4(), name: 'Groceries', icon: '🛒', color: '#22c55e', keywords: 'bigbasket,dmart', parentId: null, type: 'expense' as const },
  { id: uuidv4(), name: 'Rent', icon: '🏠', color: '#f59e0b', keywords: 'rent,housing', parentId: null, type: 'expense' as const },
  { id: uuidv4(), name: 'Salary', icon: '💰', color: '#22c55e', keywords: 'salary,wages', parentId: null, type: 'income' as const },
  { id: uuidv4(), name: 'Interest Credit', icon: '🏦', color: '#0ea5e9', keywords: 'interest', parentId: null, type: 'income' as const },
  { id: uuidv4(), name: 'Investments', icon: '📈', color: '#10b981', keywords: 'sip,mutual fund', parentId: null, type: 'investment' as const },
  { id: uuidv4(), name: 'Other', icon: '📝', color: '#94a3b8', keywords: '', parentId: null, type: 'expense' as const },
];

// Check if running in Electron
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

// Mock implementation
export const mockElectronAPI = {
  openFileDialog: async () => [],
  parseFile: async () => ({ success: true, count: 0, transactions: [] }),
  
  getAllAccounts: async () => mockAccounts,
  addAccount: async (account: any) => ({ ...account, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
  updateAccount: async (_id: string, account: any) => account,
  deleteAccount: async () => {},
  
  getTransactions: async (filters?: any) => {
    let filtered = [...mockTransactions];
    if (filters?.accountId) {
      filtered = filtered.filter(t => t.accountId === filters.accountId);
    }
    if (filters?.startDate) {
      filtered = filtered.filter(t => t.date >= filters.startDate);
    }
    if (filters?.endDate) {
      filtered = filtered.filter(t => t.date <= filters.endDate);
    }
    return filtered;
  },
  getTransactionById: async (id: string) => mockTransactions.find(t => t.id === id),
  updateTransaction: async (_id: string, updates: any) => updates,
  deleteTransaction: async () => {},
  deleteTransactionsByAccount: async () => {},
  checkDuplicates: async () => [],
  
  getExpensesByCategory: async () => {
    const byCategory = new Map();
    mockTransactions.filter(t => t.type === 'debit').forEach(t => {
      const existing = byCategory.get(t.category) || { category: t.category, totalExpense: 0, transactionCount: 0 };
      existing.totalExpense += t.amount;
      existing.transactionCount++;
      byCategory.set(t.category, existing);
    });
    return Array.from(byCategory.values()).sort((a, b) => b.totalExpense - a.totalExpense);
  },
  
  getIncomeVsExpenses: async (period: string) => {
    const data = new Map();
    mockTransactions.forEach(t => {
      const date = new Date(t.date);
      let key;
      switch (period) {
        case 'monthly': key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; break;
        case 'yearly': key = `${date.getFullYear()}`; break;
        default: key = t.date;
      }
      const existing = data.get(key) || { period: key, income: 0, expenses: 0, investments: 0 };
      if (t.type === 'credit') existing.income += t.amount;
      else if (t.category === 'Investments') existing.investments += t.amount;
      else existing.expenses += t.amount;
      data.set(key, existing);
    });
    return Array.from(data.values()).sort((a, b) => a.period.localeCompare(b.period));
  },
  
  getSavingsOverTime: async () => {
    const data = new Map();
    let cumulative = 0;
    mockTransactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = data.get(key) || { month: key, income: 0, expenses: 0, savings: 0, cumulativeSavings: 0 };
      if (t.type === 'credit') existing.income += t.amount;
      else existing.expenses += t.amount;
      existing.savings = existing.income - existing.expenses;
      data.set(key, existing);
    });
    const sorted = Array.from(data.values()).sort((a, b) => a.month.localeCompare(b.month));
    return sorted.map(d => {
      cumulative += d.savings;
      return { ...d, cumulativeSavings: cumulative };
    });
  },
  
  getCashFlow: async () => {
    const data = new Map();
    let running = 0;
    mockTransactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = data.get(key) || { month: key, inflow: 0, outflow: 0, netFlow: 0, runningBalance: 0 };
      if (t.type === 'credit') existing.inflow += t.amount;
      else existing.outflow += t.amount;
      existing.netFlow = existing.inflow - existing.outflow;
      data.set(key, existing);
    });
    const sorted = Array.from(data.values()).sort((a, b) => a.month.localeCompare(b.month));
    return sorted.map(d => {
      running += d.netFlow;
      return { ...d, runningBalance: running };
    });
  },
  
  getTopMerchants: async (limit: number = 10) => {
    const data = new Map();
    mockTransactions.filter(t => t.type === 'debit').forEach(t => {
      const key = t.description;
      const existing = data.get(key) || { merchant: key, totalSpent: 0, transactionCount: 0, category: t.category };
      existing.totalSpent += t.amount;
      existing.transactionCount++;
      data.set(key, existing);
    });
    return Array.from(data.values()).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, limit);
  },
  
  getSpendingTrends: async () => {
    return mockCategories.filter(c => c.type === 'expense').map(c => ({
      category: c.name,
      currentAmount: Math.floor(Math.random() * 10000) + 1000,
      previousAmount: Math.floor(Math.random() * 10000) + 1000,
      change: Math.floor(Math.random() * 40) - 20,
      trend: Math.random() > 0.5 ? 'up' : 'down',
    }));
  },
  
  getSummary: async () => {
    const income = mockTransactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const expenses = mockTransactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netSavings: income - expenses,
      savingsRate: ((income - expenses) / income) * 100,
      totalTransactions: mockTransactions.length,
      avgExpense: expenses / mockTransactions.filter(t => t.type === 'debit').length,
      maxExpense: Math.max(...mockTransactions.filter(t => t.type === 'debit').map(t => t.amount)),
      firstTransaction: mockTransactions[mockTransactions.length - 1]?.date,
      lastTransaction: mockTransactions[0]?.date,
    };
  },
  
  getAllCategories: async () => mockCategories,
  addCategory: async (cat: any) => ({ ...cat, id: uuidv4() }),
  updateCategory: async (_id: string, cat: any) => cat,
  deleteCategory: async () => {},
  
  configureEmail: async () => {},
  getEmailConfig: async () => null,
  fetchStatements: async () => ({ success: true, attachments: [] }),
  
  exportTransactions: async () => ({ success: true, path: '/tmp/export.csv' }),
  
  getSettings: async () => ({
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    theme: 'light',
    defaultPeriod: 'month',
    notificationsEnabled: true,
  }),
  updateSettings: async () => {},
};

// Initialize mock API if not in Electron
if (typeof window !== 'undefined' && !window.electronAPI) {
  (window as any).electronAPI = mockElectronAPI;
}

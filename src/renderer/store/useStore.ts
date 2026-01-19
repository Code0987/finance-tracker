import { create } from 'zustand';
import { Account, Transaction, Category, Filters, Summary, Settings, DateRange } from '../types';

interface AppState {
  // Data
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  summary: Summary | null;
  
  // Filters
  filters: Filters;
  dateRange: DateRange;
  
  // Settings
  settings: Settings;
  
  // UI State
  isLoading: boolean;
  isSidebarOpen: boolean;
  selectedAccountId: string | null;
  
  // Actions
  setAccounts: (accounts: Account[]) => void;
  addAccount: (account: Account) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  removeAccount: (id: string) => void;
  
  setTransactions: (transactions: Transaction[]) => void;
  addTransactions: (transactions: Transaction[]) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  
  setSummary: (summary: Summary | null) => void;
  
  setFilters: (filters: Partial<Filters>) => void;
  clearFilters: () => void;
  setDateRange: (range: DateRange) => void;
  
  setSettings: (settings: Partial<Settings>) => void;
  
  setIsLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  setSelectedAccountId: (id: string | null) => void;
}

const getDefaultDateRange = (): DateRange => {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3); // Last 3 months by default
  
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

const defaultSettings: Settings = {
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  theme: 'light',
  defaultPeriod: 'month',
  notificationsEnabled: true,
};

export const useStore = create<AppState>((set) => ({
  // Initial data
  accounts: [],
  transactions: [],
  categories: [],
  summary: null,
  
  // Initial filters
  filters: {},
  dateRange: getDefaultDateRange(),
  
  // Initial settings
  settings: defaultSettings,
  
  // Initial UI state
  isLoading: false,
  isSidebarOpen: true,
  selectedAccountId: null,
  
  // Account actions
  setAccounts: (accounts) => set({ accounts }),
  addAccount: (account) => set((state) => ({ accounts: [account, ...state.accounts] })),
  updateAccount: (id, updates) => set((state) => ({
    accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
  })),
  removeAccount: (id) => set((state) => ({
    accounts: state.accounts.filter((a) => a.id !== id),
  })),
  
  // Transaction actions
  setTransactions: (transactions) => set({ transactions }),
  addTransactions: (newTransactions) => set((state) => ({
    transactions: [...newTransactions, ...state.transactions],
  })),
  updateTransaction: (id, updates) => set((state) => ({
    transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
  })),
  removeTransaction: (id) => set((state) => ({
    transactions: state.transactions.filter((t) => t.id !== id),
  })),
  
  // Category actions
  setCategories: (categories) => set({ categories }),
  addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
  updateCategory: (id, updates) => set((state) => ({
    categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
  })),
  removeCategory: (id) => set((state) => ({
    categories: state.categories.filter((c) => c.id !== id),
  })),
  
  // Summary action
  setSummary: (summary) => set({ summary }),
  
  // Filter actions
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters },
  })),
  clearFilters: () => set({ filters: {} }),
  setDateRange: (range) => set({ dateRange: range }),
  
  // Settings action
  setSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings },
  })),
  
  // UI actions
  setIsLoading: (isLoading) => set({ isLoading }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSelectedAccountId: (id) => set({ selectedAccountId: id }),
}));

// Selector hooks for better performance
export const useAccounts = () => useStore((state) => state.accounts);
export const useTransactions = () => useStore((state) => state.transactions);
export const useCategories = () => useStore((state) => state.categories);
export const useSummary = () => useStore((state) => state.summary);
export const useFilters = () => useStore((state) => state.filters);
export const useDateRange = () => useStore((state) => state.dateRange);
export const useSettings = () => useStore((state) => state.settings);
export const useIsLoading = () => useStore((state) => state.isLoading);

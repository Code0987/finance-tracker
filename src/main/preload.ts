import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),

  // File parsing
  parseFile: (filePath: string, accountId: string, accountType: 'bank' | 'credit_card') =>
    ipcRenderer.invoke('file:parse', filePath, accountId, accountType),

  // Accounts
  getAllAccounts: () => ipcRenderer.invoke('accounts:getAll'),
  addAccount: (account: any) => ipcRenderer.invoke('accounts:add', account),
  updateAccount: (id: string, account: any) => ipcRenderer.invoke('accounts:update', id, account),
  deleteAccount: (id: string) => ipcRenderer.invoke('accounts:delete', id),

  // Transactions
  getTransactions: (filters?: any) => ipcRenderer.invoke('transactions:getAll', filters),
  getTransactionById: (id: string) => ipcRenderer.invoke('transactions:getById', id),
  updateTransaction: (id: string, updates: any) => ipcRenderer.invoke('transactions:update', id, updates),
  deleteTransaction: (id: string) => ipcRenderer.invoke('transactions:delete', id),
  deleteTransactionsByAccount: (accountId: string) => ipcRenderer.invoke('transactions:deleteByAccount', accountId),
  checkDuplicates: (transactions: any[]) => ipcRenderer.invoke('transactions:checkDuplicates', transactions),

  // Analytics
  getExpensesByCategory: (filters?: any) => ipcRenderer.invoke('analytics:getExpensesByCategory', filters),
  getIncomeVsExpenses: (period: string, filters?: any) => ipcRenderer.invoke('analytics:getIncomeVsExpenses', period, filters),
  getSavingsOverTime: (filters?: any) => ipcRenderer.invoke('analytics:getSavingsOverTime', filters),
  getCashFlow: (filters?: any) => ipcRenderer.invoke('analytics:getCashFlow', filters),
  getTopMerchants: (limit: number, filters?: any) => ipcRenderer.invoke('analytics:getTopMerchants', limit, filters),
  getSpendingTrends: (filters?: any) => ipcRenderer.invoke('analytics:getSpendingTrends', filters),
  getSummary: (filters?: any) => ipcRenderer.invoke('analytics:getSummary', filters),

  // Email
  configureEmail: (config: any) => ipcRenderer.invoke('email:configure', config),
  getEmailConfig: () => ipcRenderer.invoke('email:getConfig'),
  fetchStatements: (config: any) => ipcRenderer.invoke('email:fetchStatements', config),

  // Export
  exportTransactions: (format: 'csv' | 'json', filters?: any) =>
    ipcRenderer.invoke('export:transactions', format, filters),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: any) => ipcRenderer.invoke('settings:update', settings),

  // Categories
  getAllCategories: () => ipcRenderer.invoke('categories:getAll'),
  addCategory: (category: any) => ipcRenderer.invoke('categories:add', category),
  updateCategory: (id: string, category: any) => ipcRenderer.invoke('categories:update', id, category),
  deleteCategory: (id: string) => ipcRenderer.invoke('categories:delete', id),
});

// Type definitions for the API
export interface ElectronAPI {
  openFileDialog: () => Promise<string[]>;
  parseFile: (filePath: string, accountId: string, accountType: 'bank' | 'credit_card') => Promise<any>;
  getAllAccounts: () => Promise<any[]>;
  addAccount: (account: any) => Promise<any>;
  updateAccount: (id: string, account: any) => Promise<any>;
  deleteAccount: (id: string) => Promise<any>;
  getTransactions: (filters?: any) => Promise<any[]>;
  getTransactionById: (id: string) => Promise<any>;
  updateTransaction: (id: string, updates: any) => Promise<any>;
  deleteTransaction: (id: string) => Promise<any>;
  deleteTransactionsByAccount: (accountId: string) => Promise<any>;
  checkDuplicates: (transactions: any[]) => Promise<any>;
  getExpensesByCategory: (filters?: any) => Promise<any>;
  getIncomeVsExpenses: (period: string, filters?: any) => Promise<any>;
  getSavingsOverTime: (filters?: any) => Promise<any>;
  getCashFlow: (filters?: any) => Promise<any>;
  getTopMerchants: (limit: number, filters?: any) => Promise<any>;
  getSpendingTrends: (filters?: any) => Promise<any>;
  getSummary: (filters?: any) => Promise<any>;
  configureEmail: (config: any) => Promise<any>;
  getEmailConfig: () => Promise<any>;
  fetchStatements: (config: any) => Promise<any>;
  exportTransactions: (format: 'csv' | 'json', filters?: any) => Promise<any>;
  getSettings: () => Promise<any>;
  updateSettings: (settings: any) => Promise<any>;
  getAllCategories: () => Promise<any[]>;
  addCategory: (category: any) => Promise<any>;
  updateCategory: (id: string, category: any) => Promise<any>;
  deleteCategory: (id: string) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

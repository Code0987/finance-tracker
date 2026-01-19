// Real API implementation using IndexedDB
import { db } from './database';
import { getParser } from './browserParser';
import { v4 as uuidv4 } from 'uuid';

// File handling for browser
let pendingFile: File | null = null;

export const setPendingFile = (file: File) => {
  pendingFile = file;
};

export const getPendingFile = (): File | null => {
  return pendingFile;
};

export const clearPendingFile = () => {
  pendingFile = null;
};

// API Implementation
export const api = {
  // File dialog (browser version uses file input)
  openFileDialog: async (): Promise<string[]> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.pdf,.csv,.xlsx,.xls';
      
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          resolve(Array.from(files).map(f => f.name));
        } else {
          resolve([]);
        }
      };
      
      input.click();
    });
  },

  // File parsing
  parseFile: async (filePath: string, accountId: string, accountType: 'bank' | 'credit_card') => {
    const file = pendingFile;
    if (!file) {
      return { success: false, error: 'No file selected' };
    }

    try {
      const parser = getParser();
      const parsedTransactions = await parser.parseFile(file);

      if (parsedTransactions.length === 0) {
        clearPendingFile();
        return { success: false, error: 'No transactions found in file' };
      }

      // Prepare transactions for storage
      const transactionsToAdd = parsedTransactions.map(t => ({
        accountId,
        date: t.date,
        description: t.description,
        remarks: t.remarks || '',
        amount: t.amount,
        type: t.type,
        category: t.category || 'Other',
        subcategory: '',
        merchant: t.merchant || '',
        balance: t.balance,
        reference: t.reference || '',
        mode: t.mode || '',
        isRecurring: false,
        tags: '',
      }));

      // Check for duplicates
      const duplicates = await db.checkDuplicates(
        transactionsToAdd.map(t => ({ ...t, accountId }))
      );

      // Filter out duplicates
      const newTransactions = transactionsToAdd.filter((t, index) => {
        return !duplicates.some(d => 
          d.date === t.date && 
          d.amount === t.amount && 
          d.type === t.type
        );
      });

      if (newTransactions.length === 0) {
        clearPendingFile();
        return { 
          success: true, 
          count: 0, 
          transactions: [],
          message: 'All transactions already exist (duplicates skipped)'
        };
      }

      // Add to database
      const added = await db.addTransactions(newTransactions);

      // Get account info for enrichment
      const accounts = await db.getAllAccounts();
      const account = accounts.find(a => a.id === accountId);

      const enrichedTransactions = added.map(t => ({
        ...t,
        accountName: account?.name,
        bankName: account?.bankName,
        accountType: account?.type,
      }));

      clearPendingFile();

      return {
        success: true,
        count: enrichedTransactions.length,
        transactions: enrichedTransactions,
        duplicatesSkipped: duplicates.length,
      };
    } catch (error: any) {
      clearPendingFile();
      console.error('Parse error:', error);
      return { success: false, error: error.message };
    }
  },

  // Accounts
  getAllAccounts: () => db.getAllAccounts(),
  addAccount: (account: any) => db.addAccount(account),
  updateAccount: (id: string, updates: any) => db.updateAccount(id, updates),
  deleteAccount: (id: string) => db.deleteAccount(id),

  // Transactions
  getTransactions: (filters?: any) => db.getTransactions(filters),
  getTransactionById: async (id: string) => {
    const transactions = await db.getTransactions();
    return transactions.find(t => t.id === id) || null;
  },
  updateTransaction: (id: string, updates: any) => db.updateTransaction(id, updates),
  deleteTransaction: (id: string) => db.deleteTransaction(id),
  deleteTransactionsByAccount: async (accountId: string) => {
    const transactions = await db.getTransactions({ accountId });
    for (const t of transactions) {
      await db.deleteTransaction(t.id);
    }
  },
  checkDuplicates: (transactions: any[]) => db.checkDuplicates(transactions),

  // Analytics
  getExpensesByCategory: (filters?: any) => db.getExpensesByCategory(filters),
  getIncomeVsExpenses: (period: 'daily' | 'weekly' | 'monthly' | 'yearly', filters?: any) => 
    db.getIncomeVsExpenses(period, filters),
  getSavingsOverTime: (filters?: any) => db.getSavingsOverTime(filters),
  getCashFlow: (filters?: any) => db.getCashFlow(filters),
  getTopMerchants: (limit: number, filters?: any) => db.getTopMerchants(limit, filters),
  getSpendingTrends: (filters?: any) => db.getSpendingTrends(filters),
  getSummary: (filters?: any) => db.getSummary(filters),

  // Categories
  getAllCategories: () => db.getAllCategories(),
  addCategory: (category: any) => db.addCategory(category),
  updateCategory: (id: string, updates: any) => db.updateCategory(id, updates),
  deleteCategory: (id: string) => db.deleteCategory(id),

  // Email (browser limitation - shows instructions)
  configureEmail: async (config: any) => {
    await db.saveEmailConfig(config);
    return { success: true };
  },
  getEmailConfig: () => db.getEmailConfig(),
  fetchStatements: async () => {
    return { 
      success: false, 
      error: 'Email fetching is not available in browser mode. Please download statements manually and upload them.',
      attachments: [] 
    };
  },

  // Export
  exportTransactions: async (format: 'csv' | 'json', filters?: any) => {
    const transactions = await db.getTransactions(filters);
    
    let content: string;
    let mimeType: string;
    let filename: string;

    if (format === 'csv') {
      const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Account', 'Balance', 'Mode'];
      const rows = transactions.map(t => [
        t.date,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.amount,
        t.type,
        t.category,
        t.accountName || '',
        t.balance || '',
        t.mode || '',
      ]);
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      mimeType = 'text/csv';
      filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      content = JSON.stringify(transactions, null, 2);
      mimeType = 'application/json';
      filename = `transactions_${new Date().toISOString().split('T')[0]}.json`;
    }

    // Trigger download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, path: filename };
  },

  // Settings
  getSettings: () => db.getSettings(),
  updateSettings: (settings: any) => db.updateSettings(settings),

  // Data management
  clearAllData: () => db.clearAllData(),
};

// Create window.electronAPI compatible interface
export const initializeApi = () => {
  if (typeof window !== 'undefined') {
    (window as any).electronAPI = api;
  }
};

// Auto-initialize
initializeApi();

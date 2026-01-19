// Browser-based database using IndexedDB
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'FinanceTrackerDB';
const DB_VERSION = 1;

export interface Account {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  type: 'bank' | 'credit_card';
  currency: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  remarks: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  subcategory: string;
  merchant: string;
  balance: number | null;
  reference: string;
  mode: string;
  isRecurring: boolean;
  tags: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string;
  parentId: string | null;
  type: 'expense' | 'income' | 'transfer' | 'investment';
}

export interface Settings {
  currency: string;
  dateFormat: string;
  theme: string;
  defaultPeriod: string;
  notificationsEnabled: boolean;
}

export interface EmailConfig {
  email: string;
  host: string;
  port: number;
  tls: boolean;
}

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Food & Dining', icon: '🍔', color: '#ef4444', keywords: 'swiggy,zomato,restaurant,cafe,food,dining,uber eats,dominos,pizza,mcdonalds,kfc,starbucks', parentId: null, type: 'expense' },
  { name: 'Groceries', icon: '🛒', color: '#22c55e', keywords: 'bigbasket,grofers,dmart,reliance fresh,more,supermarket,grocery,vegetables,fruits,blinkit,zepto,instamart', parentId: null, type: 'expense' },
  { name: 'Shopping', icon: '🛍️', color: '#8b5cf6', keywords: 'amazon,flipkart,myntra,ajio,snapdeal,shopping,mall,retail,clothes,electronics', parentId: null, type: 'expense' },
  { name: 'Transportation', icon: '🚗', color: '#3b82f6', keywords: 'uber,ola,rapido,petrol,diesel,fuel,metro,bus,train,irctc,redbus,cab,taxi', parentId: null, type: 'expense' },
  { name: 'Rent', icon: '🏠', color: '#f59e0b', keywords: 'rent,lease,housing,accommodation,pg,hostel', parentId: null, type: 'expense' },
  { name: 'Utilities', icon: '💡', color: '#06b6d4', keywords: 'electricity,water,gas,internet,broadband,wifi,jio,airtel,vodafone,bsnl,bill,recharge', parentId: null, type: 'expense' },
  { name: 'Entertainment', icon: '🎬', color: '#ec4899', keywords: 'netflix,amazon prime,hotstar,spotify,youtube,movie,theatre,pvr,inox,game,play,bookmyshow', parentId: null, type: 'expense' },
  { name: 'Healthcare', icon: '🏥', color: '#14b8a6', keywords: 'hospital,doctor,medicine,pharmacy,apollo,medplus,1mg,pharmeasy,netmeds,clinic,medical,health', parentId: null, type: 'expense' },
  { name: 'Education', icon: '📚', color: '#6366f1', keywords: 'school,college,university,course,udemy,coursera,books,tuition,fees,education', parentId: null, type: 'expense' },
  { name: 'Insurance', icon: '🛡️', color: '#84cc16', keywords: 'insurance,lic,hdfc life,icici prudential,premium,policy', parentId: null, type: 'expense' },
  { name: 'Investments', icon: '📈', color: '#10b981', keywords: 'mutual fund,sip,stock,zerodha,groww,upstox,investment,nps,ppf,fd,fixed deposit', parentId: null, type: 'investment' },
  { name: 'Salary', icon: '💰', color: '#22c55e', keywords: 'salary,wages,payroll,income,earning', parentId: null, type: 'income' },
  { name: 'Interest Credit', icon: '🏦', color: '#0ea5e9', keywords: 'interest credit,interest earned,dividend,bonus,int cred,int.cred', parentId: null, type: 'income' },
  { name: 'Refund', icon: '↩️', color: '#a855f7', keywords: 'refund,cashback,reversal,return', parentId: null, type: 'income' },
  { name: 'Transfer', icon: '↔️', color: '#64748b', keywords: 'transfer,neft,rtgs,imps,upi,self transfer', parentId: null, type: 'transfer' },
  { name: 'ATM Withdrawal', icon: '🏧', color: '#78716c', keywords: 'atm,cash withdrawal,withdrawal', parentId: null, type: 'expense' },
  { name: 'EMI', icon: '📅', color: '#f97316', keywords: 'emi,loan,installment,repayment', parentId: null, type: 'expense' },
  { name: 'Credit Card Payment', icon: '💳', color: '#0891b2', keywords: 'credit card,card payment,cc payment,card bill', parentId: null, type: 'transfer' },
  { name: 'Travel', icon: '✈️', color: '#7c3aed', keywords: 'makemytrip,goibibo,cleartrip,flight,hotel,booking,airbnb,oyo', parentId: null, type: 'expense' },
  { name: 'Other', icon: '📝', color: '#94a3b8', keywords: '', parentId: null, type: 'expense' },
];

class BrowserDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores
        if (!db.objectStoreNames.contains('accounts')) {
          const accountStore = db.createObjectStore('accounts', { keyPath: 'id' });
          accountStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('transactions')) {
          const txnStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txnStore.createIndex('accountId', 'accountId', { unique: false });
          txnStore.createIndex('date', 'date', { unique: false });
          txnStore.createIndex('category', 'category', { unique: false });
          txnStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('emailConfig')) {
          db.createObjectStore('emailConfig', { keyPath: 'id' });
        }
      };
    });

    await this.initPromise;
    await this.seedCategories();
  }

  private async seedCategories(): Promise<void> {
    const categories = await this.getAllCategories();
    if (categories.length === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await this.addCategory(cat);
      }
    }
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Accounts
  async getAllAccounts(): Promise<Account[]> {
    await this.init();
    const store = this.getStore('accounts');
    return this.promisifyRequest(store.getAll());
  }

  async addAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    await this.init();
    const newAccount: Account = {
      ...account,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const store = this.getStore('accounts', 'readwrite');
    await this.promisifyRequest(store.add(newAccount));
    return newAccount;
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    await this.init();
    const store = this.getStore('accounts', 'readwrite');
    const existing = await this.promisifyRequest(store.get(id));
    if (!existing) throw new Error('Account not found');
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await this.promisifyRequest(store.put(updated));
    return updated;
  }

  async deleteAccount(id: string): Promise<void> {
    await this.init();
    
    // First, get all transaction IDs for this account BEFORE deleting anything
    const txnStore = this.getStore('transactions');
    const allTransactions: Transaction[] = await this.promisifyRequest(txnStore.getAll());
    const transactionIdsToDelete = allTransactions
      .filter(t => t.accountId === id)
      .map(t => t.id);
    
    // Delete the account
    const accountStore = this.getStore('accounts', 'readwrite');
    await this.promisifyRequest(accountStore.delete(id));
    
    // Delete related transactions one by one (each in its own transaction)
    for (const txnId of transactionIdsToDelete) {
      const store = this.getStore('transactions', 'readwrite');
      await this.promisifyRequest(store.delete(txnId));
    }
  }

  // Transactions
  async getTransactions(filters?: {
    accountId?: string;
    accountType?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
    type?: string;
    search?: string;
  }): Promise<(Transaction & { accountName?: string; bankName?: string; accountType?: string })[]> {
    await this.init();
    const store = this.getStore('transactions');
    let transactions: Transaction[] = await this.promisifyRequest(store.getAll());
    const accounts = await this.getAllAccounts();
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    // Apply filters
    if (filters?.accountId) {
      transactions = transactions.filter(t => t.accountId === filters.accountId);
    }
    if (filters?.accountType) {
      transactions = transactions.filter(t => {
        const account = accountMap.get(t.accountId);
        return account?.type === filters.accountType;
      });
    }
    if (filters?.startDate) {
      transactions = transactions.filter(t => t.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      transactions = transactions.filter(t => t.date <= filters.endDate!);
    }
    if (filters?.category) {
      transactions = transactions.filter(t => t.category === filters.category);
    }
    if (filters?.type) {
      transactions = transactions.filter(t => t.type === filters.type);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      transactions = transactions.filter(t =>
        t.description?.toLowerCase().includes(search) ||
        t.remarks?.toLowerCase().includes(search) ||
        t.merchant?.toLowerCase().includes(search)
      );
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Add account info
    return transactions.map(t => {
      const account = accountMap.get(t.accountId);
      return {
        ...t,
        accountName: account?.name,
        bankName: account?.bankName,
        accountType: account?.type,
      };
    });
  }

  async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    await this.init();
    const newTxn: Transaction = {
      ...transaction,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const store = this.getStore('transactions', 'readwrite');
    await this.promisifyRequest(store.add(newTxn));
    return newTxn;
  }

  async addTransactions(transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Transaction[]> {
    await this.init();
    const store = this.getStore('transactions', 'readwrite');
    const results: Transaction[] = [];
    
    for (const txn of transactions) {
      const newTxn: Transaction = {
        ...txn,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await this.promisifyRequest(store.add(newTxn));
      results.push(newTxn);
    }
    
    return results;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    await this.init();
    const store = this.getStore('transactions', 'readwrite');
    const existing = await this.promisifyRequest(store.get(id));
    if (!existing) throw new Error('Transaction not found');
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await this.promisifyRequest(store.put(updated));
    return updated;
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.init();
    const store = this.getStore('transactions', 'readwrite');
    await this.promisifyRequest(store.delete(id));
  }

  async checkDuplicates(transactions: Partial<Transaction>[]): Promise<any[]> {
    await this.init();
    const existing = await this.getTransactions();
    const duplicates: any[] = [];

    for (const t of transactions) {
      const dup = existing.find(e =>
        e.accountId === t.accountId &&
        e.date === t.date &&
        e.amount === t.amount &&
        e.type === t.type
      );
      if (dup) {
        duplicates.push({ ...t, existingId: dup.id });
      }
    }

    return duplicates;
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    await this.init();
    const store = this.getStore('categories');
    return this.promisifyRequest(store.getAll());
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    await this.init();
    const newCat: Category = { ...category, id: uuidv4() };
    const store = this.getStore('categories', 'readwrite');
    await this.promisifyRequest(store.add(newCat));
    return newCat;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    await this.init();
    const store = this.getStore('categories', 'readwrite');
    const existing = await this.promisifyRequest(store.get(id));
    if (!existing) throw new Error('Category not found');
    const updated = { ...existing, ...updates };
    await this.promisifyRequest(store.put(updated));
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.init();
    const store = this.getStore('categories', 'readwrite');
    await this.promisifyRequest(store.delete(id));
  }

  // Analytics
  async getExpensesByCategory(filters?: any): Promise<any[]> {
    const transactions = await this.getTransactions(filters);
    const byCategory = new Map<string, { category: string; totalExpense: number; transactionCount: number }>();

    transactions.filter(t => t.type === 'debit').forEach(t => {
      const existing = byCategory.get(t.category) || { category: t.category, totalExpense: 0, transactionCount: 0 };
      existing.totalExpense += t.amount;
      existing.transactionCount++;
      byCategory.set(t.category, existing);
    });

    return Array.from(byCategory.values()).sort((a, b) => b.totalExpense - a.totalExpense);
  }

  async getIncomeVsExpenses(period: 'daily' | 'weekly' | 'monthly' | 'yearly', filters?: any): Promise<any[]> {
    const transactions = await this.getTransactions(filters);
    const categories = await this.getAllCategories();
    const investmentCategories = new Set(categories.filter(c => c.type === 'investment').map(c => c.name));
    
    const data = new Map<string, { period: string; income: number; expenses: number; investments: number }>();

    transactions.forEach(t => {
      const date = new Date(t.date);
      let key: string;
      
      switch (period) {
        case 'daily':
          key = t.date;
          break;
        case 'weekly':
          const weekNum = Math.ceil(date.getDate() / 7);
          key = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          key = `${date.getFullYear()}`;
          break;
      }

      const existing = data.get(key) || { period: key, income: 0, expenses: 0, investments: 0 };
      
      if (t.type === 'credit') {
        existing.income += t.amount;
      } else if (investmentCategories.has(t.category)) {
        existing.investments += t.amount;
      } else {
        existing.expenses += t.amount;
      }
      
      data.set(key, existing);
    });

    return Array.from(data.values()).sort((a, b) => a.period.localeCompare(b.period));
  }

  async getSavingsOverTime(filters?: any): Promise<any[]> {
    const transactions = await this.getTransactions(filters);
    const data = new Map<string, { month: string; income: number; expenses: number; savings: number }>();

    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = data.get(key) || { month: key, income: 0, expenses: 0, savings: 0 };
      
      if (t.type === 'credit') {
        existing.income += t.amount;
      } else {
        existing.expenses += t.amount;
      }
      existing.savings = existing.income - existing.expenses;
      data.set(key, existing);
    });

    const sorted = Array.from(data.values()).sort((a, b) => a.month.localeCompare(b.month));
    
    let cumulativeSavings = 0;
    return sorted.map(d => {
      cumulativeSavings += d.savings;
      return { ...d, cumulativeSavings };
    });
  }

  async getCashFlow(filters?: any): Promise<any[]> {
    const transactions = await this.getTransactions(filters);
    const data = new Map<string, { month: string; inflow: number; outflow: number; netFlow: number }>();

    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = data.get(key) || { month: key, inflow: 0, outflow: 0, netFlow: 0 };
      
      if (t.type === 'credit') {
        existing.inflow += t.amount;
      } else {
        existing.outflow += t.amount;
      }
      existing.netFlow = existing.inflow - existing.outflow;
      data.set(key, existing);
    });

    const sorted = Array.from(data.values()).sort((a, b) => a.month.localeCompare(b.month));
    
    let runningBalance = 0;
    return sorted.map(d => {
      runningBalance += d.netFlow;
      return { ...d, runningBalance };
    });
  }

  async getTopMerchants(limit: number = 10, filters?: any): Promise<any[]> {
    const transactions = await this.getTransactions(filters);
    const data = new Map<string, { merchant: string; totalSpent: number; transactionCount: number; category: string }>();

    transactions.filter(t => t.type === 'debit').forEach(t => {
      const key = t.merchant || t.description || 'Unknown';
      const existing = data.get(key) || { merchant: key, totalSpent: 0, transactionCount: 0, category: t.category };
      existing.totalSpent += t.amount;
      existing.transactionCount++;
      data.set(key, existing);
    });

    return Array.from(data.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  async getSpendingTrends(filters?: any): Promise<any[]> {
    const transactions = await this.getTransactions(filters);
    const categories = await this.getAllCategories();
    
    // Get current period data
    const currentByCategory = new Map<string, number>();
    transactions.filter(t => t.type === 'debit').forEach(t => {
      currentByCategory.set(t.category, (currentByCategory.get(t.category) || 0) + t.amount);
    });

    // For trends, we'd need previous period data
    // For now, generate synthetic comparison
    return categories
      .filter(c => c.type === 'expense')
      .map(c => {
        const currentAmount = currentByCategory.get(c.name) || 0;
        const previousAmount = currentAmount * (0.8 + Math.random() * 0.4); // Simulated previous
        const change = previousAmount > 0 ? ((currentAmount - previousAmount) / previousAmount) * 100 : 0;
        return {
          category: c.name,
          currentAmount,
          previousAmount,
          change: Math.round(change * 100) / 100,
          trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
        };
      })
      .filter(t => t.currentAmount > 0)
      .sort((a, b) => b.currentAmount - a.currentAmount);
  }

  async getSummary(filters?: any): Promise<any> {
    const transactions = await this.getTransactions(filters);
    
    const credits = transactions.filter(t => t.type === 'credit');
    const debits = transactions.filter(t => t.type === 'debit');
    
    const totalIncome = credits.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = debits.reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    
    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      totalTransactions: transactions.length,
      avgExpense: debits.length > 0 ? totalExpenses / debits.length : 0,
      maxExpense: debits.length > 0 ? Math.max(...debits.map(t => t.amount)) : 0,
      firstTransaction: transactions[transactions.length - 1]?.date || null,
      lastTransaction: transactions[0]?.date || null,
    };
  }

  // Settings
  async getSettings(): Promise<Settings> {
    await this.init();
    const store = this.getStore('settings');
    const items = await this.promisifyRequest(store.getAll());
    const settings: any = {};
    items.forEach((item: any) => {
      settings[item.key] = item.value;
    });
    return {
      currency: settings.currency || 'INR',
      dateFormat: settings.dateFormat || 'DD/MM/YYYY',
      theme: settings.theme || 'light',
      defaultPeriod: settings.defaultPeriod || 'month',
      notificationsEnabled: settings.notificationsEnabled ?? true,
    };
  }

  async updateSettings(settings: Partial<Settings>): Promise<void> {
    await this.init();
    const store = this.getStore('settings', 'readwrite');
    for (const [key, value] of Object.entries(settings)) {
      await this.promisifyRequest(store.put({ key, value }));
    }
  }

  // Email Config
  async getEmailConfig(): Promise<EmailConfig | null> {
    await this.init();
    const store = this.getStore('emailConfig');
    const items = await this.promisifyRequest(store.getAll());
    return items[0] || null;
  }

  async saveEmailConfig(config: EmailConfig): Promise<void> {
    await this.init();
    const store = this.getStore('emailConfig', 'readwrite');
    await this.promisifyRequest(store.clear());
    await this.promisifyRequest(store.add({ id: 'config', ...config }));
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    await this.init();
    const stores = ['accounts', 'transactions', 'settings', 'emailConfig'];
    for (const storeName of stores) {
      const store = this.getStore(storeName, 'readwrite');
      await this.promisifyRequest(store.clear());
    }
  }
}

// Singleton instance
export const db = new BrowserDatabase();

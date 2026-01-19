import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Food & Dining', icon: '🍔', color: '#ef4444', keywords: 'swiggy,zomato,restaurant,cafe,food,dining,uber eats,dominos,pizza,mcdonalds,kfc,starbucks', parentId: null, type: 'expense' },
  { name: 'Groceries', icon: '🛒', color: '#22c55e', keywords: 'bigbasket,grofers,dmart,reliance fresh,more,supermarket,grocery,vegetables,fruits', parentId: null, type: 'expense' },
  { name: 'Shopping', icon: '🛍️', color: '#8b5cf6', keywords: 'amazon,flipkart,myntra,ajio,snapdeal,shopping,mall,retail,clothes,electronics', parentId: null, type: 'expense' },
  { name: 'Transportation', icon: '🚗', color: '#3b82f6', keywords: 'uber,ola,rapido,petrol,diesel,fuel,metro,bus,train,irctc,redbus,cab,taxi', parentId: null, type: 'expense' },
  { name: 'Rent', icon: '🏠', color: '#f59e0b', keywords: 'rent,lease,housing,accommodation,pg,hostel', parentId: null, type: 'expense' },
  { name: 'Utilities', icon: '💡', color: '#06b6d4', keywords: 'electricity,water,gas,internet,broadband,wifi,jio,airtel,vodafone,bsnl,bill,recharge', parentId: null, type: 'expense' },
  { name: 'Entertainment', icon: '🎬', color: '#ec4899', keywords: 'netflix,amazon prime,hotstar,spotify,youtube,movie,theatre,pvr,inox,game,play', parentId: null, type: 'expense' },
  { name: 'Healthcare', icon: '🏥', color: '#14b8a6', keywords: 'hospital,doctor,medicine,pharmacy,apollo,medplus,1mg,pharmeasy,netmeds,clinic,medical,health', parentId: null, type: 'expense' },
  { name: 'Education', icon: '📚', color: '#6366f1', keywords: 'school,college,university,course,udemy,coursera,books,tuition,fees,education', parentId: null, type: 'expense' },
  { name: 'Insurance', icon: '🛡️', color: '#84cc16', keywords: 'insurance,lic,hdfc life,icici prudential,premium,policy', parentId: null, type: 'expense' },
  { name: 'Investments', icon: '📈', color: '#10b981', keywords: 'mutual fund,sip,stock,zerodha,groww,upstox,investment,nps,ppf,fd,fixed deposit', parentId: null, type: 'investment' },
  { name: 'Salary', icon: '💰', color: '#22c55e', keywords: 'salary,wages,payroll,income,earning', parentId: null, type: 'income' },
  { name: 'Interest Credit', icon: '🏦', color: '#0ea5e9', keywords: 'interest credit,interest earned,dividend,bonus', parentId: null, type: 'income' },
  { name: 'Refund', icon: '↩️', color: '#a855f7', keywords: 'refund,cashback,reversal,return', parentId: null, type: 'income' },
  { name: 'Transfer', icon: '↔️', color: '#64748b', keywords: 'transfer,neft,rtgs,imps,upi,self transfer', parentId: null, type: 'transfer' },
  { name: 'ATM Withdrawal', icon: '🏧', color: '#78716c', keywords: 'atm,cash withdrawal,withdrawal', parentId: null, type: 'expense' },
  { name: 'EMI', icon: '📅', color: '#f97316', keywords: 'emi,loan,installment,repayment', parentId: null, type: 'expense' },
  { name: 'Credit Card Payment', icon: '💳', color: '#0891b2', keywords: 'credit card,card payment,cc payment,card bill', parentId: null, type: 'transfer' },
  { name: 'Other', icon: '📝', color: '#94a3b8', keywords: '', parentId: null, type: 'expense' },
];

export class DatabaseManager {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'finance-tracker.db');
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
  }

  initialize() {
    // Create accounts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        bankName TEXT NOT NULL,
        accountNumber TEXT,
        type TEXT NOT NULL DEFAULT 'bank',
        currency TEXT DEFAULT 'INR',
        color TEXT DEFAULT '#3b82f6',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Create transactions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        remarks TEXT,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        category TEXT,
        subcategory TEXT,
        merchant TEXT,
        balance REAL,
        reference TEXT,
        mode TEXT,
        isRecurring INTEGER DEFAULT 0,
        tags TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (accountId) REFERENCES accounts(id)
      )
    `);

    // Create categories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        keywords TEXT,
        parentId TEXT,
        type TEXT DEFAULT 'expense',
        FOREIGN KEY (parentId) REFERENCES categories(id)
      )
    `);

    // Create settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Create email_config table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS email_config (
        id INTEGER PRIMARY KEY,
        email TEXT,
        host TEXT,
        port INTEGER,
        password TEXT,
        tls INTEGER DEFAULT 1,
        lastFetch TEXT
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_accountId ON transactions(accountId);
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    `);

    // Insert default categories if empty
    const categoryCount = this.db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
    if (categoryCount.count === 0) {
      const insertCategory = this.db.prepare(`
        INSERT INTO categories (id, name, icon, color, keywords, parentId, type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const category of DEFAULT_CATEGORIES) {
        insertCategory.run(uuidv4(), category.name, category.icon, category.color, category.keywords, category.parentId, category.type);
      }
    }
  }

  // Account methods
  getAllAccounts(): Account[] {
    return this.db.prepare('SELECT * FROM accounts ORDER BY createdAt DESC').all() as Account[];
  }

  addAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Account {
    const id = uuidv4();
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO accounts (id, name, bankName, accountNumber, type, currency, color, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, account.name, account.bankName, account.accountNumber, account.type, account.currency, account.color, now, now);
    return this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as Account;
  }

  updateAccount(id: string, updates: Partial<Account>): Account {
    const now = new Date().toISOString();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), now, id];
    this.db.prepare(`UPDATE accounts SET ${fields}, updatedAt = ? WHERE id = ?`).run(...values);
    return this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as Account;
  }

  deleteAccount(id: string): void {
    this.db.prepare('DELETE FROM transactions WHERE accountId = ?').run(id);
    this.db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
  }

  // Transaction methods
  getTransactions(filters?: {
    accountId?: string;
    accountType?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
    type?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Transaction[] {
    let query = `
      SELECT t.*, a.name as accountName, a.bankName, a.type as accountType
      FROM transactions t
      LEFT JOIN accounts a ON t.accountId = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.accountId) {
      query += ' AND t.accountId = ?';
      params.push(filters.accountId);
    }

    if (filters?.accountType) {
      query += ' AND a.type = ?';
      params.push(filters.accountType);
    }

    if (filters?.startDate) {
      query += ' AND t.date >= ?';
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ' AND t.date <= ?';
      params.push(filters.endDate);
    }

    if (filters?.category) {
      query += ' AND t.category = ?';
      params.push(filters.category);
    }

    if (filters?.type) {
      query += ' AND t.type = ?';
      params.push(filters.type);
    }

    if (filters?.search) {
      query += ' AND (t.description LIKE ? OR t.remarks LIKE ? OR t.merchant LIKE ?)';
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY t.date DESC, t.createdAt DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    return this.db.prepare(query).all(...params) as Transaction[];
  }

  getTransactionById(id: string): Transaction | null {
    return this.db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction | null;
  }

  addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
    const id = uuidv4();
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO transactions (id, accountId, date, description, remarks, amount, type, category, subcategory, merchant, balance, reference, mode, isRecurring, tags, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      transaction.accountId,
      transaction.date,
      transaction.description || '',
      transaction.remarks || '',
      transaction.amount,
      transaction.type,
      transaction.category || 'Other',
      transaction.subcategory || '',
      transaction.merchant || '',
      transaction.balance,
      transaction.reference || '',
      transaction.mode || '',
      transaction.isRecurring ? 1 : 0,
      transaction.tags || '',
      now,
      now
    );
    return this.db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction;
  }

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction {
    const now = new Date().toISOString();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), now, id];
    this.db.prepare(`UPDATE transactions SET ${fields}, updatedAt = ? WHERE id = ?`).run(...values);
    return this.db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction;
  }

  deleteTransaction(id: string): void {
    this.db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  }

  deleteTransactionsByAccount(accountId: string): void {
    this.db.prepare('DELETE FROM transactions WHERE accountId = ?').run(accountId);
  }

  checkDuplicates(transactions: any[]): any[] {
    const duplicates: any[] = [];
    const stmt = this.db.prepare(`
      SELECT id FROM transactions 
      WHERE accountId = ? AND date = ? AND amount = ? AND type = ?
    `);

    for (const t of transactions) {
      const existing = stmt.get(t.accountId, t.date, t.amount, t.type);
      if (existing) {
        duplicates.push({ ...t, existingId: (existing as any).id });
      }
    }

    return duplicates;
  }

  // Analytics methods
  getExpensesByCategory(filters?: { startDate?: string; endDate?: string; accountId?: string; accountType?: string }): any[] {
    let query = `
      SELECT 
        t.category,
        SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END) as totalExpense,
        COUNT(*) as transactionCount
      FROM transactions t
      LEFT JOIN accounts a ON t.accountId = a.id
      WHERE t.type = 'debit'
    `;
    const params: any[] = [];

    if (filters?.startDate) {
      query += ' AND t.date >= ?';
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ' AND t.date <= ?';
      params.push(filters.endDate);
    }

    if (filters?.accountId) {
      query += ' AND t.accountId = ?';
      params.push(filters.accountId);
    }

    if (filters?.accountType) {
      query += ' AND a.type = ?';
      params.push(filters.accountType);
    }

    query += ' GROUP BY t.category ORDER BY totalExpense DESC';

    return this.db.prepare(query).all(...params);
  }

  getIncomeVsExpenses(period: 'daily' | 'weekly' | 'monthly' | 'yearly', filters?: any): any[] {
    let dateFormat: string;
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        dateFormat = '%Y-W%W';
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      case 'yearly':
        dateFormat = '%Y';
        break;
    }

    let query = `
      SELECT 
        strftime('${dateFormat}', t.date) as period,
        SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END) as income,
        SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END) as expenses,
        SUM(CASE WHEN c.type = 'investment' AND t.type = 'debit' THEN t.amount ELSE 0 END) as investments
      FROM transactions t
      LEFT JOIN categories c ON t.category = c.name
      LEFT JOIN accounts a ON t.accountId = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.startDate) {
      query += ' AND t.date >= ?';
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ' AND t.date <= ?';
      params.push(filters.endDate);
    }

    if (filters?.accountId) {
      query += ' AND t.accountId = ?';
      params.push(filters.accountId);
    }

    if (filters?.accountType) {
      query += ' AND a.type = ?';
      params.push(filters.accountType);
    }

    query += ` GROUP BY strftime('${dateFormat}', t.date) ORDER BY period ASC`;

    return this.db.prepare(query).all(...params);
  }

  getSavingsOverTime(filters?: any): any[] {
    let query = `
      SELECT 
        strftime('%Y-%m', t.date) as month,
        SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END) as income,
        SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END) as expenses,
        SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE -t.amount END) as savings
      FROM transactions t
      LEFT JOIN accounts a ON t.accountId = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.startDate) {
      query += ' AND t.date >= ?';
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ' AND t.date <= ?';
      params.push(filters.endDate);
    }

    if (filters?.accountId) {
      query += ' AND t.accountId = ?';
      params.push(filters.accountId);
    }

    if (filters?.accountType) {
      query += ' AND a.type = ?';
      params.push(filters.accountType);
    }

    query += ' GROUP BY strftime(\'%Y-%m\', t.date) ORDER BY month ASC';

    const results = this.db.prepare(query).all(...params) as any[];

    // Calculate cumulative savings
    let cumulativeSavings = 0;
    return results.map(r => {
      cumulativeSavings += r.savings;
      return { ...r, cumulativeSavings };
    });
  }

  getCashFlow(filters?: any): any {
    let query = `
      SELECT 
        strftime('%Y-%m', t.date) as month,
        SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END) as inflow,
        SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END) as outflow
      FROM transactions t
      LEFT JOIN accounts a ON t.accountId = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.startDate) {
      query += ' AND t.date >= ?';
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ' AND t.date <= ?';
      params.push(filters.endDate);
    }

    if (filters?.accountId) {
      query += ' AND t.accountId = ?';
      params.push(filters.accountId);
    }

    if (filters?.accountType) {
      query += ' AND a.type = ?';
      params.push(filters.accountType);
    }

    query += ' GROUP BY strftime(\'%Y-%m\', t.date) ORDER BY month ASC';

    const monthly = this.db.prepare(query).all(...params) as any[];

    // Calculate net flow and running balance
    let runningBalance = 0;
    return monthly.map(m => {
      const netFlow = m.inflow - m.outflow;
      runningBalance += netFlow;
      return { ...m, netFlow, runningBalance };
    });
  }

  getTopMerchants(limit: number = 10, filters?: any): any[] {
    let query = `
      SELECT 
        COALESCE(NULLIF(t.merchant, ''), t.description) as merchant,
        SUM(t.amount) as totalSpent,
        COUNT(*) as transactionCount,
        t.category
      FROM transactions t
      LEFT JOIN accounts a ON t.accountId = a.id
      WHERE t.type = 'debit' AND (t.merchant != '' OR t.description != '')
    `;
    const params: any[] = [];

    if (filters?.startDate) {
      query += ' AND t.date >= ?';
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ' AND t.date <= ?';
      params.push(filters.endDate);
    }

    if (filters?.accountId) {
      query += ' AND t.accountId = ?';
      params.push(filters.accountId);
    }

    if (filters?.accountType) {
      query += ' AND a.type = ?';
      params.push(filters.accountType);
    }

    query += ` GROUP BY merchant ORDER BY totalSpent DESC LIMIT ?`;
    params.push(limit);

    return this.db.prepare(query).all(...params);
  }

  getSpendingTrends(filters?: any): any {
    // Get current period vs previous period comparison
    let currentQuery = `
      SELECT 
        t.category,
        SUM(t.amount) as amount
      FROM transactions t
      LEFT JOIN accounts a ON t.accountId = a.id
      WHERE t.type = 'debit'
    `;
    const currentParams: any[] = [];
    const previousParams: any[] = [];

    let previousQuery = currentQuery;

    if (filters?.startDate && filters?.endDate) {
      currentQuery += ' AND t.date >= ? AND t.date <= ?';
      currentParams.push(filters.startDate, filters.endDate);

      // Calculate previous period
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      const diff = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - diff);
      const prevEnd = new Date(start.getTime() - 1);

      previousQuery += ' AND t.date >= ? AND t.date <= ?';
      previousParams.push(prevStart.toISOString().split('T')[0], prevEnd.toISOString().split('T')[0]);
    }

    if (filters?.accountId) {
      currentQuery += ' AND t.accountId = ?';
      previousQuery += ' AND t.accountId = ?';
      currentParams.push(filters.accountId);
      previousParams.push(filters.accountId);
    }

    if (filters?.accountType) {
      currentQuery += ' AND a.type = ?';
      previousQuery += ' AND a.type = ?';
      currentParams.push(filters.accountType);
      previousParams.push(filters.accountType);
    }

    currentQuery += ' GROUP BY t.category';
    previousQuery += ' GROUP BY t.category';

    const currentData = this.db.prepare(currentQuery).all(...currentParams) as any[];
    const previousData = this.db.prepare(previousQuery).all(...previousParams) as any[];

    // Merge and calculate trends
    const previousMap = new Map(previousData.map(p => [p.category, p.amount]));
    
    return currentData.map(c => {
      const prevAmount = previousMap.get(c.category) || 0;
      const change = prevAmount ? ((c.amount - prevAmount) / prevAmount) * 100 : 100;
      return {
        category: c.category,
        currentAmount: c.amount,
        previousAmount: prevAmount,
        change: Math.round(change * 100) / 100,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      };
    });
  }

  getSummary(filters?: any): any {
    let query = `
      SELECT 
        SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END) as totalExpenses,
        COUNT(*) as totalTransactions,
        AVG(CASE WHEN t.type = 'debit' THEN t.amount END) as avgExpense,
        MAX(CASE WHEN t.type = 'debit' THEN t.amount END) as maxExpense,
        MIN(t.date) as firstTransaction,
        MAX(t.date) as lastTransaction
      FROM transactions t
      LEFT JOIN accounts a ON t.accountId = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.startDate) {
      query += ' AND t.date >= ?';
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ' AND t.date <= ?';
      params.push(filters.endDate);
    }

    if (filters?.accountId) {
      query += ' AND t.accountId = ?';
      params.push(filters.accountId);
    }

    if (filters?.accountType) {
      query += ' AND a.type = ?';
      params.push(filters.accountType);
    }

    const result = this.db.prepare(query).get(...params) as any;
    
    return {
      ...result,
      netSavings: (result.totalIncome || 0) - (result.totalExpenses || 0),
      savingsRate: result.totalIncome ? ((result.totalIncome - result.totalExpenses) / result.totalIncome) * 100 : 0,
    };
  }

  // Category methods
  getAllCategories(): Category[] {
    return this.db.prepare('SELECT * FROM categories ORDER BY name').all() as Category[];
  }

  addCategory(category: Omit<Category, 'id'>): Category {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO categories (id, name, icon, color, keywords, parentId, type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, category.name, category.icon, category.color, category.keywords, category.parentId, category.type);
    return this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category;
  }

  updateCategory(id: string, updates: Partial<Category>): Category {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    this.db.prepare(`UPDATE categories SET ${fields} WHERE id = ?`).run(...values);
    return this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category;
  }

  deleteCategory(id: string): void {
    this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }

  // Settings methods
  getSettings(): Record<string, any> {
    const rows = this.db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, any> = {};
    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }
    return settings;
  }

  updateSettings(settings: Record<string, any>): void {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(settings)) {
      stmt.run(key, JSON.stringify(value));
    }
  }

  // Email config methods
  saveEmailConfig(config: any): void {
    this.db.prepare('DELETE FROM email_config').run();
    const stmt = this.db.prepare(`
      INSERT INTO email_config (email, host, port, password, tls)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(config.email, config.host, config.port, config.password, config.tls ? 1 : 0);
  }

  getEmailConfig(): any {
    return this.db.prepare('SELECT * FROM email_config LIMIT 1').get();
  }
}

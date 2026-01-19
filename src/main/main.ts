import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { DatabaseManager } from './database';
import { PDFParser } from './parsers/pdfParser';
import { CSVParser } from './parsers/csvParser';
import { EmailFetcher } from './emailFetcher';
import { TransactionCategorizer } from './categorizer';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let db: DatabaseManager;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'darwin',
    backgroundColor: '#f8fafc',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  db = new DatabaseManager();
  db.initialize();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// File dialog for selecting files
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Bank Statements', extensions: ['pdf', 'csv', 'xlsx', 'xls'] },
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result.filePaths;
});

// Parse uploaded file
ipcMain.handle('file:parse', async (_, filePath: string, accountId: string, accountType: 'bank' | 'credit_card') => {
  const ext = path.extname(filePath).toLowerCase();
  let transactions: any[] = [];

  try {
    if (ext === '.pdf') {
      const parser = new PDFParser();
      transactions = await parser.parse(filePath);
    } else if (ext === '.csv') {
      const parser = new CSVParser();
      transactions = await parser.parse(filePath);
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }

    // Categorize transactions
    const categorizer = new TransactionCategorizer();
    transactions = transactions.map(t => ({
      ...t,
      category: categorizer.categorize(t.description || t.remarks || ''),
      accountId,
      accountType,
    }));

    // Store in database
    for (const transaction of transactions) {
      db.addTransaction(transaction);
    }

    return { success: true, count: transactions.length, transactions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Get all accounts
ipcMain.handle('accounts:getAll', () => {
  return db.getAllAccounts();
});

// Add new account
ipcMain.handle('accounts:add', (_, account: any) => {
  return db.addAccount(account);
});

// Update account
ipcMain.handle('accounts:update', (_, id: string, account: any) => {
  return db.updateAccount(id, account);
});

// Delete account
ipcMain.handle('accounts:delete', (_, id: string) => {
  return db.deleteAccount(id);
});

// Get transactions with filters
ipcMain.handle('transactions:getAll', (_, filters?: any) => {
  return db.getTransactions(filters);
});

// Get transaction by ID
ipcMain.handle('transactions:getById', (_, id: string) => {
  return db.getTransactionById(id);
});

// Update transaction
ipcMain.handle('transactions:update', (_, id: string, updates: any) => {
  return db.updateTransaction(id, updates);
});

// Delete transaction
ipcMain.handle('transactions:delete', (_, id: string) => {
  return db.deleteTransaction(id);
});

// Delete all transactions for an account
ipcMain.handle('transactions:deleteByAccount', (_, accountId: string) => {
  return db.deleteTransactionsByAccount(accountId);
});

// Get analytics data
ipcMain.handle('analytics:getExpensesByCategory', (_, filters?: any) => {
  return db.getExpensesByCategory(filters);
});

ipcMain.handle('analytics:getIncomeVsExpenses', (_, period: 'daily' | 'weekly' | 'monthly' | 'yearly', filters?: any) => {
  return db.getIncomeVsExpenses(period, filters);
});

ipcMain.handle('analytics:getSavingsOverTime', (_, filters?: any) => {
  return db.getSavingsOverTime(filters);
});

ipcMain.handle('analytics:getCashFlow', (_, filters?: any) => {
  return db.getCashFlow(filters);
});

ipcMain.handle('analytics:getTopMerchants', (_, limit: number, filters?: any) => {
  return db.getTopMerchants(limit, filters);
});

ipcMain.handle('analytics:getSpendingTrends', (_, filters?: any) => {
  return db.getSpendingTrends(filters);
});

ipcMain.handle('analytics:getSummary', (_, filters?: any) => {
  return db.getSummary(filters);
});

// Email fetcher for Gmail IMAP
ipcMain.handle('email:configure', (_, config: any) => {
  return db.saveEmailConfig(config);
});

ipcMain.handle('email:getConfig', () => {
  return db.getEmailConfig();
});

ipcMain.handle('email:fetchStatements', async (_, config: any) => {
  const fetcher = new EmailFetcher(config);
  try {
    const attachments = await fetcher.fetchBankStatements();
    return { success: true, attachments };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Export data
ipcMain.handle('export:transactions', async (_, format: 'csv' | 'json', filters?: any) => {
  const transactions = db.getTransactions(filters);
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: `transactions_${new Date().toISOString().split('T')[0]}.${format}`,
    filters: [
      { name: format.toUpperCase(), extensions: [format] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  try {
    if (format === 'csv') {
      const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Account', 'Balance'];
      const rows = transactions.map((t: any) => [
        t.date,
        t.description,
        t.amount,
        t.type,
        t.category,
        t.accountName || '',
        t.balance || '',
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      fs.writeFileSync(result.filePath, csv);
    } else {
      fs.writeFileSync(result.filePath, JSON.stringify(transactions, null, 2));
    }
    return { success: true, path: result.filePath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Duplicate detection
ipcMain.handle('transactions:checkDuplicates', (_, transactions: any[]) => {
  return db.checkDuplicates(transactions);
});

// Settings
ipcMain.handle('settings:get', () => {
  return db.getSettings();
});

ipcMain.handle('settings:update', (_, settings: any) => {
  return db.updateSettings(settings);
});

// Categories management
ipcMain.handle('categories:getAll', () => {
  return db.getAllCategories();
});

ipcMain.handle('categories:add', (_, category: any) => {
  return db.addCategory(category);
});

ipcMain.handle('categories:update', (_, id: string, category: any) => {
  return db.updateCategory(id, category);
});

ipcMain.handle('categories:delete', (_, id: string) => {
  return db.deleteCategory(id);
});

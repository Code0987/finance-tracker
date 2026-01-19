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
  accountName?: string;
  bankName?: string;
  accountType?: 'bank' | 'credit_card';
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

export interface Filters {
  accountId?: string;
  accountType?: 'bank' | 'credit_card';
  startDate?: string;
  endDate?: string;
  category?: string;
  type?: 'credit' | 'debit';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface Summary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  totalTransactions: number;
  avgExpense: number;
  maxExpense: number;
  firstTransaction: string;
  lastTransaction: string;
}

export interface ExpenseByCategory {
  category: string;
  totalExpense: number;
  transactionCount: number;
  percentage?: number;
  color?: string;
  icon?: string;
}

export interface IncomeVsExpense {
  period: string;
  income: number;
  expenses: number;
  investments: number;
  savings?: number;
}

export interface CashFlow {
  month: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  runningBalance: number;
}

export interface Merchant {
  merchant: string;
  totalSpent: number;
  transactionCount: number;
  category: string;
}

export interface SpendingTrend {
  category: string;
  currentAmount: number;
  previousAmount: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SavingsData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  cumulativeSavings: number;
}

export interface EmailConfig {
  email: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

export interface Settings {
  currency: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'system';
  defaultPeriod: 'week' | 'month' | 'quarter' | 'year' | 'all';
  notificationsEnabled: boolean;
}

export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface FileParseResult {
  success: boolean;
  count?: number;
  transactions?: Transaction[];
  error?: string;
}

export interface ExportResult {
  success: boolean;
  path?: string;
  error?: string;
  canceled?: boolean;
}

// Chart data types
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

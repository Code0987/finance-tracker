import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Account, Transaction, Category, Filters, Summary, Settings, EmailConfig } from '../types';

export const useApi = () => {
  const {
    setAccounts,
    addAccount,
    updateAccount,
    removeAccount,
    setTransactions,
    addTransactions,
    updateTransaction,
    removeTransaction,
    setCategories,
    addCategory,
    updateCategory,
    removeCategory,
    setSummary,
    setIsLoading,
    dateRange,
    filters,
  } = useStore();

  // Accounts
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const accounts = await window.electronAPI.getAllAccounts();
      setAccounts(accounts);
      return accounts;
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setAccounts, setIsLoading]);

  const createAccount = useCallback(async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    try {
      const newAccount = await window.electronAPI.addAccount(account);
      addAccount(newAccount);
      return newAccount;
    } catch (error) {
      console.error('Failed to create account:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [addAccount, setIsLoading]);

  const editAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    try {
      const updated = await window.electronAPI.updateAccount(id, updates);
      updateAccount(id, updated);
      return updated;
    } catch (error) {
      console.error('Failed to update account:', error);
      throw error;
    }
  }, [updateAccount]);

  const deleteAccount = useCallback(async (id: string) => {
    try {
      await window.electronAPI.deleteAccount(id);
      removeAccount(id);
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  }, [removeAccount]);

  // Transactions
  const fetchTransactions = useCallback(async (customFilters?: Filters) => {
    setIsLoading(true);
    try {
      const appliedFilters = {
        ...filters,
        ...customFilters,
        startDate: customFilters?.startDate || dateRange.startDate,
        endDate: customFilters?.endDate || dateRange.endDate,
      };
      const transactions = await window.electronAPI.getTransactions(appliedFilters);
      setTransactions(transactions);
      return transactions;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [filters, dateRange, setTransactions, setIsLoading]);

  const editTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    try {
      const updated = await window.electronAPI.updateTransaction(id, updates);
      updateTransaction(id, updated);
      return updated;
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw error;
    }
  }, [updateTransaction]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await window.electronAPI.deleteTransaction(id);
      removeTransaction(id);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
  }, [removeTransaction]);

  // File parsing
  const parseFile = useCallback(async (filePath: string, accountId: string, accountType: 'bank' | 'credit_card') => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.parseFile(filePath, accountId, accountType);
      if (result.success && result.transactions) {
        addTransactions(result.transactions);
      }
      return result;
    } catch (error) {
      console.error('Failed to parse file:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [addTransactions, setIsLoading]);

  const openFileDialog = useCallback(async () => {
    try {
      return await window.electronAPI.openFileDialog();
    } catch (error) {
      console.error('Failed to open file dialog:', error);
      throw error;
    }
  }, []);

  // Analytics
  const fetchSummary = useCallback(async (customFilters?: Filters) => {
    try {
      const appliedFilters = {
        ...filters,
        ...customFilters,
        startDate: customFilters?.startDate || dateRange.startDate,
        endDate: customFilters?.endDate || dateRange.endDate,
      };
      const summary = await window.electronAPI.getSummary(appliedFilters);
      setSummary(summary);
      return summary;
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      throw error;
    }
  }, [filters, dateRange, setSummary]);

  const fetchExpensesByCategory = useCallback(async (customFilters?: Filters) => {
    try {
      const appliedFilters = {
        ...filters,
        ...customFilters,
        startDate: customFilters?.startDate || dateRange.startDate,
        endDate: customFilters?.endDate || dateRange.endDate,
      };
      return await window.electronAPI.getExpensesByCategory(appliedFilters);
    } catch (error) {
      console.error('Failed to fetch expenses by category:', error);
      throw error;
    }
  }, [filters, dateRange]);

  const fetchIncomeVsExpenses = useCallback(async (period: 'daily' | 'weekly' | 'monthly' | 'yearly', customFilters?: Filters) => {
    try {
      const appliedFilters = {
        ...filters,
        ...customFilters,
        startDate: customFilters?.startDate || dateRange.startDate,
        endDate: customFilters?.endDate || dateRange.endDate,
      };
      return await window.electronAPI.getIncomeVsExpenses(period, appliedFilters);
    } catch (error) {
      console.error('Failed to fetch income vs expenses:', error);
      throw error;
    }
  }, [filters, dateRange]);

  const fetchSavingsOverTime = useCallback(async (customFilters?: Filters) => {
    try {
      const appliedFilters = {
        ...filters,
        ...customFilters,
        startDate: customFilters?.startDate || dateRange.startDate,
        endDate: customFilters?.endDate || dateRange.endDate,
      };
      return await window.electronAPI.getSavingsOverTime(appliedFilters);
    } catch (error) {
      console.error('Failed to fetch savings over time:', error);
      throw error;
    }
  }, [filters, dateRange]);

  const fetchCashFlow = useCallback(async (customFilters?: Filters) => {
    try {
      const appliedFilters = {
        ...filters,
        ...customFilters,
        startDate: customFilters?.startDate || dateRange.startDate,
        endDate: customFilters?.endDate || dateRange.endDate,
      };
      return await window.electronAPI.getCashFlow(appliedFilters);
    } catch (error) {
      console.error('Failed to fetch cash flow:', error);
      throw error;
    }
  }, [filters, dateRange]);

  const fetchTopMerchants = useCallback(async (limit: number = 10, customFilters?: Filters) => {
    try {
      const appliedFilters = {
        ...filters,
        ...customFilters,
        startDate: customFilters?.startDate || dateRange.startDate,
        endDate: customFilters?.endDate || dateRange.endDate,
      };
      return await window.electronAPI.getTopMerchants(limit, appliedFilters);
    } catch (error) {
      console.error('Failed to fetch top merchants:', error);
      throw error;
    }
  }, [filters, dateRange]);

  const fetchSpendingTrends = useCallback(async (customFilters?: Filters) => {
    try {
      const appliedFilters = {
        ...filters,
        ...customFilters,
        startDate: customFilters?.startDate || dateRange.startDate,
        endDate: customFilters?.endDate || dateRange.endDate,
      };
      return await window.electronAPI.getSpendingTrends(appliedFilters);
    } catch (error) {
      console.error('Failed to fetch spending trends:', error);
      throw error;
    }
  }, [filters, dateRange]);

  // Categories
  const fetchCategories = useCallback(async () => {
    try {
      const categories = await window.electronAPI.getAllCategories();
      setCategories(categories);
      return categories;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw error;
    }
  }, [setCategories]);

  const createCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    try {
      const newCategory = await window.electronAPI.addCategory(category);
      addCategory(newCategory);
      return newCategory;
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  }, [addCategory]);

  const editCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    try {
      const updated = await window.electronAPI.updateCategory(id, updates);
      updateCategory(id, updated);
      return updated;
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  }, [updateCategory]);

  const deleteCategoryById = useCallback(async (id: string) => {
    try {
      await window.electronAPI.deleteCategory(id);
      removeCategory(id);
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  }, [removeCategory]);

  // Email
  const configureEmail = useCallback(async (config: EmailConfig) => {
    try {
      return await window.electronAPI.configureEmail(config);
    } catch (error) {
      console.error('Failed to configure email:', error);
      throw error;
    }
  }, []);

  const getEmailConfig = useCallback(async () => {
    try {
      return await window.electronAPI.getEmailConfig();
    } catch (error) {
      console.error('Failed to get email config:', error);
      throw error;
    }
  }, []);

  const fetchEmailStatements = useCallback(async (config: EmailConfig) => {
    setIsLoading(true);
    try {
      return await window.electronAPI.fetchStatements(config);
    } catch (error) {
      console.error('Failed to fetch email statements:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  // Export
  const exportTransactions = useCallback(async (format: 'csv' | 'json', customFilters?: Filters) => {
    try {
      const appliedFilters = {
        ...filters,
        ...customFilters,
        startDate: customFilters?.startDate || dateRange.startDate,
        endDate: customFilters?.endDate || dateRange.endDate,
      };
      return await window.electronAPI.exportTransactions(format, appliedFilters);
    } catch (error) {
      console.error('Failed to export transactions:', error);
      throw error;
    }
  }, [filters, dateRange]);

  // Settings
  const fetchSettings = useCallback(async () => {
    try {
      return await window.electronAPI.getSettings();
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      throw error;
    }
  }, []);

  const updateSettings = useCallback(async (settings: Partial<Settings>) => {
    try {
      return await window.electronAPI.updateSettings(settings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }, []);

  return {
    // Accounts
    fetchAccounts,
    createAccount,
    editAccount,
    deleteAccount,
    
    // Transactions
    fetchTransactions,
    editTransaction,
    deleteTransaction,
    
    // File parsing
    parseFile,
    openFileDialog,
    
    // Analytics
    fetchSummary,
    fetchExpensesByCategory,
    fetchIncomeVsExpenses,
    fetchSavingsOverTime,
    fetchCashFlow,
    fetchTopMerchants,
    fetchSpendingTrends,
    
    // Categories
    fetchCategories,
    createCategory,
    editCategory,
    deleteCategory: deleteCategoryById,
    
    // Email
    configureEmail,
    getEmailConfig,
    fetchEmailStatements,
    
    // Export
    exportTransactions,
    
    // Settings
    fetchSettings,
    updateSettings,
  };
};

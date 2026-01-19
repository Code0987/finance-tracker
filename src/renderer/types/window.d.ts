export {};

declare global {
  interface Window {
    process?: {
      type?: string;
    };
    electronAPI: {
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
    };
  }
}

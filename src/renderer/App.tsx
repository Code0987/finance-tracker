import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApi } from './hooks/useApi';
import { useStore } from './store/useStore';
import { db } from './utils/database';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Upload from './pages/Upload';
import Accounts from './pages/Accounts';
import Analytics from './pages/Analytics';
import Categories from './pages/Categories';
import Settings from './pages/Settings';

const App: React.FC = () => {
  const { fetchAccounts, fetchCategories, fetchTransactions, fetchSummary } = useApi();
  const { isSidebarOpen, isLoading, setIsLoading } = useStore();
  const [dbInitialized, setDbInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize database and load data
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        // Initialize the IndexedDB database
        await db.init();
        setDbInitialized(true);
        
        // Load initial data
        await Promise.all([
          fetchAccounts(),
          fetchCategories(),
          fetchTransactions(),
          fetchSummary(),
        ]);
      } catch (error: any) {
        console.error('Failed to initialize app:', error);
        setInitError(error.message || 'Failed to initialize database');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  // Show error if initialization failed
  if (initError) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Initialization Error</h1>
          <p className="text-slate-600 mb-4">{initError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show loading while initializing
  if (!dbInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner w-12 h-12"></div>
          <span className="text-slate-600">Initializing Finance Tracker...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="fixed inset-0 bg-white bg-opacity-50 z-40 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="spinner w-8 h-8"></div>
                <span className="text-sm text-slate-600">Loading...</span>
              </div>
            </div>
          )}
          
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;

import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApi } from './hooks/useApi';
import { useStore } from './store/useStore';

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
  const { isSidebarOpen, isLoading } = useStore();

  useEffect(() => {
    // Initial data load
    const loadData = async () => {
      try {
        await Promise.all([
          fetchAccounts(),
          fetchCategories(),
          fetchTransactions(),
          fetchSummary(),
        ]);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };
    loadData();
  }, []);

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

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useApi } from '../hooks/useApi';
import { FiMenu, FiSearch, FiCalendar, FiDownload, FiRefreshCw } from 'react-icons/fi';
import DateRangePicker from './DateRangePicker';

const pageTitle: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/upload': 'Upload Statements',
  '/accounts': 'Accounts',
  '/analytics': 'Analytics',
  '/categories': 'Categories',
  '/settings': 'Settings',
};

const Header: React.FC = () => {
  const location = useLocation();
  const { isSidebarOpen, toggleSidebar, filters, setFilters, dateRange, setDateRange } = useStore();
  const { fetchTransactions, fetchSummary, exportTransactions } = useApi();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const title = pageTitle[location.pathname] || 'Finance Tracker';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ search: searchQuery });
    fetchTransactions({ search: searchQuery });
  };

  const handleRefresh = async () => {
    await Promise.all([fetchTransactions(), fetchSummary()]);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    await exportTransactions(format);
  };

  const handleDateChange = (range: { startDate: string; endDate: string }) => {
    setDateRange(range);
    setShowDatePicker(false);
    fetchTransactions({ startDate: range.startDate, endDate: range.endDate });
    fetchSummary({ startDate: range.startDate, endDate: range.endDate });
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {!isSidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="btn-icon"
            >
              <FiMenu className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </form>

          {/* Date Range */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="btn-secondary gap-2"
            >
              <FiCalendar className="w-4 h-4" />
              <span className="text-sm">
                {dateRange.startDate} - {dateRange.endDate}
              </span>
            </button>

            {showDatePicker && (
              <div className="absolute right-0 top-full mt-2 z-50">
                <DateRangePicker
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  onChange={handleDateChange}
                  onClose={() => setShowDatePicker(false)}
                />
              </div>
            )}
          </div>

          {/* Refresh */}
          <button onClick={handleRefresh} className="btn-icon" title="Refresh data">
            <FiRefreshCw className="w-5 h-5" />
          </button>

          {/* Export */}
          <div className="relative group">
            <button className="btn-secondary gap-2">
              <FiDownload className="w-4 h-4" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
              >
                Export as JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

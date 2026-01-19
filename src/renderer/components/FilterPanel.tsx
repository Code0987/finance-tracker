import React from 'react';
import { Account, Category, Filters } from '../types';
import { FiX } from 'react-icons/fi';

interface FilterPanelProps {
  filters: Filters;
  accounts: Account[];
  categories: Category[];
  onFilterChange: (filters: Partial<Filters>) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  accounts,
  categories,
  onFilterChange,
  onApply,
  onClear,
  onClose,
}) => {
  return (
    <div className="filter-panel animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-slate-900">Filters</h3>
        <button onClick={onClose} className="btn-icon p-1">
          <FiX className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Account Filter */}
        <div>
          <label className="label">Account</label>
          <select
            value={filters.accountId || ''}
            onChange={(e) => onFilterChange({ accountId: e.target.value || undefined })}
            className="select"
          >
            <option value="">All Accounts</option>
            <optgroup label="Bank Accounts">
              {accounts.filter(a => a.type === 'bank').map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </optgroup>
            <optgroup label="Credit Cards">
              {accounts.filter(a => a.type === 'credit_card').map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Account Type Filter */}
        <div>
          <label className="label">Account Type</label>
          <select
            value={filters.accountType || ''}
            onChange={(e) => onFilterChange({ accountType: e.target.value as any || undefined })}
            className="select"
          >
            <option value="">All Types</option>
            <option value="bank">Bank Account</option>
            <option value="credit_card">Credit Card</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="label">Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) => onFilterChange({ category: e.target.value || undefined })}
            className="select"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction Type Filter */}
        <div>
          <label className="label">Transaction Type</label>
          <select
            value={filters.type || ''}
            onChange={(e) => onFilterChange({ type: e.target.value as any || undefined })}
            className="select"
          >
            <option value="">All</option>
            <option value="credit">Income (Credit)</option>
            <option value="debit">Expense (Debit)</option>
          </select>
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label className="label">From Date</label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onFilterChange({ startDate: e.target.value || undefined })}
            className="input"
          />
        </div>
        <div>
          <label className="label">To Date</label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onFilterChange({ endDate: e.target.value || undefined })}
            className="input"
          />
        </div>
      </div>

      {/* Search */}
      <div className="mt-4">
        <label className="label">Search</label>
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ search: e.target.value || undefined })}
          placeholder="Search in descriptions..."
          className="input"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
        <button onClick={onClear} className="btn-secondary">
          Clear All
        </button>
        <button onClick={onApply} className="btn-primary">
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;

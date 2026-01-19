import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useApi } from '../hooks/useApi';
import { Transaction } from '../types';
import { formatCurrency, formatDate, getCategoryIcon, getCategoryColor, truncateText } from '../utils/formatters';
import { FiEdit2, FiTrash2, FiFilter, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Modal from '../components/Modal';

const Transactions: React.FC = () => {
  const { transactions, accounts, categories, filters, setFilters, clearFilters } = useStore();
  const { editTransaction, deleteTransaction, fetchTransactions } = useApi();

  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Local filter state
  const [localFilters, setLocalFilters] = useState({
    accountId: filters.accountId || '',
    accountType: filters.accountType || '',
    category: filters.category || '',
    type: filters.type || '',
  });

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [transactions, sortField, sortOrder]);

  const handleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleApplyFilters = () => {
    const newFilters: any = {};
    if (localFilters.accountId) newFilters.accountId = localFilters.accountId;
    if (localFilters.accountType) newFilters.accountType = localFilters.accountType;
    if (localFilters.category) newFilters.category = localFilters.category;
    if (localFilters.type) newFilters.type = localFilters.type;
    setFilters(newFilters);
    fetchTransactions(newFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setLocalFilters({ accountId: '', accountType: '', category: '', type: '' });
    clearFilters();
    fetchTransactions();
    setShowFilters(false);
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    await editTransaction(editingTransaction.id, editingTransaction);
    setEditingTransaction(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction(id);
    }
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const SortIcon = ({ field }: { field: 'date' | 'amount' }) => {
    if (sortField !== field) return null;
    return sortOrder === 'desc' ? <FiChevronDown className="w-4 h-4" /> : <FiChevronUp className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">All Transactions</h2>
          <p className="text-sm text-slate-500">{transactions.length} transactions</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary gap-2 ${activeFiltersCount > 0 ? 'ring-2 ring-primary-500' : ''}`}
        >
          <FiFilter className="w-4 h-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-500 text-white rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filter-panel animate-slide-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Account</label>
              <select
                value={localFilters.accountId}
                onChange={(e) => setLocalFilters({ ...localFilters, accountId: e.target.value })}
                className="select"
              >
                <option value="">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Account Type</label>
              <select
                value={localFilters.accountType}
                onChange={(e) => setLocalFilters({ ...localFilters, accountType: e.target.value })}
                className="select"
              >
                <option value="">All Types</option>
                <option value="bank">Bank Account</option>
                <option value="credit_card">Credit Card</option>
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select
                value={localFilters.category}
                onChange={(e) => setLocalFilters({ ...localFilters, category: e.target.value })}
                className="select"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select
                value={localFilters.type}
                onChange={(e) => setLocalFilters({ ...localFilters, type: e.target.value })}
                className="select"
              >
                <option value="">All</option>
                <option value="credit">Income (Credit)</option>
                <option value="debit">Expense (Debit)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
            <button onClick={handleClearFilters} className="btn-secondary">
              Clear All
            </button>
            <button onClick={handleApplyFilters} className="btn-primary">
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.accountId && (
            <span className="badge badge-primary gap-1">
              Account: {accounts.find(a => a.id === filters.accountId)?.name}
              <button onClick={() => { setFilters({ accountId: undefined }); fetchTransactions({ ...filters, accountId: undefined }); }}>
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.accountType && (
            <span className="badge badge-primary gap-1">
              Type: {filters.accountType === 'bank' ? 'Bank' : 'Credit Card'}
              <button onClick={() => { setFilters({ accountType: undefined }); fetchTransactions({ ...filters, accountType: undefined }); }}>
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.category && (
            <span className="badge badge-primary gap-1">
              Category: {filters.category}
              <button onClick={() => { setFilters({ category: undefined }); fetchTransactions({ ...filters, category: undefined }); }}>
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.type && (
            <span className="badge badge-primary gap-1">
              {filters.type === 'credit' ? 'Income' : 'Expense'}
              <button onClick={() => { setFilters({ type: undefined }); fetchTransactions({ ...filters, type: undefined }); }}>
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Transactions Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th 
                  className="cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <SortIcon field="date" />
                  </div>
                </th>
                <th>Description</th>
                <th>Category</th>
                <th>Account</th>
                <th>Mode</th>
                <th 
                  className="cursor-pointer hover:bg-slate-100 text-right"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    <SortIcon field="amount" />
                  </div>
                </th>
                <th className="text-right">Balance</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="empty-state">
                      <div className="empty-state-icon">📊</div>
                      <div className="empty-state-title">No transactions found</div>
                      <div className="empty-state-description">
                        Upload a bank statement to see your transactions here
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((txn) => (
                  <tr key={txn.id} className="group">
                    <td className="whitespace-nowrap font-medium">
                      {formatDate(txn.date, 'dd MMM yyyy')}
                    </td>
                    <td className="max-w-xs">
                      <div className="truncate" title={txn.description}>
                        {truncateText(txn.description, 40)}
                      </div>
                      {txn.remarks && (
                        <div className="text-xs text-slate-400 truncate" title={txn.remarks}>
                          {truncateText(txn.remarks, 50)}
                        </div>
                      )}
                    </td>
                    <td>
                      <span 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${getCategoryColor(txn.category)}20`, color: getCategoryColor(txn.category) }}
                      >
                        {getCategoryIcon(txn.category)} {txn.category}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${txn.accountType === 'bank' ? 'account-type-bank' : 'account-type-credit_card'}`}>
                        {txn.accountName}
                      </span>
                    </td>
                    <td className="text-slate-500 text-sm">
                      {txn.mode || '-'}
                    </td>
                    <td className={`text-right font-semibold ${txn.type === 'credit' ? 'text-success-600' : 'text-danger-500'}`}>
                      {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </td>
                    <td className="text-right text-slate-600">
                      {txn.balance ? formatCurrency(txn.balance) : '-'}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingTransaction(txn)}
                          className="btn-icon p-1.5"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(txn.id)}
                          className="btn-icon p-1.5 text-danger-500 hover:bg-danger-50"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTransaction && (
        <Modal
          title="Edit Transaction"
          onClose={() => setEditingTransaction(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                value={editingTransaction.date}
                onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <input
                type="text"
                value={editingTransaction.description}
                onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Amount</label>
                <input
                  type="number"
                  value={editingTransaction.amount}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Type</label>
                <select
                  value={editingTransaction.type}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, type: e.target.value as 'credit' | 'debit' })}
                  className="select"
                >
                  <option value="credit">Credit (Income)</option>
                  <option value="debit">Debit (Expense)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Category</label>
              <select
                value={editingTransaction.category}
                onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                className="select"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Remarks</label>
              <textarea
                value={editingTransaction.remarks}
                onChange={(e) => setEditingTransaction({ ...editingTransaction, remarks: e.target.value })}
                className="input"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button onClick={() => setEditingTransaction(null)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSaveEdit} className="btn-primary">
              Save Changes
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Transactions;

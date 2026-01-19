import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useApi } from '../hooks/useApi';
import { Account } from '../types';
import { formatDate } from '../utils/formatters';
import { FiCreditCard, FiDollarSign, FiEdit2, FiTrash2, FiPlus, FiMoreVertical } from 'react-icons/fi';
import Modal from '../components/Modal';

const Accounts: React.FC = () => {
  const { accounts, transactions } = useStore();
  const { createAccount, editAccount, deleteAccount } = useApi();

  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    bankName: '',
    accountNumber: '',
    type: 'bank' as 'bank' | 'credit_card',
    currency: 'INR',
    color: '#3b82f6',
  });

  const bankAccounts = accounts.filter(a => a.type === 'bank');
  const creditCards = accounts.filter(a => a.type === 'credit_card');

  const getAccountStats = (accountId: string) => {
    const accountTxns = transactions.filter(t => t.accountId === accountId);
    const totalIncome = accountTxns.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = accountTxns.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    return {
      transactionCount: accountTxns.length,
      totalIncome,
      totalExpenses,
      lastTransaction: accountTxns[0]?.date,
    };
  };

  const openCreateModal = () => {
    setEditingAccount(null);
    setFormData({
      name: '',
      bankName: '',
      accountNumber: '',
      type: 'bank',
      currency: 'INR',
      color: '#3b82f6',
    });
    setShowModal(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      type: account.type,
      currency: account.currency,
      color: account.color,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.bankName) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingAccount) {
      await editAccount(editingAccount.id, formData);
    } else {
      await createAccount(formData);
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (confirm(`Are you sure you want to delete "${account?.name}"? All transactions will be removed.`)) {
      await deleteAccount(id);
    }
  };

  const AccountCard = ({ account }: { account: Account }) => {
    const stats = getAccountStats(account.id);
    
    return (
      <div className="card group hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: account.color }}
              >
                {account.type === 'bank' ? <FiDollarSign className="w-7 h-7" /> : <FiCreditCard className="w-7 h-7" />}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{account.name}</h3>
                <p className="text-sm text-slate-500">{account.bankName}</p>
                {account.accountNumber && (
                  <p className="text-xs text-slate-400">•••• {account.accountNumber.slice(-4)}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEditModal(account)}
                className="btn-icon p-2"
                title="Edit"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(account.id)}
                className="btn-icon p-2 text-danger-500 hover:bg-danger-50"
                title="Delete"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500">Transactions</p>
              <p className="text-lg font-semibold text-slate-900">{stats.transactionCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Income</p>
              <p className="text-lg font-semibold text-success-600">
                ₹{(stats.totalIncome / 1000).toFixed(1)}K
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Expenses</p>
              <p className="text-lg font-semibold text-danger-500">
                ₹{(stats.totalExpenses / 1000).toFixed(1)}K
              </p>
            </div>
          </div>

          {stats.lastTransaction && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Last transaction: {formatDate(stats.lastTransaction)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Accounts</h2>
          <p className="text-sm text-slate-500">{accounts.length} accounts connected</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary gap-2">
          <FiPlus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Bank Accounts */}
      <div>
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
          Bank Accounts ({bankAccounts.length})
        </h3>
        {bankAccounts.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiDollarSign className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No bank accounts added</p>
            <p className="text-sm text-slate-500 mt-1">Add your bank accounts to start tracking</p>
            <button onClick={openCreateModal} className="btn-primary mt-4">
              Add Bank Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </div>

      {/* Credit Cards */}
      <div>
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
          Credit Cards ({creditCards.length})
        </h3>
        {creditCards.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCreditCard className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No credit cards added</p>
            <p className="text-sm text-slate-500 mt-1">Add your credit cards to track spending</p>
            <button 
              onClick={() => {
                setFormData({ ...formData, type: 'credit_card' });
                openCreateModal();
              }} 
              className="btn-primary mt-4"
            >
              Add Credit Card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditCards.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal 
          title={editingAccount ? 'Edit Account' : 'Add New Account'} 
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="label">Account Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Primary Savings"
                className="input"
              />
            </div>
            <div>
              <label className="label">Bank Name *</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="e.g., HDFC Bank"
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Account Number</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="XXXX1234"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Account Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'bank' | 'credit_card' })}
                  className="select"
                >
                  <option value="bank">Bank Account</option>
                  <option value="credit_card">Credit Card</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="select"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="label">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-lg transition-transform ${formData.color === color ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button onClick={() => setShowModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn-primary">
              {editingAccount ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Accounts;

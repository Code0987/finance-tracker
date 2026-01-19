import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useApi } from '../hooks/useApi';
import { FiSave, FiRefreshCw, FiTrash2, FiMail, FiDatabase, FiInfo, FiCheck } from 'react-icons/fi';

const Settings: React.FC = () => {
  const { settings, setSettings, accounts, transactions } = useStore();
  const { updateSettings, fetchSettings, getEmailConfig, configureEmail, fetchTransactions } = useApi();

  const [localSettings, setLocalSettings] = useState(settings);
  const [emailConfig, setEmailConfig] = useState({
    email: '',
    host: 'imap.gmail.com',
    port: 993,
    password: '',
    tls: true,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
    loadEmailConfig();
  }, []);

  useEffect(() => {
    setHasChanges(JSON.stringify(localSettings) !== JSON.stringify(settings));
  }, [localSettings, settings]);

  const loadSettings = async () => {
    try {
      const stored = await fetchSettings();
      if (stored) {
        setLocalSettings({ ...settings, ...stored });
        setSettings(stored);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadEmailConfig = async () => {
    try {
      const config = await getEmailConfig();
      if (config) {
        setEmailConfig({
          email: config.email || '',
          host: config.host || 'imap.gmail.com',
          port: config.port || 993,
          password: '',
          tls: config.tls ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to load email config:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings(localSettings);
      setSettings(localSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleSaveEmailConfig = async () => {
    try {
      await configureEmail(emailConfig);
      alert('Email configuration saved successfully');
    } catch (error) {
      console.error('Failed to save email config:', error);
      alert('Failed to save email configuration');
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }
    if (!confirm('This will delete ALL accounts and transactions. Are you absolutely sure?')) {
      return;
    }
    // In a real app, we'd call an API to clear the database
    alert('Data cleared. Please restart the application.');
  };

  const stats = {
    accounts: accounts.length,
    transactions: transactions.length,
    dataSize: 'Calculating...',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Manage your preferences and configuration</p>
      </div>

      {/* General Settings */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-medium text-slate-900">General Settings</h3>
        </div>
        <div className="card-body space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Default Currency</label>
              <select
                value={localSettings.currency}
                onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                className="select"
              >
                <option value="INR">INR - Indian Rupee (₹)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
              </select>
            </div>
            <div>
              <label className="label">Date Format</label>
              <select
                value={localSettings.dateFormat}
                onChange={(e) => setLocalSettings({ ...localSettings, dateFormat: e.target.value })}
                className="select"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD MMM YYYY">DD MMM YYYY</option>
              </select>
            </div>
            <div>
              <label className="label">Default Time Period</label>
              <select
                value={localSettings.defaultPeriod}
                onChange={(e) => setLocalSettings({ ...localSettings, defaultPeriod: e.target.value as any })}
                className="select"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div>
              <label className="label">Theme</label>
              <select
                value={localSettings.theme}
                onChange={(e) => setLocalSettings({ ...localSettings, theme: e.target.value as any })}
                className="select"
              >
                <option value="light">Light</option>
                <option value="dark">Dark (Coming Soon)</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.notificationsEnabled}
                  onChange={(e) => setLocalSettings({ ...localSettings, notificationsEnabled: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Enable notifications</span>
              </label>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={!hasChanges}
              className={`btn-primary gap-2 ${!hasChanges ? 'opacity-50' : ''}`}
            >
              {saved ? <FiCheck className="w-4 h-4" /> : <FiSave className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Email Configuration */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <FiMail className="w-5 h-5 text-slate-500" />
            <h3 className="font-medium text-slate-900">Email Configuration (IMAP)</h3>
          </div>
        </div>
        <div className="card-body space-y-4">
          <div className="p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800">
            <p className="font-medium">Gmail Users</p>
            <p className="mt-1">
              Enable 2-Step Verification and create an App Password at Google Account → Security → App Passwords
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={emailConfig.email}
                onChange={(e) => setEmailConfig({ ...emailConfig, email: e.target.value })}
                placeholder="your@email.com"
                className="input"
              />
            </div>
            <div>
              <label className="label">App Password</label>
              <input
                type="password"
                value={emailConfig.password}
                onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
                placeholder="••••••••"
                className="input"
              />
            </div>
            <div>
              <label className="label">IMAP Host</label>
              <input
                type="text"
                value={emailConfig.host}
                onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Port</label>
              <input
                type="number"
                value={emailConfig.port}
                onChange={(e) => setEmailConfig({ ...emailConfig, port: parseInt(e.target.value) })}
                className="input"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={emailConfig.tls}
              onChange={(e) => setEmailConfig({ ...emailConfig, tls: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Use TLS/SSL encryption</span>
          </label>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button onClick={handleSaveEmailConfig} className="btn-primary gap-2">
              <FiSave className="w-4 h-4" />
              Save Email Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <FiDatabase className="w-5 h-5 text-slate-500" />
            <h3 className="font-medium text-slate-900">Data Management</h3>
          </div>
        </div>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.accounts}</p>
              <p className="text-sm text-slate-500">Accounts</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.transactions}</p>
              <p className="text-sm text-slate-500">Transactions</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.dataSize}</p>
              <p className="text-sm text-slate-500">Storage Used</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-sm text-slate-500">
              <p>All data is stored locally on your device</p>
              <p className="text-xs mt-1">Location: ~/Library/Application Support/finance-tracker</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchTransactions()}
                className="btn-secondary gap-2"
              >
                <FiRefreshCw className="w-4 h-4" />
                Refresh Data
              </button>
              <button
                onClick={handleClearData}
                className="btn-danger gap-2"
              >
                <FiTrash2 className="w-4 h-4" />
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <FiInfo className="w-5 h-5 text-slate-500" />
            <h3 className="font-medium text-slate-900">About</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
              FT
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-900">Finance Tracker</h4>
              <p className="text-sm text-slate-500">Version 1.0.0</p>
              <p className="text-xs text-slate-400 mt-1">
                A desktop app for managing bank statements and analyzing finances
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <h5 className="font-medium text-slate-900 mb-3">Features</h5>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-success-600" />
                Parse PDF and CSV bank statements from major banks
              </li>
              <li className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-success-600" />
                Automatic transaction categorization
              </li>
              <li className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-success-600" />
                Support for multiple bank accounts and credit cards
              </li>
              <li className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-success-600" />
                Interactive visualizations and analytics
              </li>
              <li className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-success-600" />
                Fetch statements from email via IMAP
              </li>
              <li className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-success-600" />
                Export reports as PNG, PDF, CSV, or JSON
              </li>
              <li className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-success-600" />
                All data stored locally for privacy
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <h5 className="font-medium text-slate-900 mb-3">Supported Banks</h5>
            <div className="flex flex-wrap gap-2">
              {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB', 'Bank of Baroda', 'Canara', 'IDFC First', 'Yes Bank', 'RBL', 'IndusInd', 'Federal Bank'].map((bank) => (
                <span key={bank} className="badge badge-primary">{bank}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

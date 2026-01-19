import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStore } from '../store/useStore';
import { useApi } from '../hooks/useApi';
import { FiUploadCloud, FiFile, FiCheckCircle, FiAlertCircle, FiTrash2, FiMail, FiPlus } from 'react-icons/fi';
import Modal from '../components/Modal';

interface UploadedFile {
  file: {
    name: string;
    size: number;
    path: string;
  };
  status: 'pending' | 'processing' | 'success' | 'error';
  transactionCount?: number;
  error?: string;
}

const Upload: React.FC = () => {
  const { accounts } = useStore();
  const { openFileDialog, parseFile, createAccount, configureEmail, fetchEmailStatements, getEmailConfig } = useApi();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    bankName: '',
    accountNumber: '',
    type: 'bank' as 'bank' | 'credit_card',
    currency: 'INR',
    color: '#3b82f6',
  });
  const [emailConfig, setEmailConfig] = useState({
    email: '',
    password: '',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedAccountId) {
      alert('Please select an account first');
      return;
    }

    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) return;

    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      file: {
        name: file.name,
        size: file.size,
        path: (file as any).path || file.name,
      },
      status: 'pending' as const,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Process files
    for (let i = 0; i < newFiles.length; i++) {
      const fileIndex = uploadedFiles.length + i;
      setUploadedFiles((prev) => {
        const updated = [...prev];
        if (updated[fileIndex]) {
          updated[fileIndex] = { ...updated[fileIndex], status: 'processing' };
        }
        return updated;
      });

      try {
        const result = await parseFile(newFiles[i].file.path, selectedAccountId, account.type);
        
        setUploadedFiles((prev) => {
          const updated = [...prev];
          if (result.success) {
            updated[fileIndex] = {
              ...updated[fileIndex],
              status: 'success',
              transactionCount: result.count,
            };
          } else {
            updated[fileIndex] = {
              ...updated[fileIndex],
              status: 'error',
              error: result.error,
            };
          }
          return updated;
        });
      } catch (error: any) {
        setUploadedFiles((prev) => {
          const updated = [...prev];
          updated[fileIndex] = {
            ...updated[fileIndex],
            status: 'error',
            error: error.message,
          };
          return updated;
        });
      }
    }
  }, [selectedAccountId, accounts, parseFile, uploadedFiles.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  const handleBrowseFiles = async () => {
    if (!selectedAccountId) {
      alert('Please select an account first');
      return;
    }

    const filePaths = await openFileDialog();
    if (filePaths && filePaths.length > 0) {
      const account = accounts.find(a => a.id === selectedAccountId);
      if (!account) return;

      const newFiles: UploadedFile[] = filePaths.map((path) => ({
        file: {
          name: path.split('/').pop() || path,
          size: 0,
          path,
        },
        status: 'pending' as const,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Process files
      for (let i = 0; i < newFiles.length; i++) {
        const fileIndex = uploadedFiles.length + i;
        setUploadedFiles((prev) => {
          const updated = [...prev];
          if (updated[fileIndex]) {
            updated[fileIndex] = { ...updated[fileIndex], status: 'processing' };
          }
          return updated;
        });

        try {
          const result = await parseFile(newFiles[i].file.path, selectedAccountId, account.type);
          
          setUploadedFiles((prev) => {
            const updated = [...prev];
            if (result.success) {
              updated[fileIndex] = {
                ...updated[fileIndex],
                status: 'success',
                transactionCount: result.count,
              };
            } else {
              updated[fileIndex] = {
                ...updated[fileIndex],
                status: 'error',
                error: result.error,
              };
            }
            return updated;
          });
        } catch (error: any) {
          setUploadedFiles((prev) => {
            const updated = [...prev];
            updated[fileIndex] = {
              ...updated[fileIndex],
              status: 'error',
              error: error.message,
            };
            return updated;
          });
        }
      }
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccount.name || !newAccount.bankName) {
      alert('Please fill in all required fields');
      return;
    }

    await createAccount(newAccount);
    setShowNewAccountModal(false);
    setNewAccount({
      name: '',
      bankName: '',
      accountNumber: '',
      type: 'bank',
      currency: 'INR',
      color: '#3b82f6',
    });
  };

  const handleFetchFromEmail = async () => {
    if (!emailConfig.email || !emailConfig.password) {
      alert('Please enter email credentials');
      return;
    }

    try {
      await configureEmail(emailConfig);
      const result = await fetchEmailStatements(emailConfig);
      if (result.success) {
        alert(`Found ${result.attachments?.length || 0} bank statements in your email`);
      } else {
        alert('Failed to fetch statements: ' + result.error);
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
    setShowEmailModal(false);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Upload Bank Statements</h2>
          <p className="text-sm text-slate-500">Import transactions from PDF or CSV files</p>
        </div>
        <button onClick={() => setShowEmailModal(true)} className="btn-secondary gap-2">
          <FiMail className="w-4 h-4" />
          Fetch from Email
        </button>
      </div>

      {/* Account Selection */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="label">Select Account</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="select"
              >
                <option value="">Choose an account...</option>
                <optgroup label="Bank Accounts">
                  {accounts.filter(a => a.type === 'bank').map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name} - {acc.bankName}</option>
                  ))}
                </optgroup>
                <optgroup label="Credit Cards">
                  {accounts.filter(a => a.type === 'credit_card').map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name} - {acc.bankName}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <button onClick={() => setShowNewAccountModal(true)} className="btn-primary gap-2">
              <FiPlus className="w-4 h-4" />
              Add Account
            </button>
          </div>
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${!selectedAccountId ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={!selectedAccountId} />
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
            <FiUploadCloud className="w-8 h-8 text-primary-500" />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-900">
              {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              or <button onClick={handleBrowseFiles} className="text-primary-600 hover:underline">browse files</button>
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Supported formats: PDF, CSV, XLS, XLSX
          </p>
        </div>
      </div>

      {/* Supported Banks */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-medium text-slate-900">Supported Banks</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB', 'Bank of Baroda', 'Canara'].map((bank) => (
              <div key={bank} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-xs font-bold text-primary-600">
                  {bank.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{bank}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Can't find your bank? The generic parser will attempt to extract transactions from any statement format.
          </p>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-medium text-slate-900">Uploaded Files</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    file.status === 'success' ? 'bg-success-50' :
                    file.status === 'error' ? 'bg-danger-50' :
                    file.status === 'processing' ? 'bg-primary-50' :
                    'bg-slate-50'
                  }`}>
                    {file.status === 'success' && <FiCheckCircle className="w-5 h-5 text-success-600" />}
                    {file.status === 'error' && <FiAlertCircle className="w-5 h-5 text-danger-500" />}
                    {file.status === 'processing' && <div className="spinner" />}
                    {file.status === 'pending' && <FiFile className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{file.file.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(file.file.size)}
                      {file.status === 'success' && ` • ${file.transactionCount} transactions imported`}
                      {file.status === 'error' && ` • ${file.error}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => removeFile(index)} className="btn-icon text-slate-400 hover:text-danger-500">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Account Modal */}
      {showNewAccountModal && (
        <Modal title="Add New Account" onClose={() => setShowNewAccountModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Account Name *</label>
              <input
                type="text"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                placeholder="e.g., Primary Savings"
                className="input"
              />
            </div>
            <div>
              <label className="label">Bank Name *</label>
              <input
                type="text"
                value={newAccount.bankName}
                onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                placeholder="e.g., HDFC Bank"
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Account Number</label>
                <input
                  type="text"
                  value={newAccount.accountNumber}
                  onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                  placeholder="XXXX1234"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Account Type</label>
                <select
                  value={newAccount.type}
                  onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as 'bank' | 'credit_card' })}
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
                  value={newAccount.currency}
                  onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value })}
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
                <div className="flex gap-2">
                  {['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewAccount({ ...newAccount, color })}
                      className={`w-8 h-8 rounded-lg ${newAccount.color === color ? 'ring-2 ring-offset-2 ring-slate-900' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button onClick={() => setShowNewAccountModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleCreateAccount} className="btn-primary">
              Add Account
            </button>
          </div>
        </Modal>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <Modal title="Fetch Statements from Email" onClose={() => setShowEmailModal(false)}>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800">
              <p className="font-medium">Gmail Users</p>
              <p className="mt-1">
                To use Gmail, enable 2FA and generate an App Password at:
                <br />
                Google Account → Security → App Passwords
              </p>
            </div>
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
              <label className="label">Password / App Password</label>
              <input
                type="password"
                value={emailConfig.password}
                onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
                placeholder="••••••••"
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={emailConfig.tls}
                onChange={(e) => setEmailConfig({ ...emailConfig, tls: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Use TLS/SSL</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button onClick={() => setShowEmailModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleFetchFromEmail} className="btn-primary">
              Fetch Statements
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Upload;

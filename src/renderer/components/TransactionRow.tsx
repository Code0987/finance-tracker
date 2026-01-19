import React from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDate, getCategoryIcon, getCategoryColor, truncateText } from '../utils/formatters';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

interface TransactionRowProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onEdit,
  onDelete,
  compact = false,
}) => {
  return (
    <div className={`flex items-center justify-between ${compact ? 'p-3' : 'p-4'} hover:bg-slate-50 group transition-colors`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Category Icon */}
        <div 
          className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg flex items-center justify-center flex-shrink-0`}
          style={{ backgroundColor: `${getCategoryColor(transaction.category)}15` }}
        >
          <span className={compact ? 'text-base' : 'text-lg'}>
            {getCategoryIcon(transaction.category)}
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-slate-900 truncate ${compact ? 'text-sm' : ''}`}>
              {truncateText(transaction.description, compact ? 30 : 50)}
            </span>
            {transaction.accountType && (
              <span className={`badge text-xs ${transaction.accountType === 'bank' ? 'account-type-bank' : 'account-type-credit_card'}`}>
                {transaction.accountName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500">
              {formatDate(transaction.date, 'dd MMM yyyy')}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">
              {transaction.category}
            </span>
            {transaction.mode && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-400">
                  {transaction.mode}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <span className={`font-semibold ${compact ? 'text-sm' : ''} ${
            transaction.type === 'credit' ? 'text-success-600' : 'text-slate-900'
          }`}>
            {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
          </span>
          {transaction.balance !== null && !compact && (
            <p className="text-xs text-slate-400">
              Bal: {formatCurrency(transaction.balance)}
            </p>
          )}
        </div>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={() => onEdit(transaction)}
                className="btn-icon p-1.5"
                title="Edit"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(transaction.id)}
                className="btn-icon p-1.5 text-danger-500 hover:bg-danger-50"
                title="Delete"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionRow;

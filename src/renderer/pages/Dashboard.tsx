import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatPercentage, getCategoryIcon, getCategoryColor, getMonthName } from '../utils/formatters';
import { ExpenseByCategory, IncomeVsExpense, Merchant, SavingsData, CashFlow } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiCreditCard, FiArrowUp, FiArrowDown } from 'react-icons/fi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard: React.FC = () => {
  const { summary, accounts, transactions } = useStore();
  const {
    fetchExpensesByCategory,
    fetchIncomeVsExpenses,
    fetchTopMerchants,
    fetchSavingsOverTime,
    fetchCashFlow,
  } = useApi();

  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([]);
  const [incomeVsExpenses, setIncomeVsExpenses] = useState<IncomeVsExpense[]>([]);
  const [topMerchants, setTopMerchants] = useState<Merchant[]>([]);
  const [savingsData, setSavingsData] = useState<SavingsData[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);

  useEffect(() => {
    const loadChartData = async () => {
      try {
        const [categories, incomeExp, merchants, savings, flow] = await Promise.all([
          fetchExpensesByCategory(),
          fetchIncomeVsExpenses('monthly'),
          fetchTopMerchants(5),
          fetchSavingsOverTime(),
          fetchCashFlow(),
        ]);
        setExpensesByCategory(categories);
        setIncomeVsExpenses(incomeExp);
        setTopMerchants(merchants);
        setSavingsData(savings);
        setCashFlow(flow);
      } catch (error) {
        console.error('Failed to load chart data:', error);
      }
    };
    loadChartData();
  }, []);

  // Summary stats
  const stats = [
    {
      label: 'Total Income',
      value: formatCurrency(summary?.totalIncome || 0),
      icon: FiArrowDown,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(summary?.totalExpenses || 0),
      icon: FiArrowUp,
      color: 'text-danger-500',
      bgColor: 'bg-danger-50',
    },
    {
      label: 'Net Savings',
      value: formatCurrency(summary?.netSavings || 0),
      icon: FiDollarSign,
      color: summary?.netSavings && summary.netSavings > 0 ? 'text-success-600' : 'text-danger-500',
      bgColor: summary?.netSavings && summary.netSavings > 0 ? 'bg-success-50' : 'bg-danger-50',
    },
    {
      label: 'Savings Rate',
      value: formatPercentage(summary?.savingsRate || 0),
      icon: summary?.savingsRate && summary.savingsRate > 0 ? FiTrendingUp : FiTrendingDown,
      color: summary?.savingsRate && summary.savingsRate > 0 ? 'text-success-600' : 'text-danger-500',
      bgColor: summary?.savingsRate && summary.savingsRate > 0 ? 'bg-success-50' : 'bg-danger-50',
    },
  ];

  // Expense by Category chart data
  const categoryChartData = {
    labels: expensesByCategory.map(e => e.category),
    datasets: [{
      data: expensesByCategory.map(e => e.totalExpense),
      backgroundColor: expensesByCategory.map(e => getCategoryColor(e.category)),
      borderWidth: 0,
    }],
  };

  // Income vs Expenses chart data
  const incomeExpenseChartData = {
    labels: incomeVsExpenses.map(d => getMonthName(d.period)),
    datasets: [
      {
        label: 'Income',
        data: incomeVsExpenses.map(d => d.income),
        backgroundColor: '#22c55e',
      },
      {
        label: 'Expenses',
        data: incomeVsExpenses.map(d => d.expenses),
        backgroundColor: '#ef4444',
      },
      {
        label: 'Investments',
        data: incomeVsExpenses.map(d => d.investments),
        backgroundColor: '#3b82f6',
      },
    ],
  };

  // Savings over time chart
  const savingsChartData = {
    labels: savingsData.map(d => getMonthName(d.month)),
    datasets: [
      {
        label: 'Monthly Savings',
        data: savingsData.map(d => d.savings),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Cumulative Savings',
        data: savingsData.map(d => d.cumulativeSavings),
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
      },
    ],
  };

  // Cash flow chart
  const cashFlowChartData = {
    labels: cashFlow.map(d => getMonthName(d.month)),
    datasets: [
      {
        label: 'Net Flow',
        data: cashFlow.map(d => d.netFlow),
        borderColor: '#8b5cf6',
        backgroundColor: cashFlow.map(d => d.netFlow >= 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'),
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">{stat.label}</p>
                <p className={`stat-value ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts Overview */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-medium text-slate-900">Accounts</h3>
          </div>
          <div className="card-body">
            {accounts.length === 0 ? (
              <p className="text-sm text-slate-500">No accounts added yet</p>
            ) : (
              <div className="space-y-3">
                {accounts.slice(0, 5).map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: account.color }}
                      >
                        {account.type === 'bank' ? <FiDollarSign /> : <FiCreditCard />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{account.name}</p>
                        <p className="text-xs text-slate-500">{account.bankName}</p>
                      </div>
                    </div>
                    <span className={`badge ${account.type === 'bank' ? 'account-type-bank' : 'account-type-credit_card'}`}>
                      {account.type === 'bank' ? 'Bank' : 'Credit Card'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expense by Category (Doughnut) */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="font-medium text-slate-900">Expenses by Category</h3>
          </div>
          <div className="card-body">
            <div className="flex gap-6">
              <div className="w-64 h-64">
                <Doughnut 
                  data={categoryChartData} 
                  options={{
                    ...chartOptions,
                    cutout: '65%',
                    plugins: {
                      legend: { display: false },
                    },
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {expensesByCategory.slice(0, 6).map((cat, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(cat.category)}</span>
                        <span className="text-sm font-medium">{cat.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(cat.totalExpense)}</p>
                        <p className="text-xs text-slate-500">{cat.transactionCount} txns</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-medium text-slate-900">Income vs Expenses</h3>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <Bar data={incomeExpenseChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Savings Over Time */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-medium text-slate-900">Savings Over Time</h3>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <Line data={savingsChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Cash Flow */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-medium text-slate-900">Cash Flow</h3>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <Bar 
                data={cashFlowChartData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: { display: false },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Top Merchants */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-medium text-slate-900">Top Merchants</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {topMerchants.map((merchant, index) => {
                const maxSpent = topMerchants[0]?.totalSpent || 1;
                const percentage = (merchant.totalSpent / maxSpent) * 100;
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {merchant.merchant}
                      </span>
                      <span className="text-sm text-slate-600">
                        {formatCurrency(merchant.totalSpent)}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill"
                        style={{ width: `${percentage}%`, backgroundColor: getCategoryColor(merchant.category) }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-500">
                        {getCategoryIcon(merchant.category)} {merchant.category}
                      </span>
                      <span className="text-xs text-slate-500">
                        {merchant.transactionCount} transactions
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-medium text-slate-900">Recent Transactions</h3>
          <a href="/transactions" className="text-sm text-primary-600 hover:text-primary-700">
            View all →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Account</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 5).map((txn) => (
                <tr key={txn.id}>
                  <td className="whitespace-nowrap">{txn.date}</td>
                  <td className="max-w-xs truncate">{txn.description}</td>
                  <td>
                    <span className="inline-flex items-center gap-1">
                      <span>{getCategoryIcon(txn.category)}</span>
                      <span>{txn.category}</span>
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${txn.accountType === 'bank' ? 'account-type-bank' : 'account-type-credit_card'}`}>
                      {txn.accountName}
                    </span>
                  </td>
                  <td className={`text-right font-medium ${txn.type === 'credit' ? 'text-success-600' : 'text-danger-500'}`}>
                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

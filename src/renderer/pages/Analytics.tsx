import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatPercentage, getCategoryColor, getCategoryIcon, getMonthName } from '../utils/formatters';
import { ExpenseByCategory, IncomeVsExpense, Merchant, SpendingTrend, SavingsData, CashFlow, Period } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line, PolarArea } from 'react-chartjs-2';
import { FiDownload, FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

type TabType = 'overview' | 'categories' | 'trends' | 'cashflow' | 'merchants';

const Analytics: React.FC = () => {
  const { accounts, dateRange } = useStore();
  const {
    fetchExpensesByCategory,
    fetchIncomeVsExpenses,
    fetchTopMerchants,
    fetchSpendingTrends,
    fetchSavingsOverTime,
    fetchCashFlow,
  } = useApi();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [period, setPeriod] = useState<Period>('monthly');
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('');

  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([]);
  const [incomeVsExpenses, setIncomeVsExpenses] = useState<IncomeVsExpense[]>([]);
  const [topMerchants, setTopMerchants] = useState<Merchant[]>([]);
  const [spendingTrends, setSpendingTrends] = useState<SpendingTrend[]>([]);
  const [savingsData, setSavingsData] = useState<SavingsData[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  const filters = {
    accountId: accountFilter || undefined,
    accountType: accountTypeFilter || undefined,
  };

  useEffect(() => {
    loadData();
  }, [period, accountFilter, accountTypeFilter, dateRange]);

  const loadData = async () => {
    try {
      const [categories, incomeExp, merchants, trends, savings, flow] = await Promise.all([
        fetchExpensesByCategory(filters),
        fetchIncomeVsExpenses(period, filters),
        fetchTopMerchants(10, filters),
        fetchSpendingTrends(filters),
        fetchSavingsOverTime(filters),
        fetchCashFlow(filters),
      ]);
      setExpensesByCategory(categories);
      setIncomeVsExpenses(incomeExp);
      setTopMerchants(merchants);
      setSpendingTrends(trends);
      setSavingsData(savings);
      setCashFlow(flow);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  };

  const exportChart = async (format: 'png' | 'pdf') => {
    if (!chartContainerRef.current) return;

    const canvas = await html2canvas(chartContainerRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    });

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `finance-analytics-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`finance-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  const totalExpenses = expensesByCategory.reduce((sum, c) => sum + c.totalExpense, 0);

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  // Category Doughnut Chart
  const categoryChartData = {
    labels: expensesByCategory.map(e => e.category),
    datasets: [{
      data: expensesByCategory.map(e => e.totalExpense),
      backgroundColor: expensesByCategory.map(e => getCategoryColor(e.category)),
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  };

  // Income vs Expenses Bar Chart
  const incomeExpenseChartData = {
    labels: incomeVsExpenses.map(d => period === 'yearly' ? d.period : getMonthName(d.period)),
    datasets: [
      {
        label: 'Income',
        data: incomeVsExpenses.map(d => d.income),
        backgroundColor: '#22c55e',
        borderRadius: 4,
      },
      {
        label: 'Expenses',
        data: incomeVsExpenses.map(d => d.expenses),
        backgroundColor: '#ef4444',
        borderRadius: 4,
      },
      {
        label: 'Investments',
        data: incomeVsExpenses.map(d => d.investments),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
    ],
  };

  // Savings Line Chart
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

  // Cash Flow Chart
  const cashFlowChartData = {
    labels: cashFlow.map(d => getMonthName(d.month)),
    datasets: [
      {
        label: 'Inflow',
        data: cashFlow.map(d => d.inflow),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        fill: false,
      },
      {
        label: 'Outflow',
        data: cashFlow.map(d => d.outflow),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        fill: false,
      },
      {
        label: 'Net Flow',
        data: cashFlow.map(d => d.netFlow),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        fill: true,
      },
    ],
  };

  // Category Polar Area Chart
  const categoryPolarData = {
    labels: expensesByCategory.slice(0, 8).map(e => e.category),
    datasets: [{
      data: expensesByCategory.slice(0, 8).map(e => e.totalExpense),
      backgroundColor: expensesByCategory.slice(0, 8).map(e => getCategoryColor(e.category) + '80'),
      borderColor: expensesByCategory.slice(0, 8).map(e => getCategoryColor(e.category)),
      borderWidth: 2,
    }],
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'categories', label: 'Categories' },
    { id: 'trends', label: 'Trends' },
    { id: 'cashflow', label: 'Cash Flow' },
    { id: 'merchants', label: 'Merchants' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Analytics</h2>
          <p className="text-sm text-slate-500">Detailed financial insights and visualizations</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="select text-sm"
          >
            <option value="">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
          <select
            value={accountTypeFilter}
            onChange={(e) => setAccountTypeFilter(e.target.value)}
            className="select text-sm"
          >
            <option value="">All Types</option>
            <option value="bank">Bank Accounts</option>
            <option value="credit_card">Credit Cards</option>
          </select>
          <div className="relative group">
            <button className="btn-secondary gap-2">
              <FiDownload className="w-4 h-4" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button
                onClick={() => exportChart('png')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
              >
                Export as PNG
              </button>
              <button
                onClick={() => exportChart('pdf')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
              >
                Export as PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts Container */}
      <div ref={chartContainerRef} className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income vs Expenses */}
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h3 className="font-medium text-slate-900">Income vs Expenses</h3>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as Period)}
                  className="select text-sm w-32"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="card-body">
                <div className="chart-container-lg">
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
                <div className="chart-container-lg">
                  <Line data={savingsChartData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Expense by Category */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-medium text-slate-900">Expense Distribution</h3>
              </div>
              <div className="card-body">
                <div className="chart-container-lg">
                  <Doughnut 
                    data={categoryChartData} 
                    options={{
                      ...chartOptions,
                      cutout: '60%',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Cash Flow Summary */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-medium text-slate-900">Cash Flow</h3>
              </div>
              <div className="card-body">
                <div className="chart-container-lg">
                  <Line data={cashFlowChartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Polar Area Chart */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-medium text-slate-900">Category Comparison</h3>
              </div>
              <div className="card-body">
                <div className="chart-container-lg">
                  <PolarArea data={categoryPolarData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Category List */}
            <div className="card lg:col-span-2">
              <div className="card-header">
                <h3 className="font-medium text-slate-900">Expense by Category</h3>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {expensesByCategory.map((cat, index) => {
                    const percentage = (cat.totalExpense / totalExpenses) * 100;
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getCategoryIcon(cat.category)}</span>
                            <span className="font-medium">{cat.category}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">{formatCurrency(cat.totalExpense)}</span>
                            <span className="text-sm text-slate-500 ml-2">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="progress-bar h-3">
                          <div 
                            className="progress-bar-fill rounded-full"
                            style={{ 
                              width: `${percentage}%`, 
                              backgroundColor: getCategoryColor(cat.category) 
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{cat.transactionCount} transactions</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="font-medium text-slate-900">Spending Trends (vs Previous Period)</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {spendingTrends.map((trend, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getCategoryIcon(trend.category)}</span>
                          <span className="font-medium text-sm">{trend.category}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${
                          trend.trend === 'up' ? 'text-danger-500' : 
                          trend.trend === 'down' ? 'text-success-600' : 
                          'text-slate-500'
                        }`}>
                          {trend.trend === 'up' && <FiTrendingUp className="w-4 h-4" />}
                          {trend.trend === 'down' && <FiTrendingDown className="w-4 h-4" />}
                          {trend.trend === 'stable' && <FiMinus className="w-4 h-4" />}
                          <span className="text-sm font-medium">{formatPercentage(trend.change)}</span>
                        </div>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs text-slate-500">Current</p>
                          <p className="text-lg font-bold">{formatCurrency(trend.currentAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Previous</p>
                          <p className="text-sm text-slate-600">{formatCurrency(trend.previousAmount)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Savings Trend */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-medium text-slate-900">Monthly Savings Trend</h3>
              </div>
              <div className="card-body">
                <div className="chart-container-lg">
                  <Bar 
                    data={{
                      labels: savingsData.map(d => getMonthName(d.month)),
                      datasets: [{
                        label: 'Monthly Savings',
                        data: savingsData.map(d => d.savings),
                        backgroundColor: savingsData.map(d => d.savings >= 0 ? '#22c55e' : '#ef4444'),
                        borderRadius: 4,
                      }],
                    }}
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
          </div>
        )}

        {/* Cash Flow Tab */}
        {activeTab === 'cashflow' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cashFlow.length > 0 && (
                <>
                  <div className="stat-card">
                    <p className="stat-label">Total Inflow</p>
                    <p className="stat-value text-success-600">
                      {formatCurrency(cashFlow.reduce((sum, c) => sum + c.inflow, 0))}
                    </p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-label">Total Outflow</p>
                    <p className="stat-value text-danger-500">
                      {formatCurrency(cashFlow.reduce((sum, c) => sum + c.outflow, 0))}
                    </p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-label">Net Position</p>
                    <p className={`stat-value ${cashFlow[cashFlow.length - 1]?.runningBalance >= 0 ? 'text-success-600' : 'text-danger-500'}`}>
                      {formatCurrency(cashFlow[cashFlow.length - 1]?.runningBalance || 0)}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="font-medium text-slate-900">Cash Flow Analysis</h3>
              </div>
              <div className="card-body">
                <div className="chart-container-lg">
                  <Line data={cashFlowChartData} options={chartOptions} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="font-medium text-slate-900">Monthly Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th className="text-right">Inflow</th>
                      <th className="text-right">Outflow</th>
                      <th className="text-right">Net Flow</th>
                      <th className="text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlow.map((row, index) => (
                      <tr key={index}>
                        <td className="font-medium">{getMonthName(row.month)}</td>
                        <td className="text-right text-success-600">{formatCurrency(row.inflow)}</td>
                        <td className="text-right text-danger-500">{formatCurrency(row.outflow)}</td>
                        <td className={`text-right font-medium ${row.netFlow >= 0 ? 'text-success-600' : 'text-danger-500'}`}>
                          {row.netFlow >= 0 ? '+' : ''}{formatCurrency(row.netFlow)}
                        </td>
                        <td className={`text-right ${row.runningBalance >= 0 ? 'text-slate-900' : 'text-danger-500'}`}>
                          {formatCurrency(row.runningBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Merchants Tab */}
        {activeTab === 'merchants' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">
                <h3 className="font-medium text-slate-900">Top Spending Merchants</h3>
              </div>
              <div className="card-body">
                <div className="chart-container-lg">
                  <Bar
                    data={{
                      labels: topMerchants.slice(0, 10).map(m => m.merchant.length > 15 ? m.merchant.slice(0, 15) + '...' : m.merchant),
                      datasets: [{
                        label: 'Total Spent',
                        data: topMerchants.slice(0, 10).map(m => m.totalSpent),
                        backgroundColor: topMerchants.slice(0, 10).map(m => getCategoryColor(m.category)),
                        borderRadius: 4,
                      }],
                    }}
                    options={{
                      ...chartOptions,
                      indexAxis: 'y' as const,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: { display: false },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="font-medium text-slate-900">Merchant Details</h3>
              </div>
              <div className="card-body">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {topMerchants.map((merchant, index) => {
                    const maxSpent = topMerchants[0]?.totalSpent || 1;
                    const percentage = (merchant.totalSpent / maxSpent) * 100;
                    return (
                      <div key={index} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-400">#{index + 1}</span>
                            <span className="font-medium truncate max-w-[200px]">{merchant.merchant}</span>
                          </div>
                          <span className="font-bold">{formatCurrency(merchant.totalSpent)}</span>
                        </div>
                        <div className="progress-bar h-2">
                          <div 
                            className="progress-bar-fill"
                            style={{ width: `${percentage}%`, backgroundColor: getCategoryColor(merchant.category) }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                          <span>{getCategoryIcon(merchant.category)} {merchant.category}</span>
                          <span>{merchant.transactionCount} transactions</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;

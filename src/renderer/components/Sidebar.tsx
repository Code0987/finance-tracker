import React from 'react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  FiHome,
  FiList,
  FiUpload,
  FiCreditCard,
  FiPieChart,
  FiTag,
  FiSettings,
  FiChevronLeft,
  FiDollarSign,
} from 'react-icons/fi';

const navItems = [
  { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
  { path: '/transactions', icon: FiList, label: 'Transactions' },
  { path: '/upload', icon: FiUpload, label: 'Upload' },
  { path: '/accounts', icon: FiCreditCard, label: 'Accounts' },
  { path: '/analytics', icon: FiPieChart, label: 'Analytics' },
  { path: '/categories', icon: FiTag, label: 'Categories' },
  { path: '/settings', icon: FiSettings, label: 'Settings' },
];

const Sidebar: React.FC = () => {
  const { isSidebarOpen, toggleSidebar } = useStore();

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <FiDollarSign className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-semibold">Finance Tracker</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-400">
          <p>Version 1.0.0</p>
          <p className="mt-1">All data stored locally</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

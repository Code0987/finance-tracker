import React from 'react';
import { IconType } from 'react-icons';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: IconType;
  change?: number;
  changeLabel?: string;
  color?: 'default' | 'success' | 'danger' | 'warning' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  change,
  changeLabel,
  color = 'default',
  size = 'md',
}) => {
  const colorClasses = {
    default: {
      icon: 'text-slate-600',
      iconBg: 'bg-slate-100',
      value: 'text-slate-900',
    },
    success: {
      icon: 'text-success-600',
      iconBg: 'bg-success-50',
      value: 'text-success-600',
    },
    danger: {
      icon: 'text-danger-500',
      iconBg: 'bg-danger-50',
      value: 'text-danger-500',
    },
    warning: {
      icon: 'text-warning-600',
      iconBg: 'bg-warning-50',
      value: 'text-warning-600',
    },
    primary: {
      icon: 'text-primary-600',
      iconBg: 'bg-primary-50',
      value: 'text-primary-600',
    },
  };

  const sizeClasses = {
    sm: {
      card: 'p-4',
      icon: 'w-8 h-8',
      iconSize: 'w-4 h-4',
      value: 'text-lg',
      label: 'text-xs',
    },
    md: {
      card: 'p-6',
      icon: 'w-12 h-12',
      iconSize: 'w-6 h-6',
      value: 'text-2xl',
      label: 'text-sm',
    },
    lg: {
      card: 'p-8',
      icon: 'w-16 h-16',
      iconSize: 'w-8 h-8',
      value: 'text-3xl',
      label: 'text-base',
    },
  };

  const colors = colorClasses[color];
  const sizes = sizeClasses[size];

  return (
    <div className={`card ${sizes.card}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`${sizes.label} text-slate-500 mb-1`}>{label}</p>
          <p className={`${sizes.value} font-bold ${colors.value}`}>{value}</p>
          
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {change >= 0 ? (
                <FiTrendingUp className="w-4 h-4 text-success-600" />
              ) : (
                <FiTrendingDown className="w-4 h-4 text-danger-500" />
              )}
              <span className={`text-xs font-medium ${change >= 0 ? 'text-success-600' : 'text-danger-500'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-slate-400 ml-1">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`${sizes.icon} rounded-xl ${colors.iconBg} flex items-center justify-center`}>
            <Icon className={`${sizes.iconSize} ${colors.icon}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

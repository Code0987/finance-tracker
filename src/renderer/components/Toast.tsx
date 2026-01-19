import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 4000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  const typeConfig = {
    success: {
      icon: FiCheckCircle,
      bgColor: 'bg-success-50',
      borderColor: 'border-success-500',
      iconColor: 'text-success-600',
      textColor: 'text-success-800',
    },
    error: {
      icon: FiAlertCircle,
      bgColor: 'bg-danger-50',
      borderColor: 'border-danger-500',
      iconColor: 'text-danger-500',
      textColor: 'text-danger-800',
    },
    info: {
      icon: FiInfo,
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-500',
      iconColor: 'text-primary-600',
      textColor: 'text-primary-800',
    },
    warning: {
      icon: FiAlertCircle,
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-500',
      iconColor: 'text-warning-600',
      textColor: 'text-warning-800',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border-l-4 shadow-lg ${config.bgColor} ${config.borderColor} ${
        isVisible ? 'animate-slide-in' : 'opacity-0 translate-y-2'
      } transition-all duration-300`}
    >
      <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />
      <p className={`flex-1 text-sm ${config.textColor}`}>{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(id), 300);
        }}
        className="text-slate-400 hover:text-slate-600"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};

export default Toast;

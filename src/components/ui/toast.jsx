'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// Toast Context
const ToastContext = createContext(null);

// Toast types with icons and styles
const toastConfig = {
  success: {
    icon: CheckCircle2,
    className: 'bg-success/15 border-success/30 text-success',
    iconClassName: 'text-success',
  },
  error: {
    icon: AlertCircle,
    className: 'bg-destructive/15 border-destructive/30 text-destructive',
    iconClassName: 'text-destructive',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-warning/15 border-warning/30 text-warning',
    iconClassName: 'text-warning',
  },
  info: {
    icon: Info,
    className: 'bg-info/15 border-info/30 text-info',
    iconClassName: 'text-info',
  },
};

// Individual Toast Component
function Toast({ id, message, type = 'info', onDismiss }) {
  const config = toastConfig[type] || toastConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 w-full max-w-sm p-4 rounded-lg border shadow-lg',
        'animate-in slide-in-from-top-2 fade-in-0 duration-300',
        config.className
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', config.iconClassName)} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 rounded-full p-1 hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Toast Container
function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

// Toast Provider
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback({
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    info: (message, duration) => addToast(message, 'info', duration),
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast, addToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export { Toast, ToastContainer };

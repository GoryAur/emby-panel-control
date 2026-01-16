'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, Trash2, UserX, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ConfirmContext = createContext(null);

const iconMap = {
  danger: Trash2,
  warning: AlertTriangle,
  info: Info,
  disable: UserX,
};

const colorMap = {
  danger: 'text-destructive',
  warning: 'text-warning',
  info: 'text-info',
  disable: 'text-warning',
};

const buttonVariantMap = {
  danger: 'destructive',
  warning: 'warning',
  info: 'default',
  disable: 'warning',
};

function ConfirmDialog({ config, onConfirm, onCancel }) {
  if (!config) return null;

  const {
    title = 'Confirmar accion',
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'warning',
  } = config;

  const Icon = iconMap[type] || AlertTriangle;
  const iconColor = colorMap[type] || 'text-warning';
  const buttonVariant = buttonVariantMap[type] || 'default';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 fade-in-0 duration-200">
        <div className="p-6">
          {/* Icon */}
          <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4', `bg-${type === 'danger' ? 'destructive' : type}/10`)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>

          {/* Content */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-muted-foreground text-sm whitespace-pre-line">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              {cancelText}
            </Button>
            <Button
              variant={buttonVariant}
              className="flex-1"
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [resolveRef, setResolveRef] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfig(options);
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef?.(true);
    setConfig(null);
    setResolveRef(null);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    resolveRef?.(false);
    setConfig(null);
    setResolveRef(null);
  }, [resolveRef]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog config={config} onConfirm={handleConfirm} onCancel={handleCancel} />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

export { ConfirmDialog };

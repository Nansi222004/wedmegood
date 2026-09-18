import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

// Global Toast Context
const ToastContext = createContext(null);

// In-memory listener for standalone toast.* function calls
const toastListeners = new Set();
const dispatchGlobalToast = (message, type = 'success', duration = 3500) => {
  if (toastListeners.size === 0) {
    // Fallback if provider not yet mounted: keep for next tick or log in dev
    if (import.meta.env?.DEV) {
      console.warn('[Toast] Dispatched before ToastProvider mounted:', { message, type });
    }
    return;
  }
  toastListeners.forEach(listener => listener(message, type, duration));
};

/**
 * Standalone Toast API for direct function calls:
 * e.g. toast.success('Saved!'), toast.error('Failed')
 */
export const toast = {
  success: (message, duration = 3500) => dispatchGlobalToast(message, 'success', duration),
  error: (message, duration = 4500) => dispatchGlobalToast(message, 'error', duration),
  warning: (message, duration = 4000) => dispatchGlobalToast(message, 'warning', duration),
  info: (message, duration = 3500) => dispatchGlobalToast(message, 'info', duration),
};

const getToastConfig = (type) => {
  switch (type) {
    case 'success':
      return {
        bg: 'linear-gradient(135deg, #10b981, #059669)',
        icon: 'check',
        iconColor: 'white',
        className: 'toast-success border border-emerald-400/30 shadow-emerald-900/20'
      };
    case 'error':
      return {
        bg: 'linear-gradient(135deg, #ef4444, #dc2626)',
        icon: 'close',
        iconColor: 'white',
        className: 'toast-error border border-rose-400/30 shadow-rose-900/20'
      };
    case 'info':
      return {
        bg: 'linear-gradient(135deg, #4F35C3, #3f2aa6)',
        icon: 'lightbulb',
        iconColor: 'white',
        className: 'toast-info border border-indigo-400/30 shadow-indigo-900/20'
      };
    case 'warning':
      return {
        bg: 'linear-gradient(135deg, #f59e0b, #d97706)',
        icon: 'warning',
        iconColor: 'white',
        className: 'toast-warning border border-amber-400/30 shadow-amber-900/20'
      };
    default:
      return {
        bg: 'linear-gradient(135deg, #10b981, #059669)',
        icon: 'check',
        iconColor: 'white',
        className: 'toast-success border border-emerald-400/30 shadow-emerald-900/20'
      };
  }
};

/**
 * Toast Container component for rendering multiple stacked toasts
 */
const ToastContainer = ({ toasts, onRemove }) => {
  if (!toasts || toasts.length === 0) return null;

  return createPortal(
    <div 
      className="toast-container fixed top-5 right-5 z-[999999] pointer-events-none flex flex-col gap-2.5 max-w-sm w-full px-3 sm:px-0"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => {
        const config = getToastConfig(t.type);
        return (
          <div
            key={t.id}
            className={`toast-wrapper pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl text-white backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200 ${config.className}`}
            style={{ background: config.bg }}
          >
            <div className="toast-content flex items-center gap-2.5 min-w-0 flex-1">
              <div className="toast-icon shrink-0">
                <Icon name={config.icon} size="sm" style={{ color: config.iconColor }} />
              </div>
              <div className="toast-message text-xs sm:text-sm font-semibold leading-snug break-words">
                {t.message}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemove(t.id)}
              className="toast-close p-1 hover:bg-white/20 rounded-lg transition-colors shrink-0 cursor-pointer text-white/80 hover:text-white"
              aria-label="Close notification"
            >
              <Icon name="close" size="xs" style={{ color: config.iconColor }} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
};

/**
 * Toast Provider for root application
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast = { id, message, type, duration };

    setToasts(prev => {
      // Prevent immediate identical duplicate toast stacking
      const last = prev[prev.length - 1];
      if (last && last.message === message && last.type === type) {
        return prev;
      }
      // Cap at 4 active toasts max
      return [...prev.slice(-3), newToast];
    });

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  useEffect(() => {
    toastListeners.add(addToast);
    return () => {
      toastListeners.delete(addToast);
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showToast: addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * Backward-compatible useToast hook
 * Works both inside ToastProvider (global stack) and outside (local fallback)
 */
export const useToast = () => {
  const context = useContext(ToastContext);

  // Local fallback state if used outside of ToastProvider
  const [localToast, setLocalToast] = useState({
    isVisible: false,
    message: '',
    type: 'success',
    duration: 3500
  });

  if (context) {
    return {
      showToast: context.showToast,
      // When wrapped with ToastProvider, ToastComponent is a no-op since ToastContainer handles rendering
      ToastComponent: () => null,
      toast
    };
  }

  // Fallback for standalone usage
  const showToast = (message, type = 'success', duration = 3500) => {
    setLocalToast({
      isVisible: true,
      message,
      type,
      duration
    });
  };

  const hideToast = () => {
    setLocalToast(prev => ({ ...prev, isVisible: false }));
  };

  const ToastComponent = () => (
    <ToastContainer
      toasts={localToast.isVisible ? [{ id: 'local', ...localToast }] : []}
      onRemove={hideToast}
    />
  );

  return { showToast, ToastComponent, toast };
};

// Single Toast component retained for legacy prop usage
const Toast = ({ message, type = 'success', isVisible, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <ToastContainer
      toasts={[{ id: 'single', message, type }]}
      onRemove={onClose || (() => {})}
    />
  );
};

export default Toast;
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

const Toast = ({ message, type = 'success', isVisible, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getToastConfig = () => {
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

  const config = getToastConfig();

  return createPortal(
    <div className="toast-container fixed top-6 right-6 z-[99999] pointer-events-none flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      <div
        className={`toast-wrapper pointer-events-auto flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white backdrop-blur-md animate-in slide-in-from-top-4 duration-300 ${config.className}`}
        style={{
          background: config.bg
        }}
      >
        <div className="toast-content flex items-center gap-3 min-w-0 flex-1">
          <div className="toast-icon shrink-0">
            <Icon name={config.icon} size="sm" style={{ color: config.iconColor }} />
          </div>
          <div className="toast-message text-sm font-semibold leading-snug break-words">
            {message}
          </div>
        </div>
        <button
          onClick={onClose}
          className="toast-close p-1 hover:bg-white/20 rounded-lg transition-colors shrink-0 cursor-pointer"
          aria-label="Close notification"
        >
          <Icon name="close" size="xs" style={{ color: config.iconColor }} />
        </button>
      </div>
    </div>,
    document.body
  );
};

// Toast Hook for easy usage
export const useToast = () => {
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({
      isVisible: true,
      message,
      type,
      duration
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const ToastComponent = () => (
    <Toast
      message={toast.message}
      type={toast.type}
      isVisible={toast.isVisible}
      onClose={hideToast}
      duration={toast.duration}
    />
  );

  return { showToast, ToastComponent };
};

export default Toast;
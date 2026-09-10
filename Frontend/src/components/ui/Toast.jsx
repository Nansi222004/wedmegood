import { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import Icon from './Icon';

const Toast = ({ message, type = 'success', isVisible, onClose, duration = 3000 }) => {
  const { theme } = useTheme();

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
          className: 'toast-success'
        };
      case 'error':
        return {
          bg: 'linear-gradient(135deg, #ef4444, #dc2626)',
          icon: 'close',
          iconColor: 'white',
          className: 'toast-error'
        };
      case 'info':
        return {
          bg: `linear-gradient(135deg, ${theme.colors.primary[500]}, ${theme.colors.primary[600]})`,
          icon: 'lightbulb',
          iconColor: 'white',
          className: 'toast-info'
        };
      case 'warning':
        return {
          bg: 'linear-gradient(135deg, #f59e0b, #d97706)',
          icon: 'warning',
          iconColor: 'white',
          className: 'toast-warning'
        };
      default:
        return {
          bg: `linear-gradient(135deg, ${theme.colors.accent[500]}, ${theme.colors.accent[600]})`,
          icon: 'check',
          iconColor: 'white',
          className: 'toast-success'
        };
    }
  };

  const config = getToastConfig();

  return (
    <div className="toast-container">
      <div
        className={`toast-wrapper animate-slide-down ${config.className}`}
        style={{
          background: config.bg
        }}
      >
        <div className="toast-content">
          <div className="toast-icon">
            <Icon name={config.icon} size="sm" style={{ color: config.iconColor }} />
          </div>
          <div className="toast-message">
            {message}
          </div>
          <button
            onClick={onClose}
            className="toast-close"
          >
            <Icon name="close" size="xs" style={{ color: config.iconColor }} />
          </button>
        </div>
      </div>
    </div>
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
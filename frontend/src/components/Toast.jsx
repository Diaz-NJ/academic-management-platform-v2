import React, { useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info, XCircle } from 'lucide-react';
import { playNotificationSoundEnhanced } from '../utils/notificationSound';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
  // ✅ Play sound for important notifications
  if (type === 'info' || type === 'warning') {
    playNotificationSoundEnhanced();
  }
  
  const timer = setTimeout(() => {
    onClose();
  }, duration);

  return () => clearTimeout(timer);
}, [duration, onClose, type]);

  const types = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-800',
      iconColor: 'text-green-500'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-800',
      iconColor: 'text-red-500'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500'
    }
  };

  const config = types[type];
  const Icon = config.icon;

  return (
    <div className={`fixed top-4 right-4 z-50 animate-slide-in`}>
      <div className={`flex items-center space-x-3 ${config.bgColor} ${config.textColor} px-4 py-3 rounded-lg shadow-lg border-l-4 ${config.borderColor} min-w-[300px] max-w-md`}>
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className={`${config.iconColor} hover:opacity-70 transition`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
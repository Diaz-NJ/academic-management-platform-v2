import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger' // 'danger' or 'warning'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex items-start space-x-3 mb-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            type === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${
              type === 'danger' ? 'text-red-600' : 'text-yellow-600'
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {title}
            </h3>
            <p className="text-sm text-gray-600">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2 rounded-lg transition font-medium text-white ${
              type === 'danger' 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-yellow-500 hover:bg-yellow-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
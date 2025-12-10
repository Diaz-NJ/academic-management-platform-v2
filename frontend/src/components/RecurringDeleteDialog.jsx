// Create new file: frontend/src/components/RecurringDeleteDialog.jsx

import React from 'react';
import { RefreshCw, Calendar, X, AlertTriangle } from 'lucide-react';

const RecurringDeleteDialog = ({ 
  isOpen, 
  onClose, 
  onDeleteSeries, 
  onCancelInstance, 
  eventTitle 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Delete Scheduled Event</h2>
                <p className="text-sm text-gray-600">"{eventTitle}"</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-gray-700 mb-6">
            This is a scheduled event. What would you like to do?
          </p>

          {/* Options */}
          <div className="space-y-3">
            {/* Cancel This Instance */}
            <button
              onClick={onCancelInstance}
              className="w-full flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition text-left"
            >
              <Calendar className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Cancel This Event Only</h3>
                <p className="text-sm text-gray-600">
                  Mark this occurrence as canceled. Other events in the series remain scheduled.
                </p>
              </div>
            </button>

            {/* Delete Entire Series */}
            <button
              onClick={onDeleteSeries}
              className="w-full flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition text-left"
            >
              <RefreshCw className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Delete Entire Series</h3>
                <p className="text-sm text-gray-600">
                  Permanently delete all occurrences of this scheduled event. This cannot be undone.
                </p>
              </div>
            </button>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurringDeleteDialog;
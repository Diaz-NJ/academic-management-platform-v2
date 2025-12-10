// Create new file: frontend/src/components/RecurringEditDialog.jsx

import React from 'react';
import { RefreshCw, Calendar, X } from 'lucide-react';

const RecurringEditDialog = ({ isOpen, onClose, onEditSeries, onEditInstance, eventTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Edit Scheduled Event</h2>
              <p className="text-sm text-gray-600">"{eventTitle}"</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-gray-700 mb-6">
            This is a scheduled event. What would you like to edit?
          </p>

          {/* Options */}
          <div className="space-y-3">
            {/* Edit This Instance */}
            <button
              onClick={onEditInstance}
              className="w-full flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition text-left"
            >
              <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">This Event</h3>
                <p className="text-sm text-gray-600">
                  Only this occurrence will be changed. Other events in the series will remain the same.
                </p>
              </div>
            </button>

            {/* Edit All Events */}
            <button
              onClick={onEditSeries}
              className="w-full flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition text-left"
            >
              <RefreshCw className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">All Events in Series</h3>
                <p className="text-sm text-gray-600">
                  All future occurrences of this event will be updated with your changes.
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

export default RecurringEditDialog;
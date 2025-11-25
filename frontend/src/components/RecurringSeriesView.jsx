import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, RefreshCw, Edit, Trash2, CheckSquare, Square } from 'lucide-react';
import { expandRecurringEvents } from '../utils/recurringUtils';

const RecurringSeriesView = ({ event, onClose, onEditInstance, onDeleteInstance, onCancelInstance }) => {
  const [instances, setInstances] = useState([]);
  const [selectedInstances, setSelectedInstances] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    if (event && event.isRecurring) {
      // Generate instances for the next year
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      const expanded = expandRecurringEvents([event], startDate, endDate);
      const eventInstances = expanded
        .filter(e => e.originalId === event.id)
        .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
      
      setInstances(eventInstances);
    }
  }, [event]);

  const toggleInstanceSelection = (instanceId) => {
    setSelectedInstances(prev => 
      prev.includes(instanceId) 
        ? prev.filter(id => id !== instanceId)
        : [...prev, instanceId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedInstances.length === instances.length) {
      setSelectedInstances([]);
    } else {
      setSelectedInstances(instances.map(i => i.id));
    }
  };

  const handleBulkCancel = () => {
    const instancesToCancel = instances.filter(i => selectedInstances.includes(i.id));
    instancesToCancel.forEach(instance => {
      onCancelInstance(instance);
    });
    setSelectedInstances([]);
    setShowBulkActions(false);
  };

  const handleBulkDelete = () => {
    const instancesToDelete = instances.filter(i => selectedInstances.includes(i.id));
    instancesToDelete.forEach(instance => {
      onDeleteInstance(instance);
    });
    setSelectedInstances([]);
    setShowBulkActions(false);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadge = (instance) => {
    if (instance.isCanceled) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
          Canceled
        </span>
      );
    }
    
    const now = new Date();
    const instanceDate = new Date(instance.startDateTime);
    
    if (instanceDate < now) {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
          Past
        </span>
      );
    }
    
    return (
      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
        Scheduled
      </span>
    );
  };

  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <RefreshCw className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-gray-800">Recurring Event Series</h2>
              </div>
              <h3 className="text-xl text-gray-700">{event.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Showing {instances.length} instances
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedInstances.length > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-semibold text-blue-900">
                  {selectedInstances.length} instance(s) selected
                </span>
                <button
                  onClick={() => setSelectedInstances([])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear Selection
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkCancel}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm"
                >
                  Cancel Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instances List */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Select All */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <button
              onClick={toggleSelectAll}
              className="flex items-center space-x-2 text-sm text-gray-700 hover:text-primary"
            >
              {selectedInstances.length === instances.length ? (
                <CheckSquare className="w-5 h-5 text-primary" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span className="font-medium">
                {selectedInstances.length === instances.length 
                  ? 'Deselect All' 
                  : 'Select All'}
              </span>
            </button>
          </div>

          <div className="space-y-3">
            {instances.map((instance, index) => (
              <div
                key={instance.id}
                className={`flex items-start space-x-4 p-4 border rounded-lg transition ${
                  instance.isCanceled 
                    ? 'bg-red-50 border-red-200 opacity-60' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleInstanceSelection(instance.id)}
                  className="mt-1 flex-shrink-0"
                >
                  {selectedInstances.includes(instance.id) ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 hover:text-primary" />
                  )}
                </button>

                {/* Instance Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-semibold text-gray-800">
                      Instance #{index + 1}
                    </span>
                    {getStatusBadge(instance)}
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span className={instance.isCanceled ? 'line-through' : ''}>
                        {formatDateTime(instance.startDateTime)}
                      </span>
                    </div>
                    
                    {instance.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span className={instance.isCanceled ? 'line-through' : ''}>
                          {instance.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {!instance.isCanceled && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEditInstance(instance)}
                      className="p-2 text-primary hover:bg-blue-50 rounded transition"
                      title="Edit this instance"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onCancelInstance(instance)}
                      className="p-2 text-orange-500 hover:bg-orange-50 rounded transition"
                      title="Cancel this instance"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteInstance(instance)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                      title="Delete this instance"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurringSeriesView;
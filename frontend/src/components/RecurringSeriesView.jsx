import React, { useState, useEffect } from 'react';
import { X, Edit, Ban, Trash2, CheckSquare, Square, Calendar as CalendarIcon } from 'lucide-react';
import { expandRecurringEvents, getRecurrenceDescription } from '../utils/recurringUtils';

const RecurringSeriesView = ({ 
  event, 
  onClose, 
  onRefresh,
  onEditInstance,
  onCancelInstance,
  onDeleteInstance
}) => {
  const [instances, setInstances] = useState([]);
  const [selectedInstances, setSelectedInstances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (event && event.isRecurring) {
      generateInstances();
    }
  }, [event]);

  const generateInstances = () => {
    try {
      // Generate instances for 1 year ahead
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

        const parentInstance = {
        ...event,
        isRecurringInstance: false,
        isCanceled: false
        };

      const expanded = expandRecurringEvents([event], startDate, endDate);
      
      // Filter to only this event's instances and sort by date
      const eventInstances = expanded
        .filter(e => e.originalId === event.id || e.id === event.id)
        .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
      
      console.log('Generated instances:', eventInstances.length);
      setInstances(eventInstances);
    } catch (error) {
      console.error('Error generating instances:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Bulk cancel with proper error handling
  const handleBulkCancel = async () => {
    if (selectedInstances.length === 0) return;

    try {
      for (const instanceId of selectedInstances) {
        const instance = instances.find(i => 
          (i.id === instanceId || `${i.originalId}-${i.startDateTime}` === instanceId)
        );
        
        if (instance && !instance.isCanceled) {
          await onCancelInstance(instance);
        }
      }
      
      setSelectedInstances([]);
      onRefresh();
    } catch (error) {
      console.error('Error in bulk cancel:', error);
    }
  };

  // ✅ FIX: Bulk delete with proper error handling
  const handleBulkDelete = async () => {
    if (selectedInstances.length === 0) return;
    
    if (!window.confirm(`Delete ${selectedInstances.length} instance(s) permanently?`)) {
      return;
    }

    try {
      for (const instanceId of selectedInstances) {
        const instance = instances.find(i => 
          (i.id === instanceId || `${i.originalId}-${i.startDateTime}` === instanceId)
        );
        
        if (instance) {
          await onDeleteInstance(instance);
        }
      }
      
      setSelectedInstances([]);
      onRefresh();
    } catch (error) {
      console.error('Error in bulk delete:', error);
    }
  };

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
      setSelectedInstances(instances.map(i => i.id || `${i.originalId}-${i.startDateTime}`));
    }
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
    const now = new Date();
    const instanceDate = new Date(instance.startDateTime);
    
    if (instance.isCanceled) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-medium">Canceled</span>;
    } else if (instanceDate < now) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 font-medium">Past</span>;
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">Scheduled</span>;
    }
  };

  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">{event.title}</h2>
              <p className="text-sm text-gray-600">{getRecurrenceDescription(event)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedInstances.length > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-900">
                {selectedInstances.length} instance(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkCancel}
                  className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-medium flex items-center space-x-1"
                >
                  <Ban className="w-4 h-4" />
                  <span>Cancel Selected</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected</span>
                </button>
                <button
                  onClick={() => setSelectedInstances([])}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instances List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading instances...</div>
          ) : instances.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No instances found</p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="mb-4 pb-3 border-b border-gray-200">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-primary transition"
                >
                  {selectedInstances.length === instances.length ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  <span>
                    {selectedInstances.length === instances.length ? 'Deselect All' : 'Select All'}
                    {' '}({instances.length} instances)
                  </span>
                </button>
              </div>

              {/* Instance Items */}
              <div className="space-y-2">
                {instances.map((instance) => {
                  const instanceId = instance.id || `${instance.originalId}-${instance.startDateTime}`;
                  const isSelected = selectedInstances.includes(instanceId);
                  
                  return (
                    <div
                      key={instanceId}
                      className={`border rounded-lg p-4 transition ${
                        isSelected ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      } ${instance.isCanceled ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleInstanceSelection(instanceId)}
                          className="mt-1 flex-shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400 hover:text-primary" />
                          )}
                        </button>

                        {/* Instance Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={`font-medium text-gray-800 ${instance.isCanceled ? 'line-through' : ''}`}>
                              {formatDateTime(instance.startDateTime)}
                            </h4>
                            {getStatusBadge(instance)}
                          </div>
                          
                          {instance.location && (
                            <p className="text-sm text-gray-600">📍 {instance.location}</p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          {!instance.isCanceled && (
                            <>
                              <button
                                onClick={() => onEditInstance(instance)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded transition"
                                title="Edit this instance"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onCancelInstance(instance)}
                                className="p-2 text-orange-500 hover:bg-orange-50 rounded transition"
                                title="Cancel this instance"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => onDeleteInstance(instance)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                            title="Delete this instance permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurringSeriesView;
import React from 'react';
import { AlertTriangle, Clock, Calendar, MapPin, X } from 'lucide-react';

const ConflictWarningModal = ({ 
  isOpen, 
  onClose, 
  onProceed, 
  conflicts = [],
  newEvent 
}) => {
  if (!isOpen || conflicts.length === 0) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'severe':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'moderate':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'minor':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'severe':
        return '🚨';
      case 'moderate':
        return '⚠️';
      case 'minor':
        return '⚡';
      default:
        return 'ℹ️';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  Scheduling Conflict Detected
                </h2>
                <p className="text-sm text-gray-600">
                  The following events overlap with your new event
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* New Event Info */}
        <div className="p-6 bg-blue-50 border-b border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-blue-600" />
            New Event
          </h3>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-2">{newEvent?.title}</h4>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(newEvent?.startDateTime)} - {formatTime(newEvent?.endDateTime)}
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(newEvent?.startDateTime)}
              </span>
              {newEvent?.location && (
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {newEvent.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Conflicts List */}
        <div className="p-6 overflow-y-auto max-h-96">
          <h3 className="font-semibold text-gray-800 mb-4">
            Conflicting Events ({conflicts.length})
          </h3>
          <div className="space-y-3">
            {conflicts.map((conflict, index) => (
              <div
                key={index}
                className={`border-l-4 rounded-lg p-4 ${getSeverityColor(conflict.severity)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{getSeverityIcon(conflict.severity)}</span>
                    <h4 className="font-semibold text-gray-800">
                      {conflict.event.title}
                    </h4>
                  </div>
                  <span className="text-xs font-medium uppercase px-2 py-1 rounded bg-white bg-opacity-50">
                    {conflict.severity} overlap
                  </span>
                </div>
                
                {conflict.event.description && (
                  <p className="text-sm text-gray-700 mb-2">
                    {conflict.event.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTime(conflict.event.startDateTime)} - {formatTime(conflict.event.endDateTime)}
                  </span>
                  {conflict.event.location && (
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {conflict.event.location}
                    </span>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                  <p className="text-xs font-medium">
                    {conflict.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onProceed}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium flex items-center justify-center space-x-2"
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Create Anyway</span>
            </button>
          </div>
          <p className="text-xs text-gray-600 text-center mt-3">
            Creating this event will result in scheduling conflicts. Review your calendar carefully.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConflictWarningModal;
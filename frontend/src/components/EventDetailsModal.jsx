import React from 'react';
import { X, Edit, Trash2, Clock, MapPin, Calendar, RefreshCw } from 'lucide-react';
import { getRecurrenceDescription } from '../utils/recurringUtils';

const EventDetailsModal = ({ event, onClose, onEdit, onDelete }) => {
  if (!event) return null;

  const getEventTypeColor = (type) => {
    const colors = {
      Class: 'bg-blue-500',
      Exam: 'bg-red-500',
      Deadline: 'bg-orange-500',
      Meeting: 'bg-green-500',
      Other: 'bg-purple-500',
    };
    return colors[type] || 'bg-gray-500';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-2xl font-bold text-gray-800">{event.title}</h2>
                {/* ✅ NEW: Recurring badge */}
                {event.isRecurring && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    <RefreshCw className="w-3 h-3" />
                    <span>Recurring</span>
                  </div>
                )}
              </div>
              <span 
                className="inline-block px-3 py-1 text-sm rounded-full text-white"
                style={{ backgroundColor: event.colorCode || '#3788d8' }}
              >
                {event.eventType}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {event.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
                <p className="text-gray-600">{event.description}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Time</h3>
              <div className="flex items-start space-x-2 text-gray-600">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{formatDateTime(event.startDateTime)}</p>
                  {event.endDateTime && (
                    <p className="text-sm">to {formatDateTime(event.endDateTime)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ NEW: Recurring pattern description */}
            {event.isRecurring && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Recurrence</h3>
                <div className="flex items-start space-x-2 text-gray-600">
                  <RefreshCw className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{getRecurrenceDescription(event)}</p>
                    {event.isRecurringInstance && (
                      <p className="text-xs text-gray-500 mt-1">
                        This is one instance of a recurring event
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {event.location && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Location</h3>
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{event.location}</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
            >
              <Edit className="w-4 h-4" />
              <span>{event.isRecurring ? 'Edit Series' : 'Edit Event'}</span>
            </button>
            <button
              onClick={onDelete}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>{event.isRecurring ? 'Delete Series' : 'Delete'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
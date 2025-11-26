// frontend/src/components/EventDetailsModal.jsx - COMPLETE FIXED VERSION

import React from 'react';
import { X, Edit, Trash2, Clock, MapPin, Calendar, RefreshCw, RotateCcw } from 'lucide-react';
import { getRecurrenceDescription } from '../utils/recurringUtils';

const EventDetailsModal = ({ event, onClose, onEdit, onDelete, onUncancel, onViewSeries }) => {
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

  // ✅ FIXED: Check if this is a recurring event (either original or instance)
  const isRecurringEvent = event.isRecurring || event.isRecurringInstance;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className={`text-2xl font-bold text-gray-800 ${
                  event.isCanceled ? 'line-through' : ''
                }`}>
                  {event.title}
                </h2>
                {/* ✅ FIXED: Show recurring badge for both recurring and instances */}
                {isRecurringEvent && !event.isCanceled && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    <RefreshCw className="w-3 h-3" />
                    <span>Recurring</span>
                  </div>
                )}
                {event.isCanceled && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    <span>🚫</span>
                    <span>Canceled</span>
                  </div>
                )}
              </div>
              <span 
                className={`inline-block px-3 py-1 text-sm rounded-full text-white ${
                  event.isCanceled ? 'opacity-60' : ''
                }`}
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

          {/* Cancellation Notice */}
          {event.isCanceled && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>This event has been canceled.</strong> It will not appear in your upcoming events, 
                but remains visible in the calendar for reference. You can restore it or delete it permanently.
              </p>
            </div>
          )}

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

            {/* ✅ FIXED: Show recurrence info for both recurring and instances */}
            {isRecurringEvent && !event.isCanceled && (
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

          {/* ✅ FIXED: View Series Button - show for both recurring and instances */}
          {isRecurringEvent && !event.isCanceled && onViewSeries && (
            <div className="mt-4">
              <button
                onClick={onViewSeries}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
              >
                <Calendar className="w-4 h-4" />
                <span>View All Instances in Series</span>
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col space-y-2 mt-6 pt-6 border-t border-gray-200">
            {event.isCanceled ? (
              <>
                {/* Un-cancel Button - only for recurring instances */}
                {onUncancel && event.isRecurringInstance && (
                  <button
                    onClick={onUncancel}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restore Event</span>
                  </button>
                )}
                {/* Delete Permanently Button - always show for canceled events */}
                <button
                  onClick={onDelete}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Permanently</span>
                </button>
              </>
            ) : (
              <>
                {/* Edit Button */}
                <button
                  onClick={onEdit}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
                >
                  <Edit className="w-4 h-4" />
                  <span>
                    {isRecurringEvent 
                      ? (event.isRecurringInstance ? 'Edit Instance' : 'Edit Series') 
                      : 'Edit Event'}
                  </span>
                </button>
                {/* Delete Button */}
                <button
                  onClick={onDelete}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {isRecurringEvent 
                      ? (event.isRecurringInstance ? 'Delete Instance' : 'Delete Series') 
                      : 'Delete'}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
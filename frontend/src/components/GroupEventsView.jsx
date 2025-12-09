import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { eventAPI } from '../services/api';
import { formatRelativeDate } from '../utils/dateUtils';
import { EVENT_TYPE_CONFIG } from '../utils/colorUtils';
import { useAuth } from '../context/AuthContext';

const GroupEventsView = ({ group, onClose }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const isMember = group.members?.some(m => m.userId === user.id);

  useEffect(() => {
    if (isMember) {
      loadGroupEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, isMember]);

  if (!isMember) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Access Denied</h3>
          <p className="text-gray-600 mb-6">
            You are not a member of this group and cannot view its events.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const loadGroupEvents = async () => {
    try {
      console.log('🔍 Loading events for group:', group.id);
      const response = await eventAPI.getGroupEvents(group.id);
      console.log('📦 Events loaded:', response.data.length, 'events');
      
      // Filter to only show events linked to this group
      const linkedEvents = response.data.filter(event => {
        const isLinked = event.groupId === group.id;
        return isLinked && !event.isCanceled; // Exclude canceled events
      });
      
      console.log('✅ Filtered events:', linkedEvents.length, 'events linked to this group');
      setEvents(linkedEvents);
    } catch (error) {
      console.error('❌ Error loading group events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingCount = () => {
    const now = new Date();
    return events.filter(e => new Date(e.startDateTime) >= now).length;
  };

  const getPastCount = () => {
    const now = new Date();
    return events.filter(e => new Date(e.startDateTime) < now).length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                {group.groupName} - Events
              </h2>
              <p className="text-sm text-gray-600">{group.subject}</p>
              {group.members && (
                <p className="text-xs text-gray-500 mt-1">
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-800">{events.length}</p>
              <p className="text-xs text-gray-600">Total Events</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-blue-600">{getUpcomingCount()}</p>
              <p className="text-xs text-gray-600">Upcoming</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-600">{getPastCount()}</p>
              <p className="text-xs text-gray-600">Past</p>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No Events Linked
              </h3>
              <p className="text-gray-600">
                Link events to this group from the Calendar tab to see them here.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                💡 Tip: When creating or editing an event, select this group from the dropdown.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events
                .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
                .map(event => {
                  const eventConfig = EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.Other;
                  const isPast = new Date(event.startDateTime) < new Date();

                  return (
                    <div
                      key={event.id}
                      className={`bg-white border-2 rounded-lg p-4 hover:shadow-lg transition ${
                        isPast ? 'border-gray-300 opacity-75' : 'border-gray-200'
                      }`}
                      style={{ borderLeftWidth: '4px', borderLeftColor: eventConfig.color }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3 flex-1">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: eventConfig.color }}
                          >
                            <span className="text-xl">{eventConfig.icon}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">
                              {event.title}
                            </h3>
                            <span 
                              className="inline-flex px-2 py-1 text-xs rounded-full text-white font-medium mt-1"
                              style={{ backgroundColor: eventConfig.color }}
                            >
                              {event.eventType}
                            </span>
                          </div>
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatRelativeDate(event.startDateTime)}</span>
                        </span>
                        {event.location && (
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </span>
                        )}
                        {isPast && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                            Past Event
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
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

export default GroupEventsView;
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { eventAPI } from '../services/api';
import { Plus, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle } from 'lucide-react';
import EventModal from '../components/EventModal';
import ConfirmDialog from '../components/ConfirmDialog';
import EventDetailsModal from '../components/EventDetailsModal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Calendar as CalendarIcon } from 'lucide-react';
import { expandRecurringEvents } from '../utils/recurringUtils';
import RecurringEditDialog from '../components/RecurringEditDialog';
import RecurringDeleteDialog from '../components/RecurringDeleteDialog';
import RecurringSeriesView from '../components/RecurringSeriesView';
import { EVENT_TYPE_CONFIG } from '../utils/colorUtils';

const Calendar = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Event data
  const [events, setEvents] = useState([]);
  const [originalEvents, setOriginalEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);

  // ✅ FIXED: Single modal state management
  const [modalState, setModalState] = useState({
    type: null, // 'create', 'edit', 'details', 'recurringEdit', 'recurringDelete', 'seriesView', 'delete'
    data: null, // The event or data being operated on
    extraData: null // Additional data (like initialDate for create)
  });

  // Load events
  useEffect(() => {
    loadEvents();
  }, [user, currentDate]);

  // Filter events
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents(events);
    }
  }, [events, searchQuery]);

  // ✅ FIXED: Proper load with useCallback
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getEvents(user.id);
      
      const originalEvents = response.data;
      
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const expanded = expandRecurringEvents(originalEvents, startOfMonth, endOfMonth);
      
      setEvents(expanded);
      setOriginalEvents(originalEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      showToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  }, [user.id, currentDate, showToast]);

  // ✅ FIXED: Close all modals
  const closeModal = useCallback(() => {
    setModalState({ type: null, data: null, extraData: null });
  }, []);

  // ✅ FIXED: Simplified event saved handler
  const handleEventSaved = useCallback(async () => {
    await loadEvents();
    closeModal();
  }, [loadEvents, closeModal]);

  // Event click handler
  const handleEventClick = (event, e) => {
    if (e) e.stopPropagation();
    
    if (event.isRecurring || event.isRecurringInstance) {
      setModalState({
        type: 'recurringEdit',
        data: event,
        extraData: null
      });
    } else {
      setModalState({
        type: 'details',
        data: event,
        extraData: null
      });
    }
  };

  // Edit handlers
  const handleEditFromDetails = () => {
    const event = modalState.data;
    
    if (event.isRecurring || event.isRecurringInstance) {
      setModalState({
        type: 'recurringEdit',
        data: event,
        extraData: null
      });
    } else {
      setModalState({
        type: 'edit',
        data: event,
        extraData: null
      });
    }
  };

  const handleEditSeriesClick = () => {
    const event = modalState.data;
    const eventToEdit = event.isRecurringInstance 
      ? originalEvents.find(e => e.id === event.originalId)
      : event;
    
    if (!eventToEdit) {
      showToast('Error loading event for editing', 'error');
      return;
    }
    
    setModalState({
      type: 'edit',
      data: eventToEdit,
      extraData: null
    });
  };

  const handleEditInstanceClick = async (instance) => {
    try {
      if (!instance) {
        showToast('Error: Invalid event instance', 'error');
        return;
      }

      const originalEventId = instance.originalId || instance.id;
      const originalEvent = originalEvents.find(e => e.id === originalEventId);
      
      if (!originalEvent) {
        showToast('Error: Could not find original event', 'error');
        return;
      }

      const instanceDate = new Date(instance.startDateTime);
      const existingExceptions = await eventAPI.getExceptions(originalEvent.id);
      
      const existingException = existingExceptions.data?.find(exc => {
        const excDate = new Date(exc.exceptionDate);
        return (
          excDate.getFullYear() === instanceDate.getFullYear() &&
          excDate.getMonth() === instanceDate.getMonth() &&
          excDate.getDate() === instanceDate.getDate()
        );
      });

      if (existingException) {
        setModalState({
          type: 'edit',
          data: existingException,
          extraData: null
        });
      } else {
        const exceptionEventData = {
          ...originalEvent,
          id: null,
          isRecurring: false,
          isException: true,
          parentEventId: originalEvent.id,
          exceptionDate: instanceDate.toISOString(),
          startDateTime: instance.startDateTime,
          endDateTime: instance.endDateTime,
          recurrencePattern: null,
          recurrenceInterval: null,
          recurrenceEndDate: null,
          recurrenceDaysOfWeek: null,
          recurrenceEndType: 'never',
          recurrenceCount: null,
        };
        
        setModalState({
          type: 'edit',
          data: exceptionEventData,
          extraData: null
        });
      }
    } catch (error) {
      console.error('Error setting up instance edit:', error);
      showToast('Failed to prepare event for editing', 'error');
    }
  };

  // Delete handlers
  const handleDeleteFromDetails = () => {
    setModalState({
      type: 'delete',
      data: modalState.data,
      extraData: null
    });
  };

  const handleDeleteSeriesClick = () => {
    const event = modalState.data;
    const eventToDelete = event.isRecurringInstance 
      ? originalEvents.find(e => e.id === event.originalId) || event
      : event;
    
    setModalState({
      type: 'delete',
      data: eventToDelete,
      extraData: null
    });
  };

  const handleDeleteConfirm = async () => {
    const eventToDelete = modalState.data;
    if (!eventToDelete) return;

    try {
      if (eventToDelete.isCanceled && eventToDelete.isRecurringInstance) {
        const instanceDate = new Date(eventToDelete.startDateTime).toISOString();
        const originalId = eventToDelete.originalId;
        
        await eventAPI.deleteInstance(originalId, instanceDate);
        showToast('Canceled event permanently deleted', 'success');
      } else if (eventToDelete.isRecurringInstance && !eventToDelete.isCanceled) {
        // Should go to recurring delete dialog instead
        setModalState({
          type: 'recurringDelete',
          data: eventToDelete,
          extraData: null
        });
        return;
      } else {
        await eventAPI.deleteEvent(eventToDelete.id);
        showToast('Event deleted successfully', 'success');
      }
      
      await loadEvents();
      closeModal();
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Failed to delete event', 'error');
    }
  };

  // Cancel/Uncancel handlers
  const handleCancelInstanceClick = async (instance) => {
    try {
      if (!instance || !instance.startDateTime) {
        showToast('Error: Invalid event instance', 'error');
        return;
      }

      const instanceDate = new Date(instance.startDateTime);
      const dateStr = instanceDate.toISOString();
      
      const originalId = instance.originalId || instance.id;
      await eventAPI.cancelInstance(originalId, dateStr);
      
      showToast('Event occurrence canceled', 'success');
      await loadEvents();
      closeModal();
    } catch (error) {
      console.error('Error canceling instance:', error);
      showToast('Failed to cancel event occurrence', 'error');
    }
  };

  const handleUncancelFromDetails = async () => {
    try {
      const event = modalState.data;
      const instanceDate = new Date(event.startDateTime).toISOString();
      const originalId = event.isRecurringInstance ? event.originalId : event.id;
      
      await eventAPI.uncancelInstance(originalId, instanceDate);
      showToast('Event restored successfully', 'success');
      await loadEvents();
      closeModal();
    } catch (error) {
      console.error('Error un-canceling event:', error);
      showToast('Failed to restore event', 'error');
    }
  };

  const handleDeleteInstanceClick = async (instance) => {
    try {
      if (!instance || !instance.startDateTime) {
        showToast('Error: Invalid event instance', 'error');
        return;
      }

      const instanceDate = new Date(instance.startDateTime);
      const dateStr = instanceDate.toISOString();
      
      const originalId = instance.originalId || instance.id;
      await eventAPI.deleteInstance(originalId, dateStr);
      
      showToast('Event occurrence deleted permanently', 'success');
      await loadEvents();
    } catch (error) {
      console.error('Error deleting instance:', error);
      showToast('Failed to delete event occurrence', 'error');
    }
  };

  // View series
  const handleViewSeriesClick = () => {
    const event = modalState.data;
    const originalEvent = event.isRecurringInstance 
      ? originalEvents.find(e => e.id === event.originalId)
      : event;
    
    if (!originalEvent) {
      showToast('Error: Could not find original event', 'error');
      return;
    }
    
    setModalState({
      type: 'seriesView',
      data: originalEvent,
      extraData: null
    });
  };

  // Calendar navigation
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDateTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    clickedDate.setHours(12, 0, 0, 0);
    
    setModalState({
      type: 'create',
      data: null,
      extraData: clickedDate
    });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getEventTypeColor = (type) => {
    const config = EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG.Other;
    return config.color;
  };

  const getDeleteMessage = () => {
    const eventToDelete = modalState.data;
    if (!eventToDelete) return '';
    
    if (eventToDelete.isCanceled) {
      return `Are you sure you want to permanently remove this canceled event from your calendar? This will hide it completely.`;
    } else if (eventToDelete.isRecurring || eventToDelete.isRecurringInstance) {
      return `Are you sure you want to delete "${eventToDelete.title}"? This will delete all instances of this recurring event. This action cannot be undone.`;
    } else {
      return `Are you sure you want to delete "${eventToDelete.title}"? This action cannot be undone.`;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your calendar..." />;
  }

   return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Academic Calendar</h2>
        <button
          onClick={() => setModalState({ 
            type: 'create', 
            data: null, 
            extraData: new Date() 
          })}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
        >
          <Plus className="w-5 h-5" />
          <span>New Event</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search events by title, type, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-600 mt-2">
            Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </p>
        )}
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Search Results</h3>
          <div className="space-y-3">
            {filteredEvents.length > 0 ? (
              filteredEvents
                .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
                .map(event => {
                  const eventConfig = EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.Other;
                  
                  return (
                    <div 
                      key={event.id} 
                      className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer border-l-4 ${
                        event.isCanceled ? 'opacity-60' : ''
                      }`}
                      style={{ borderLeftColor: eventConfig.color }}
                      onClick={() => setModalState({ type: 'details', data: event, extraData: null })}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* ✨ Event type icon */}
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium shadow-sm"
                          style={{ backgroundColor: eventConfig.color }}
                        >
                          <span className="text-lg">{eventConfig.icon}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className={`font-medium text-gray-800 truncate ${
                              event.isCanceled ? 'line-through' : ''
                            }`}>
                              {event.title}
                            </h4>
                            {event.isRecurring && !event.isCanceled && (
                              <RefreshCw className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            )}
                            {event.isCanceled && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                Canceled
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(event.startDateTime).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                            {event.location && ` • ${event.location}`}
                          </p>
                        </div>
                        
                        {/* ✨ Enhanced event type badge */}
                        <span 
                          className="px-3 py-1 text-xs rounded-full whitespace-nowrap text-white font-medium shadow-sm"
                          style={{ backgroundColor: eventConfig.color }}
                        >
                          {eventConfig.icon} {event.eventType}
                        </span>
                      </div>
                    </div>
                  );
                })
            ) : (
              <EmptyState
                icon={CalendarIcon}
                title="No Events Found"
                message={`No events match "${searchQuery}". Try a different search term.`}
                actionLabel="Clear Search"
                onAction={() => setSearchQuery('')}
              />
            )}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h3 className="text-xl font-semibold">{monthName}</h3>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-700 py-2">
              {day}
            </div>
          ))}

          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={day}
                onClick={() => handleDateClick(day)}
                className={`aspect-square border rounded-lg p-2 cursor-pointer hover:bg-gray-50 transition ${
                  isToday ? 'border-primary border-2 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className={`text-sm font-medium ${isToday ? 'text-primary' : 'text-gray-700'}`}>
                  {day}
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => handleEventClick(event, e)}
                      className={`relative text-xs text-white rounded px-1 py-0.5 truncate cursor-pointer transition-all duration-200 hover:opacity-80 hover:scale-105 ${
                        event.isCanceled ? 'opacity-50' : ''
                      }`}
                      style={{ 
                        backgroundColor: getEventTypeColor(event.eventType),
                        textDecoration: event.isCanceled ? 'line-through' : 'none'
                      }}
                      title={event.isCanceled ? `${event.title} (Canceled)` : event.title}
                    >
                      <div className="flex items-center space-x-1">
                        {/* ✨ Add event type icon */}
                        <span className="text-xs">
                          {(EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.Other).icon}
                        </span>
                        {event.isRecurring && !event.isCanceled && (
                          <RefreshCw className="w-3 h-3 flex-shrink-0" />
                        )}
                        {event.isCanceled && <span>🚫</span>}
                        <span className="truncate">{event.title}</span>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      {!searchQuery && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {events
              .filter(e => {
                const eventDate = new Date(e.startDateTime);
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate >= now && !e.isCanceled;
              })
              .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
              .slice(0, 5)
              .map(event => (
                <div 
                  key={event.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => setModalState({ type: 'details', data: event, extraData: null })}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: event.colorCode || '#3788d8' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-800 truncate">{event.title}</h4>
                        {event.isRecurring && (
                          <RefreshCw className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(event.startDateTime).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                    <span 
                      className="px-2 py-1 text-xs rounded-full whitespace-nowrap text-white"
                      style={{ backgroundColor: event.colorCode || '#3788d8' }}
                    >
                      {event.eventType}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ✅ FIXED: Single modal state management */}
      
      {/* Event Modal */}
      {(modalState.type === 'create' || modalState.type === 'edit') && (
        <EventModal
          onClose={closeModal}
          onSave={handleEventSaved}
          userId={user.id}
          initialDate={modalState.extraData}
          event={modalState.data}
        />
      )}

      {/* Event Details Modal */}
      {modalState.type === 'details' && (
        <EventDetailsModal
          event={modalState.data}
          onClose={closeModal}
          onEdit={handleEditFromDetails}
          onDelete={handleDeleteFromDetails}
          onUncancel={modalState.data?.isCanceled ? handleUncancelFromDetails : null}
          onViewSeries={modalState.data?.isRecurring ? handleViewSeriesClick : null}
        />
      )}

      {/* Recurring Edit Dialog */}
      {modalState.type === 'recurringEdit' && (
        <RecurringEditDialog
          isOpen={true}
          onClose={closeModal}
          onEditSeries={handleEditSeriesClick}
          onEditInstance={() => handleEditInstanceClick(modalState.data)}
          eventTitle={modalState.data?.title || ''}
        />
      )}

      {/* Recurring Delete Dialog */}
      {modalState.type === 'recurringDelete' && (
        <RecurringDeleteDialog
          isOpen={true}
          onClose={closeModal}
          onDeleteSeries={handleDeleteSeriesClick}
          onCancelInstance={() => handleCancelInstanceClick(modalState.data)}
          eventTitle={modalState.data?.title || ''}
        />
      )}

      {/* Series View */}
      {modalState.type === 'seriesView' && (
        <RecurringSeriesView
          event={modalState.data}
          onClose={closeModal}
          onRefresh={loadEvents}
          onEditInstance={handleEditInstanceClick}
          onCancelInstance={handleCancelInstanceClick}
          onDeleteInstance={handleDeleteInstanceClick}
        />
      )}

      {/* Delete Confirm Dialog */}
      {modalState.type === 'delete' && (
        <ConfirmDialog
          isOpen={true}
          onClose={closeModal}
          onConfirm={handleDeleteConfirm}
          title={modalState.data?.isCanceled ? "Remove Canceled Event" : "Delete Event"}
          message={getDeleteMessage()}
          confirmText={modalState.data?.isCanceled ? "Remove" : "Delete"}
          cancelText="Cancel"
          type="danger"
        />
      )}
    </div>
  );
};

export default Calendar;
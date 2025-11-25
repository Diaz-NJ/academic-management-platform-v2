import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { eventAPI } from '../services/api';
import { Plus, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, List } from 'lucide-react';
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
import ConflictWarningModal from '../components/ConflictWarningModal';
import useConflictDetection from '../hooks/useConflictDetection';

const Calendar = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [originalEvents, setOriginalEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRecurringEditDialog, setShowRecurringEditDialog] = useState(false);
  const [showRecurringDeleteDialog, setShowRecurringDeleteDialog] = useState(false);
  const [selectedRecurringEvent, setSelectedRecurringEvent] = useState(null);
  const [selectedEventForSeries, setSelectedEventForSeries] = useState(null);
  
  // ✅ NEW: Recurring Series View
  const [showRecurringSeriesView, setShowRecurringSeriesView] = useState(false);
  const [seriesEvent, setSeriesEvent] = useState(null);
  
  // ✅ NEW: Conflict Detection
  const { conflicts, checkEventConflict, hasConflicts } = useConflictDetection(events);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [pendingEvent, setPendingEvent] = useState(null);
  const [detectedConflicts, setDetectedConflicts] = useState([]);

  useEffect(() => {
    loadEvents();
  }, [user, currentDate]);

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

  const loadEvents = async () => {
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
    } finally {
      setLoading(false);
    }
  };

    const handleViewSeriesClick = () => {
      setShowEventDetailsModal(false);
      
      // Get the original event
      const originalEvent = selectedEvent.isRecurringInstance 
        ? originalEvents.find(e => e.id === selectedEvent.originalId)
        : selectedEvent;
      
      if (!originalEvent) {
        showToast('Error: Could not find original event', 'error');
        return;
      }
      
      setSelectedEventForSeries(originalEvent);
      setShowRecurringSeriesView(true);
    };

  // ✅ MODIFIED: Check for conflicts before saving
  const handleEventSaved = async () => {
  try {
    await loadEvents();
    setShowEventModal(false);
    setEditingEvent(null);
    showToast('Event saved successfully!', 'success');
  } catch (error) {
    console.error('Error:', error);
  }
};

  const saveEvent = async (eventData) => {
    try {
      if (editingEvent) {
        await eventAPI.updateEvent(editingEvent.id, eventData);
      } else {
        await eventAPI.createEvent(eventData);
      }
      
      setShowEventModal(false);
      setEditingEvent(null);
      await loadEvents();
      showToast('Event saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving event:', error);
      showToast('Failed to save event', 'error');
    }
  };

  // ✅ NEW: Handle conflict resolution
  const handleProceedWithConflict = async () => {
    setShowConflictWarning(false);
    await saveEvent(pendingEvent);
    setPendingEvent(null);
    setDetectedConflicts([]);
  };

  const handleCancelWithConflict = () => {
    setShowConflictWarning(false);
    setPendingEvent(null);
    setDetectedConflicts([]);
    // Keep modal open so user can edit
  };

  const handleEditFromDetails = () => {
    setShowEventDetailsModal(false);
    
    if (selectedEvent.isRecurring || selectedEvent.isRecurringInstance) {
      setSelectedRecurringEvent(selectedEvent);
      setShowRecurringEditDialog(true);
    } else {
      setEditingEvent(selectedEvent);
      setSelectedDate(null);
      setShowEventModal(true);
    }
  };

  const handleEditSeriesClick = () => {
    setShowRecurringEditDialog(false);
    
    const eventToEdit = selectedRecurringEvent.isRecurringInstance 
      ? originalEvents.find(e => e.id === selectedRecurringEvent.originalId)
      : selectedRecurringEvent;
    
    if (!eventToEdit) {
      showToast('Error loading event for editing', 'error');
      return;
    }
    
    setEditingEvent(eventToEdit);
    setSelectedDate(null);
    setShowEventModal(true);
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
      console.error('Original event not found for ID:', originalEventId);
      console.log('Available events:', originalEvents);
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
      console.log('Editing existing exception:', existingException);
      setEditingEvent(existingException);
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
      
      console.log('Creating new exception:', exceptionEventData);
      setEditingEvent(exceptionEventData);
    }
    
    setSelectedDate(null);
    setShowEventModal(true);
  } catch (error) {
    console.error('Error setting up instance edit:', error);
    showToast('Failed to prepare event for editing', 'error');
  }
};

  const handleDeleteFromDetails = () => {
    setShowEventDetailsModal(false);
    setEventToDelete(selectedEvent);
    setShowDeleteDialog(true);
  };

  const handleUncancelFromDetails = async () => {
    setShowEventDetailsModal(false);
    
    try {
      const instanceDate = new Date(selectedEvent.startDateTime).toISOString();
      const originalId = selectedEvent.isRecurringInstance 
        ? selectedEvent.originalId 
        : selectedEvent.id;
      
      await eventAPI.uncancelInstance(originalId, instanceDate);
      showToast('Event restored successfully', 'success');
      loadEvents();
    } catch (error) {
      console.error('Error un-canceling event:', error);
      showToast('Failed to restore event', 'error');
    }
  };

  const handleDeleteSeriesClick = () => {
    setShowRecurringDeleteDialog(false);
    
    const eventToDelete = selectedRecurringEvent.isRecurringInstance 
      ? originalEvents.find(e => e.id === selectedRecurringEvent.originalId) || selectedRecurringEvent
      : selectedRecurringEvent;
    
    setEventToDelete(eventToDelete);
    setShowDeleteDialog(true);
  };

  const handleCancelInstanceClick = async (instance) => {
    try {
      if (!instance || !instance.startDateTime) {
        console.error('Invalid instance:', instance);
        showToast('Error: Invalid event instance', 'error');
        return;
      }

      // Format date as ISO string (YYYY-MM-DDTHH:mm:ss)
      const instanceDate = new Date(instance.startDateTime);
      const dateStr = instanceDate.toISOString();
      
      console.log('Canceling instance:', {
        eventId: instance.originalId || instance.id,
        date: dateStr
      });

      const originalId = instance.originalId || instance.id;
      await eventAPI.cancelInstance(originalId, dateStr);
      
      showToast('Event occurrence canceled', 'success');
      loadEvents();
    } catch (error) {
      console.error('Error canceling instance:', error);
      console.error('Error response:', error.response?.data);
      showToast('Failed to cancel event occurrence', 'error');
    }
  };

  const handleDeleteInstanceClick = async (instance) => {
  try {
    if (!instance || !instance.startDateTime) {
      console.error('Invalid instance:', instance);
      showToast('Error: Invalid event instance', 'error');
      return;
    }

    const instanceDate = new Date(instance.startDateTime);
    const dateStr = instanceDate.toISOString();
    
    console.log('Deleting instance:', {
      eventId: instance.originalId || instance.id,
      date: dateStr
    });

    const originalId = instance.originalId || instance.id;
    await eventAPI.deleteInstance(originalId, dateStr);
    
    showToast('Event occurrence deleted permanently', 'success');
    loadEvents();
  } catch (error) {
    console.error('Error deleting instance:', error);
    console.error('Error response:', error.response?.data);
    showToast('Failed to delete event occurrence', 'error');
  }
};


  const handleDeleteClick = (event, e) => {
    if (e) e.stopPropagation();
    setEventToDelete(event);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;

    try {
      if (eventToDelete.isCanceled && eventToDelete.isRecurringInstance) {
        const instanceDate = new Date(eventToDelete.startDateTime).toISOString();
        const originalId = eventToDelete.originalId;
        
        await eventAPI.deleteInstance(originalId, instanceDate);
        showToast('Canceled event permanently deleted', 'success');
        loadEvents();
      } else if (eventToDelete.isRecurringInstance && !eventToDelete.isCanceled) {
        setShowDeleteDialog(false);
        setSelectedRecurringEvent(eventToDelete);
        setShowRecurringDeleteDialog(true);
        return;
      } else {
        await eventAPI.deleteEvent(eventToDelete.id);
        showToast('Event deleted successfully', 'success');
        loadEvents();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Failed to delete event', 'error');
    } finally {
      setEventToDelete(null);
    }
  };

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
    setSelectedDate(clickedDate);
    setEditingEvent(null);
    setShowEventModal(true);
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

  const handleEventClick = (event, e) => {
    if (e) e.stopPropagation();
    
    // ✅ FIXED: For recurring events, show edit dialog
    if (event.isRecurring || event.isRecurringInstance) {
      setSelectedRecurringEvent(event);
      setShowRecurringEditDialog(true);
    } else {
      setSelectedEvent(event);
      setShowEventDetailsModal(true);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your calendar..." />;
  }

  const getDeleteMessage = () => {
    if (!eventToDelete) return '';
    
    if (eventToDelete.isCanceled) {
      return `Are you sure you want to permanently remove this canceled event from your calendar? This will hide it completely.`;
    } else if (eventToDelete.isRecurring || eventToDelete.isRecurringInstance) {
      return `Are you sure you want to delete "${eventToDelete.title}"? This will delete all instances of this recurring event. This action cannot be undone.`;
    } else {
      return `Are you sure you want to delete "${eventToDelete.title}"? This action cannot be undone.`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Academic Calendar</h2>
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setEditingEvent(null);
            setShowEventModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
        >
          <Plus className="w-5 h-5" />
          <span>New Event</span>
        </button>
      </div>

        {/* ✅ NEW: Conflict Alert Banner */}
      {hasConflicts && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-orange-900 mb-1">
                Scheduling Conflicts Detected
              </h4>
              <p className="text-sm text-orange-800">
                You have {conflicts.length} overlapping event{conflicts.length !== 1 ? 's' : ''} in your calendar. 
                Review your schedule to avoid double-booking.
              </p>
            </div>
          </div>
        </div>
      )}


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
              title="Clear search"
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

      {/* Search Results Section */}
      {searchQuery && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Search Results</h3>
          <div className="space-y-3">
            {filteredEvents.length > 0 ? (
              filteredEvents
                .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
                .map(event => (
                  <div 
                    key={event.id} 
                    className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer ${
                      event.isCanceled ? 'opacity-60' : ''
                    }`}
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowEventDetailsModal(true);
                    }}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: event.colorCode || '#3788d8' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className={`font-medium text-gray-800 truncate ${
                            event.isCanceled ? 'line-through' : ''
                          }`}>
                            {event.title}
                          </h4>
                          {event.isRecurring && !event.isCanceled && (
                            <RefreshCw className="w-4 h-4 text-blue-500 flex-shrink-0" title="Recurring event" />
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
                      <span 
                        className="px-2 py-1 text-xs rounded-full whitespace-nowrap text-white"
                        style={{ backgroundColor: event.colorCode || '#3788d8' }}
                      >
                        {event.eventType}
                      </span>
                    </div>
                  </div>
                ))
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

      {/* Calendar Header & Grid */}
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

        {/* Calendar Grid */}
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
                      className={`relative text-xs text-white rounded px-1 py-0.5 truncate cursor-pointer hover:opacity-80 transition ${
                        event.isCanceled ? 'opacity-50' : ''
                      }`}           
                      style={{ 
                        backgroundColor: event.colorCode || '#3788d8',
                        textDecoration: event.isCanceled ? 'line-through' : 'none'
                      }}
                      title={event.isCanceled ? `${event.title} (Canceled)` : event.title}
                    >
                      <div className="flex items-center space-x-1">
                        {event.isRecurring && !event.isCanceled && (
                          <RefreshCw className="w-3 h-3 flex-shrink-0" />
                        )}
                        {event.isCanceled && (
                          <span className="text-xs">🚫</span>
                        )}
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
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventDetailsModal(true);
                  }}
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
                          <RefreshCw className="w-4 h-4 text-blue-500 flex-shrink-0" title="Recurring event" />
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
            {events.filter(e => {
              const eventDate = new Date(e.startDateTime);
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              eventDate.setHours(0, 0, 0, 0);
              return eventDate >= now;
            }).length === 0 && (
              <EmptyState
                icon={CalendarIcon}
                title="No Upcoming Events"
                message="You don't have any upcoming events scheduled. Create one to get started!"
                actionLabel="Create Event"
                onAction={() => {
                  setSelectedDate(new Date());
                  setEditingEvent(null);
                  setShowEventModal(true);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setEventToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={eventToDelete?.isCanceled ? "Remove Canceled Event" : "Delete Event"}
        message={getDeleteMessage()}
        confirmText={eventToDelete?.isCanceled ? "Remove" : "Delete"}
        cancelText="Cancel"
        type="danger"
      />

       {/* Modals */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setEventToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={eventToDelete?.isCanceled ? "Remove Canceled Event" : "Delete Event"}
        message={getDeleteMessage()}
        confirmText={eventToDelete?.isCanceled ? "Remove" : "Delete"}
        cancelText="Cancel"
        type="danger"
      />

      {showEventModal && (
        <EventModal
          onClose={() => {
            setShowEventModal(false);
            setSelectedDate(null);
            setEditingEvent(null);
          }}
          onSave={handleEventSaved}
          userId={user.id}
          initialDate={selectedDate}
          event={editingEvent}
        />
      )}

      {showEventDetailsModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => {
            setShowEventDetailsModal(false);
            setSelectedEvent(null);
          }}
          onEdit={handleEditFromDetails}
          onDelete={handleDeleteFromDetails}
          onUncancel={selectedEvent.isCanceled ? handleUncancelFromDetails : null}
          onViewSeries={selectedEvent.isRecurring ? handleViewSeriesClick : null}  // ✅ ADD THIS
        />
      )}

      <RecurringEditDialog
        isOpen={showRecurringEditDialog}
        onClose={() => {
          setShowRecurringEditDialog(false);
          setSelectedRecurringEvent(null);
        }}
        onEditSeries={handleEditSeriesClick}
        onEditInstance={handleEditInstanceClick}
        eventTitle={selectedRecurringEvent?.title || ''}
      />

      <RecurringDeleteDialog
        isOpen={showRecurringDeleteDialog}
        onClose={() => {
          setShowRecurringDeleteDialog(false);
          setSelectedRecurringEvent(null);
        }}
        onDeleteSeries={handleDeleteSeriesClick}
        onCancelInstance={handleCancelInstanceClick}
        eventTitle={selectedRecurringEvent?.title || ''}
      />

          {/* Recurring Series View Modal */}
          {showRecurringSeriesView && selectedEventForSeries && (
            <RecurringSeriesView
              event={selectedEventForSeries}
              onClose={() => {
                setShowRecurringSeriesView(false);
                setSelectedEventForSeries(null);
              }}
              onRefresh={loadEvents}
              onEditInstance={handleEditInstanceClick}
              onCancelInstance={handleCancelInstanceClick}
              onDeleteInstance={handleDeleteInstanceClick}
            />
          )}

      {/* ✅ NEW: Conflict Warning Modal */}
      <ConflictWarningModal
        isOpen={showConflictWarning}
        conflicts={detectedConflicts}
        onClose={handleCancelWithConflict}
        onProceed={handleProceedWithConflict}
        onCancel={handleCancelWithConflict}
      />
    </div>
  );
};

export default Calendar;
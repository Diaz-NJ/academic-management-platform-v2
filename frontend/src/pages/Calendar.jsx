import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { eventAPI } from '../services/api';
import { Plus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import EventModal from '../components/EventModal';
import ConfirmDialog from '../components/ConfirmDialog';
import EventDetailsModal from '../components/EventDetailsModal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Calendar as CalendarIcon } from 'lucide-react';
import { expandRecurringEvents } from '../utils/recurringUtils';
import RecurringEditDialog from '../components/RecurringEditDialog';
import RecurringDeleteDialog from '../components/RecurringDeleteDialog';

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
      
      // ✅ CHANGED: Store original events separately
      const originalEvents = response.data;
      
      // Expand recurring events for current month view
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const expanded = expandRecurringEvents(originalEvents, startOfMonth, endOfMonth);
      
      setEvents(expanded);
      setOriginalEvents(originalEvents); // ✅ ADD THIS LINE
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEventDetailsModal(true);
  };

  const handleEventSaved = async () => {
    console.log('Event saved, reloading...'); 
    setShowEventModal(false);
    setEditingEvent(null);
    await loadEvents(); // Reload to show changes
    showToast('Changes saved successfully!', 'success');
  };

  const handleEditFromDetails = () => {
    setShowEventDetailsModal(false);
    
    // If it's a recurring event (either original or instance), show dialog
    if (selectedEvent.isRecurring || selectedEvent.isRecurringInstance) {
      setSelectedRecurringEvent(selectedEvent);
      setShowRecurringEditDialog(true);
    } else {
      // Non-recurring, edit normally
      setEditingEvent(selectedEvent);
      setSelectedDate(null);
      setShowEventModal(true);
    }
  };

  const handleEditSeriesClick = () => {
    setShowRecurringEditDialog(false);
    
    // Find the original event
    const eventToEdit = selectedRecurringEvent.isRecurringInstance 
      ? originalEvents.find(e => e.id === selectedRecurringEvent.originalId)
      : selectedRecurringEvent;
    
    if (!eventToEdit) {
      showToast('Error loading event for editing', 'error');
      return;
    }
    
    console.log('Editing series:', eventToEdit); // Debug log
    setEditingEvent(eventToEdit);
    setSelectedDate(null);
    setShowEventModal(true);
  };

const handleEditInstanceClick = async () => {
  setShowRecurringEditDialog(false);
  
  try {
    // Get the original recurring event
    const originalEventId = selectedRecurringEvent.isRecurringInstance 
      ? selectedRecurringEvent.originalId 
      : selectedRecurringEvent.id;
    
    const originalEvent = originalEvents.find(e => e.id === originalEventId);
    
    if (!originalEvent) {
      showToast('Error: Could not find original event', 'error');
      console.error('Original event not found for ID:', originalEventId);
      return;
    }

    // Check if an exception already exists for this date
    const instanceDate = new Date(selectedRecurringEvent.startDateTime);
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
      // Edit existing exception
      console.log('Editing existing exception:', existingException);
      setEditingEvent(existingException);
    } else {
      // Create new exception event data
      const exceptionEventData = {
        ...originalEvent,
        id: null, // This will be a NEW event
        isRecurring: false, // Single event
        isException: true,
        parentEventId: originalEvent.id,
        exceptionDate: instanceDate.toISOString(),
        startDateTime: selectedRecurringEvent.startDateTime,
        endDateTime: selectedRecurringEvent.endDateTime,
        // Clear recurring fields
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
    
    // If it's a recurring event, show options dialog
    if (selectedEvent.isRecurring || selectedEvent.isRecurringInstance) {
      setSelectedRecurringEvent(selectedEvent);
      setShowRecurringDeleteDialog(true);
    } else {
      // Non-recurring, delete normally
      setEventToDelete(selectedEvent);
      setShowDeleteDialog(true);
    }
  };

const handleDeleteSeriesClick = () => {
  setShowRecurringDeleteDialog(false);
  
  // Find the original event to delete
  const eventToDelete = selectedRecurringEvent.isRecurringInstance 
    ? originalEvents.find(e => e.id === selectedRecurringEvent.originalId) || selectedRecurringEvent
    : selectedRecurringEvent;
  
  setEventToDelete(eventToDelete);
  setShowDeleteDialog(true);
  }; 

  const handleCancelInstanceClick = async () => {
    setShowRecurringDeleteDialog(false);
    
    try {
      const instanceDate = new Date(selectedRecurringEvent.startDateTime).toISOString();
      const originalId = selectedRecurringEvent.isRecurringInstance 
        ? selectedRecurringEvent.originalId 
        : selectedRecurringEvent.id;
      
      await eventAPI.cancelInstance(originalId, instanceDate);
      showToast('Event occurrence canceled', 'success');
      loadEvents();
    } catch (error) {
      console.error('Error canceling instance:', error);
      showToast('Failed to cancel event occurrence', 'error');
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
      // ✅ Delete the original event if it's a recurring instance
      const idToDelete = eventToDelete.isRecurringInstance 
        ? eventToDelete.originalId 
        : eventToDelete.id;
      
      await eventAPI.deleteEvent(idToDelete);
      showToast('Event deleted successfully', 'success');
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Failed to delete event', 'error');
    } finally {
      setEventToDelete(null);
    }
  };

const handleEditEvent = (event, e) => {
  e.stopPropagation();
  
  // ✅ CHANGED: Use originalEvents
  const eventToEdit = event.isRecurringInstance 
    ? originalEvents.find(e => e.id === event.originalId)
    : event;
  
  // ✅ ADD: Error handling
  if (!eventToEdit) {
    console.error('Could not find event to edit');
    showToast('Error loading event for editing', 'error');
    return;
  }
  
  setEditingEvent(eventToEdit);
  setSelectedDate(null);
  setShowEventModal(true);
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

  if (loading) {
    return <LoadingSpinner message="Loading your calendar..." />;
  }

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
                      event.isCanceled ? 'opacity-60' : '' // ✅ Dim canceled in search
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
                            event.isCanceled ? 'line-through' : '' // ✅ Strike through in search
                          }`}>
                            {event.title}
                          </h4>
                          {event.isRecurring && !event.isCanceled && (
                            <RefreshCw className="w-4 h-4 text-blue-500 flex-shrink-0" title="Recurring event" />
                          )}
                          {event.isCanceled && ( // ✅ Show canceled badge
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
                        event.isCanceled ? 'opacity-50' : '' // ✅ ADD THIS
                      }`}           
                          style={{ 
                            backgroundColor: event.colorCode || '#3788d8',
                            textDecoration: event.isCanceled ? 'line-through' : 'none' // ✅ ADD THIS
                          }}
                          title={event.isCanceled ? `${event.title} (Canceled)` : event.title} // ✅ UPDATE THIS
                        >
                      {/* ✅ NEW: Recurring indicator on calendar */}
                      <div className="flex items-center space-x-1">
                        {event.isRecurring && !event.isCanceled && (
                          <RefreshCw className="w-3 h-3 flex-shrink-0" />
                        )}
                        {event.isCanceled && ( // ✅ ADD THIS
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
                        {/* ✅ NEW: Recurring indicator */}
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
        title="Delete Event"
        message={`Are you sure you want to delete "${eventToDelete?.title}"?${
          eventToDelete?.isRecurring 
            ? ' This will delete all instances of this recurring event.' 
            : ' This action cannot be undone.'
        }`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          onClose={() => {
            setShowEventModal(false);
            setSelectedDate(null);
            setEditingEvent(null);
          }}
          onSave={handleEventSaved}  // ✅ CHANGE: was just loadEvents
          userId={user.id}
          initialDate={selectedDate}
          event={editingEvent}
        />
      )}

      {/* Event Details Modal */}
      {showEventDetailsModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => {
            setShowEventDetailsModal(false);
            setSelectedEvent(null);
          }}
          onEdit={handleEditFromDetails}
          onDelete={handleDeleteFromDetails}
        />
      )}

      {/* Recurring Edit Dialog */}
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

      {/* Recurring Delete Dialog */}
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
    </div>
  );
};

export default Calendar;
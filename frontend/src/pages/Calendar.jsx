import React, { useState, useEffect, useCallback } from 'react';
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
   // ✅ DEBUG: Check what's being generated
  if (originalEvents.length > 0) {
    console.log('=== RECURRING EVENT DEBUG ===');
    originalEvents.forEach(event => {
      if (event.isRecurring) {
        console.log('Event:', event.title);
        console.log('Pattern:', event.recurrencePattern);
        console.log('Count Setting:', event.recurrenceCount);
        console.log('Days:', event.recurrenceDaysOfWeek);
        
        // Test expansion
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const expanded = expandRecurringEvents([event], startOfMonth, endOfMonth);
        
        console.log('Expanded instances:', expanded.length);
        expanded.forEach((inst, idx) => {
          console.log(`  ${idx + 1}. ${new Date(inst.startDateTime).toLocaleDateString()}`);
        });
      }
    });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    
    console.log('=== ORPHAN DETECTION ===');
    console.log('Total events:', originalEvents.length);

    originalEvents.forEach((event, index) => {
      console.log(`Calendar Event ${index + 1}:`, {
        id: event.id,
        title: event.title,
        isRecurring: event.isRecurring,
        deletedDates: event.deletedDates,
        canceledDates: event.canceledDates
      });
         });

    
    // ✅ Create a Set of ALL event IDs (not just recurring ones)
    const allEventIds = new Set(originalEvents.filter(e => e.id).map(e => e.id));
    
    // ✅ Filter out events that reference a non-existent parent
    const filteredEvents = originalEvents.filter(event => {
      // Check if this event has a parentEventId
      if (event.parentEventId) {
        const parentExists = allEventIds.has(event.parentEventId);
        
        if (!parentExists) {
          console.log('❌ ORPHAN DETECTED - Parent missing:', {
            eventId: event.id,
            title: event.title,
            parentEventId: event.parentEventId,
            isException: event.isException,
            isCanceled: event.isCanceled
          });
          return false; // Filter it out
        }
      }
      
      // Keep events without parentEventId or with valid parent
      return true;
    });
    
    console.log('After filtering:', filteredEvents.length);
    console.log('Orphans removed:', originalEvents.length - filteredEvents.length);
    
    // Expand recurring events
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const expanded = expandRecurringEvents(filteredEvents, startOfMonth, endOfMonth);
    
    setEvents(expanded);
    setOriginalEvents(filteredEvents);
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

    const handleEventClick = (event, e) => {
  if (e) e.stopPropagation();
  
  // Always show details modal first
  setModalState({
    type: 'details',
    data: event,
    extraData: null
  });
};

// ✅ FIXED: Edit from details - detect if recurring properly
const handleEditFromDetails = () => {
  const event = modalState.data;
  
  console.log('handleEditFromDetails called with:', {
    title: event.title,
    isRecurring: event.isRecurring,
    isRecurringInstance: event.isRecurringInstance
  });
  
  // Check if it's a recurring event or instance
  if (event.isRecurring || event.isRecurringInstance) {
    console.log('Opening recurring edit dialog');
    setModalState({
      type: 'recurringEdit',
      data: event,
      extraData: null
    });
  } else {
    console.log('Opening regular edit');
    setModalState({
      type: 'edit',
      data: event,
      extraData: null
    });
  }
};

// ✅ FIXED: Edit series - find the original event properly
const handleEditSeriesClick = () => {
  const event = modalState.data;
  
  // Find the original event from originalEvents
  const eventToEdit = event.isRecurringInstance 
    ? originalEvents.find(e => e.id === event.originalId)
    : event;
  
  if (!eventToEdit) {
    showToast('Error: Could not find event for editing', 'error');
    closeModal();
    return;
  }
  
  setModalState({
    type: 'edit',
    data: eventToEdit,
    extraData: null
  });
};

// ✅ FIXED: Edit instance - create exception properly
const handleEditInstanceClick = async (instance) => {
  try {
    console.log('=== Edit Instance Clicked ===');
    console.log('Instance:', instance);
    
    if (!instance) {
      showToast('Error: Invalid event instance', 'error');
      return;
    }

    // Get the original recurring event
    const originalEventId = instance.originalId || instance.id;
    const originalEvent = originalEvents.find(e => e.id === originalEventId);
    
    if (!originalEvent) {
      showToast('Error: Could not find original event', 'error');
      return;
    }

    const instanceDate = new Date(instance.startDateTime);
    
    // Check if an exception already exists for this date
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
      console.log('Editing existing exception');
      setModalState({
        type: 'edit',
        data: existingException,
        extraData: null
      });
    } else {
      // Create new exception data
      console.log('Creating new exception for instance');
      const exceptionEventData = {
        ...originalEvent,
        id: null, // New event
        isRecurring: false,
        isException: true,
        parentEventId: originalEvent.id,
        exceptionDate: instanceDate.toISOString(),
        startDateTime: instance.startDateTime,
        endDateTime: instance.endDateTime,
        // ✅ IMPORTANT: Store the date to delete AFTER save
        _instanceDateToDelete: instanceDate.toISOString().substring(0, 10),
        _parentEventId: originalEvent.id,
        // Clear recurrence fields
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

// ✅ FIXED: Delete from details - handle canceled instances properly
const handleDeleteFromDetails = () => {
  const event = modalState.data;
  
  // ✅ If it's canceled, always go to regular delete (not recurring dialog)
  if (event.isCanceled) {
    setModalState({
      type: 'delete',
      data: event,
      extraData: null
    });
    return;
  }
  
  // Check if it's a recurring event that's NOT canceled
  if (event.isRecurring || event.isRecurringInstance) {
    // Show recurring delete dialog
    setModalState({
      type: 'recurringDelete',
      data: event,
      extraData: null
    });
  } else {
    // Show regular delete confirm
    setModalState({
      type: 'delete',
      data: event,
      extraData: null
    });
  }
};

// ✅ FIXED: Delete series - find original event properly
const handleDeleteSeriesClick = () => {
  const event = modalState.data;
  
  // Find the original event
  const eventToDelete = event.isRecurringInstance 
    ? originalEvents.find(e => e.id === event.originalId) || event
    : event;
  
  // Close recurring delete dialog and show confirm
  setModalState({
    type: 'delete',
    data: eventToDelete,
    extraData: null
  });
};

// ✅ FIXED: Delete confirm with proper handling
const handleDeleteConfirm = async () => {
  const eventToDelete = modalState.data;
  if (!eventToDelete) return;

  try {
    // ✅ FIXED: Handle canceled recurring instance deletion
    if (eventToDelete.isCanceled && eventToDelete.isRecurringInstance) {
      const instanceDate = new Date(eventToDelete.startDateTime);
      const dateStr = instanceDate.toISOString().substring(0, 10); // Just date part
      const originalId = eventToDelete.originalId || eventToDelete.id;
      
      console.log('🗑️ Deleting canceled instance:', {
        dateStr,
        originalId,
        title: eventToDelete.title
      });
      
      await eventAPI.deleteInstance(originalId, dateStr);
      showToast('Canceled event permanently deleted', 'success');
    } 
    // ✅ Handle regular recurring instance (not canceled)
    else if (eventToDelete.isRecurringInstance && !eventToDelete.isCanceled) {
      const instanceDate = new Date(eventToDelete.startDateTime);
      const dateStr = instanceDate.toISOString().substring(0, 10);
      const originalId = eventToDelete.originalId || eventToDelete.id;
      
      console.log('🗑️ Deleting non-canceled instance:', {
        dateStr,
        originalId,
        title: eventToDelete.title
      });
      
      await eventAPI.deleteInstance(originalId, dateStr);
      showToast('Event instance permanently deleted', 'success');
    }
    // Handle regular event deletion (non-recurring)
    else {
      console.log('🗑️ Deleting regular event:', eventToDelete.id);
      await eventAPI.deleteEvent(eventToDelete.id);
      showToast('Event deleted successfully', 'success');
    }
    
    await loadEvents();
    closeModal();
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    showToast('Failed to delete event', 'error');
  }
};

// ✅ FIXED: Cancel instance with proper date handling
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

// ✅ FIXED: Un-cancel from details
const handleUncancelFromDetails = async () => {
  try {
    const event = modalState.data;
    const instanceDate = new Date(event.startDateTime);
    const dateStr = instanceDate.toISOString().substring(0, 10); // Just the date part
    
    const originalId = event.isRecurringInstance ? event.originalId : event.id;
    
    await eventAPI.uncancelInstance(originalId, dateStr);
    showToast('Event restored successfully', 'success');
    await loadEvents();
    closeModal();
  } catch (error) {
    console.error('Error un-canceling event:', error);
    showToast('Failed to restore event', 'error');
  }
};

// ✅ FIXED: Delete instance permanently
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
    closeModal();
  } catch (error) {
    console.error('Error deleting instance:', error);
    showToast('Failed to delete event occurrence', 'error');
  }
};

// ✅ FIXED: View series - find original event
const handleViewSeriesClick = () => {
  const event = modalState.data;
  
  // Find the original recurring event
  const originalEvent = event.isRecurringInstance 
    ? originalEvents.find(e => e.id === event.originalId)
    : event;
  
  if (!originalEvent) {
    showToast('Error: Could not find original event', 'error');
    closeModal();
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
    <div className="max-w-7xl mx-auto space-y-3 md:space-y-4 px-4 sm:px-6 lg:px-8">
      {/* ✨ Enhanced Page Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-page-title mb-2">Academic Calendar</h1>
            <p className="text-body text-gray-600">
              View and manage your schedule and events
            </p>
          </div>
          <button
            onClick={() => setModalState({ 
              type: 'create', 
              data: null, 
              extraData: new Date() 
            })}
            className="btn-hover flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="btn-text">New Event</span>
          </button>
        </div>
      </div>

      {/* ✨ Enhanced Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="text-label mb-2 block">
          Search Events
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search events by title, type, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-body"
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
          <p className="text-caption mt-2">
            Found <span className="font-semibold">{filteredEvents.length}</span> event{filteredEvents.length !== 1 ? 's' : ''} matching "<span className="font-medium">{searchQuery}</span>"
          </p>
        )}
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="bg-white rounded-lg shadow p-4 md:p-5">
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

       {/* ✨ Enhanced Calendar Section */}
    <div className="bg-white rounded-lg shadow p-6">
      {/* Month navigation with better text */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-section-title">
          {monthName}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          aria-label="Next month"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Calendar grid - OPTIMIZED */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div 
                key={day} 
                className="text-center font-semibold text-gray-700 py-2 md:py-3 text-xs md:text-sm uppercase tracking-wider"
              >
                {day}
              </div>
            ))}

            {/* Calendar days - LARGER CELLS */}
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="min-h-[100px] md:min-h-[140px] lg:min-h-[160px]" />;
              }

              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`min-h-[100px] md:min-h-[140px] lg:min-h-[160px] border rounded-lg p-1.5 md:p-2 cursor-pointer hover:bg-gray-50 transition ${
                    isToday ? 'border-primary border-2 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  {/* Day number - LARGER */}
                  <div className={`text-sm md:text-base font-semibold mb-1 md:mb-2 ${
                    isToday ? 'text-primary' : 'text-gray-700'
                  }`}>
                    {day}
                  </div>
                  
                  {/* Event indicators - LARGER BUBBLES */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => handleEventClick(event, e)}
                        className={`relative text-xs md:text-sm text-white rounded px-1.5 md:px-2 py-1 md:py-1.5 truncate cursor-pointer transition-all duration-200 hover:opacity-80 hover:scale-105 font-medium shadow-sm ${
                          event.isCanceled ? 'opacity-50' : ''
                        }`}
                        style={{ 
                          backgroundColor: event.colorCode || '#3788d8',
                          textDecoration: event.isCanceled ? 'line-through' : 'none',
                          minHeight: '28px'
                        }}
                        title={event.isCanceled ? `${event.title} (Canceled)` : event.title}
                      >
                        <div className="flex items-center space-x-1">
                          {event.isRecurring && !event.isCanceled && (
                            <RefreshCw className="w-3 h-3 flex-shrink-0" />
                          )}
                          {event.isCanceled && <span className="text-xs">🚫</span>}
                          <span className="truncate">{event.title}</span>
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs font-semibold text-gray-600 px-1.5 py-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
    </div>

    {/* ✨ Enhanced Upcoming Events Section */}
    {!searchQuery && (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-section-title mb-1">Upcoming Events</h2>
          <p className="text-body-sm text-gray-600">
            Your next scheduled activities
          </p>
        </div>
        
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
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer border-l-4"
                style={{ borderLeftColor: event.colorCode || '#3788d8' }}
                onClick={() => setModalState({ type: 'details', data: event, extraData: null })}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: event.colorCode || '#3788d8' }}
                  >
                    <span className="text-white text-lg">
                      {(EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.Other).icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-subsection truncate">{event.title}</h3>
                      {event.isRecurring && (
                        <RefreshCw className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-body-sm text-gray-600">
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
                    className="px-3 py-1 text-xs rounded-full whitespace-nowrap text-white font-semibold"
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
          onEditInstance={() => {
            console.log('Calendar: onEditInstance callback triggered');
            handleEditInstanceClick(modalState.data);
          }}
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
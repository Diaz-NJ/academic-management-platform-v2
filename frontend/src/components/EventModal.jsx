import React, { useState, useEffect } from 'react';
import { eventAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { X, RefreshCw } from 'lucide-react';
import ConflictWarningModal from './ConflictWarningModal';

const EventModal = ({ onClose, onSave, userId, initialDate, event = null }) => {
  const { showToast } = useToast();
  const [conflicts, setConflicts] = useState([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [pendingEventData, setPendingEventData] = useState(null);
  
  const formatDateTimeLocal = (dateInput) => {
    let d;
    
    if (typeof dateInput === 'string') {
      d = new Date(dateInput);
    } else {
      d = new Date(dateInput);
    }
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDateLocal = (dateInput) => {
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getInitialDateTime = () => {
    if (event) {
      return event.startDateTime;
    }
    if (initialDate) {
      return initialDate;
    }
    return new Date();
  };

  const defaultDateTime = getInitialDateTime();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'Class',
    startDateTime: '',
    endDateTime: '',
    location: '',
    colorCode: '#3788d8',
    isRecurring: false,
    recurrencePattern: 'WEEKLY',
    recurrenceInterval: 1,
    recurrenceEndDate: '',
    recurrenceDaysOfWeek: '',
    recurrenceEndType: 'never',
    recurrenceCount: 10,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      const startDT = new Date(event.startDateTime);
      const endDT = new Date(event.endDateTime);
      
      let endType = 'never';
      if (!event.isException && !event.parentEventId) {
        if (event.recurrenceCount) {
          endType = 'count';
        } else if (event.recurrenceEndDate) {
          endType = 'date';
        }
      }
      
      setFormData({
        title: event.title || '',
        description: event.description || '',
        eventType: event.eventType || 'Class',
        startDateTime: formatDateTimeLocal(startDT),
        endDateTime: formatDateTimeLocal(endDT),
        location: event.location || '',
        colorCode: event.colorCode || '#3788d8',
        isRecurring: event.isException || event.parentEventId ? false : (event.isRecurring || false),
        recurrencePattern: event.recurrencePattern || 'WEEKLY',
        recurrenceInterval: event.recurrenceInterval || 1,
        recurrenceEndDate: event.recurrenceEndDate ? formatDateLocal(event.recurrenceEndDate) : '',
        recurrenceDaysOfWeek: event.recurrenceDaysOfWeek || '',
        recurrenceEndType: endType,
        recurrenceCount: event.recurrenceCount || 10,
      });
    } else {
      const startDT = initialDate ? new Date(initialDate) : new Date();
      const endDT = new Date(startDT.getTime() + 60 * 60 * 1000);
      
      setFormData({
        title: '',
        description: '',
        eventType: 'Class',
        startDateTime: formatDateTimeLocal(startDT),
        endDateTime: formatDateTimeLocal(endDT),
        location: '',
        colorCode: '#3788d8',
        isRecurring: false,
        recurrencePattern: 'WEEKLY',
        recurrenceInterval: 1,
        recurrenceEndDate: '',
        recurrenceDaysOfWeek: '',
        recurrenceEndType: 'never',
        recurrenceCount: 10,
      });
    }
  }, [event, initialDate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const toggleDayOfWeek = (day) => {
    const days = formData.recurrenceDaysOfWeek ? formData.recurrenceDaysOfWeek.split(',') : [];
    const index = days.indexOf(day);
    
    if (index > -1) {
      days.splice(index, 1);
    } else {
      days.push(day);
    }
    
    setFormData({ ...formData, recurrenceDaysOfWeek: days.join(',') });
  };

const checkForConflicts = async (eventData) => {
  try {
    // Get all events for the user
    const response = await eventAPI.getEvents(userId);
    const allEvents = response.data;
    
    console.log('=== CONFLICT CHECK DEBUG ===');
    console.log('Checking event data:', {
      title: eventData.title,
      startDateTime: eventData.startDateTime,
      endDateTime: eventData.endDateTime
    });
    
    // Parse new event times
    const newStart = new Date(eventData.startDateTime);
    const newEnd = new Date(eventData.endDateTime);
    
    // Find conflicts
    const foundConflicts = allEvents
      .filter(existingEvent => {
        // Skip if editing same event
        if (event && existingEvent.id === event.id) return false;
        
        // ✅ Skip canceled events
        if (existingEvent.isCanceled) return false;
        
        // ✅ NEW: Skip if this specific date is in deletedDates
        if (existingEvent.deletedDates) {
          const deletedList = existingEvent.deletedDates.split(',');
          const newEventDate = newStart.toISOString().substring(0, 10);
          if (deletedList.includes(newEventDate)) {
            console.log('Skipping - date in deletedDates:', newEventDate);
            return false;
          }
        }
        
        // ✅ NEW: Skip if this specific date is in canceledDates
        if (existingEvent.canceledDates) {
          const canceledList = existingEvent.canceledDates.split(',');
          const newEventDate = newStart.toISOString().substring(0, 10);
          if (canceledList.includes(newEventDate)) {
            console.log('Skipping - date in canceledDates:', newEventDate);
            return false;
          }
        }
        
        // Check for time overlap
        const existStart = new Date(existingEvent.startDateTime);
        const existEnd = new Date(existingEvent.endDateTime);
        
        const overlaps = newStart < existEnd && existStart < newEnd;
        
        if (overlaps) {
          console.log('Found overlap with:', {
            title: existingEvent.title,
            existStart: existStart.toISOString(),
            existEnd: existEnd.toISOString()
          });
        }
        
        return overlaps;
      })
      .map(conflictEvent => {
        // Calculate severity
        const existStart = new Date(conflictEvent.startDateTime);
        const existEnd = new Date(conflictEvent.endDateTime);
        
        const overlapStart = new Date(Math.max(newStart, existStart));
        const overlapEnd = new Date(Math.min(newEnd, existEnd));
        const overlapMinutes = (overlapEnd - overlapStart) / (1000 * 60);
        
        let severity = 'minor';
        if (overlapMinutes >= 60) severity = 'severe';
        else if (overlapMinutes >= 30) severity = 'moderate';
        
        return {
          event: conflictEvent,
          severity,
          message: `Overlaps by ${Math.round(overlapMinutes)} minutes`
        };
      });
    
    console.log('Total conflicts found:', foundConflicts.length);
    return foundConflicts;
  } catch (error) {
    console.error('Error checking conflicts:', error);
    return [];
  }
};

const saveEvent = async (eventData) => {
  try {
    if (event) {
      // Check if this is a NEW exception (first time editing an instance)
      if (event.isException && !event.id) {
        console.log('Creating new exception');
        
        // ✅ Create the exception first
        await eventAPI.createEvent(eventData);
        console.log('Exception created');
        
        // ✅ THEN delete the original instance from parent
        if (event._instanceDateToDelete && event._parentEventId) {
          console.log('Deleting original instance:', event._instanceDateToDelete);
          try {
            await eventAPI.deleteInstance(event._parentEventId, event._instanceDateToDelete);
            console.log('Original instance deleted successfully');
          } catch (deleteError) {
            console.error('Error deleting original instance:', deleteError);
            // Don't fail the whole operation if this fails
          }
        }
        
        showToast('Event instance updated successfully!', 'success');
      } else {
        console.log('Updating existing event');
        await eventAPI.updateEvent(event.id, eventData);
        showToast('Event updated successfully!', 'success');
      }
    } else {
      console.log('Creating new event');
      await eventAPI.createEvent(eventData);
      showToast('Event created successfully!', 'success');
    }
    
    onSave();
    onClose();
  } catch (error) {
    console.error('Save error:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};

// REPLACE the existing handleSubmit function with this version:
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const formatDateTimeForBackend = (datetimeLocal) => {
      return datetimeLocal.includes(':00', datetimeLocal.length - 3) 
        ? datetimeLocal 
        : datetimeLocal + ':00';
    };
    
    const eventData = {
      title: formData.title,
      description: formData.description,
      eventType: formData.eventType,
      location: formData.location,
      colorCode: formData.colorCode,
      userId: Number(userId),
      startDateTime: formatDateTimeForBackend(formData.startDateTime),
      endDateTime: formatDateTimeForBackend(formData.endDateTime),
      isRecurring: Boolean(formData.isRecurring),
      recurrencePattern: formData.isRecurring ? formData.recurrencePattern : null,
      recurrenceInterval: formData.isRecurring ? Number(formData.recurrenceInterval) : 1,
      recurrenceEndDate: 
        formData.isRecurring && formData.recurrenceEndType === 'date' && formData.recurrenceEndDate
          ? formData.recurrenceEndDate + 'T23:59:59' 
          : null,
      recurrenceCount:
        formData.isRecurring && formData.recurrenceEndType === 'count'
          ? Number(formData.recurrenceCount)
          : null,
      recurrenceDaysOfWeek: 
        formData.isRecurring && formData.recurrencePattern === 'WEEKLY' 
          ? formData.recurrenceDaysOfWeek 
          : null,
    };
    
    // ✅ CHECK FOR CONFLICTS
    const foundConflicts = await checkForConflicts(eventData);
    
    if (foundConflicts.length > 0 && !event) {
      // Show conflict warning for new events
      setConflicts(foundConflicts);
      setPendingEventData(eventData);
      setShowConflictWarning(true);
      setLoading(false);
      return;
    }
    
    // No conflicts or editing existing event - proceed
    await saveEvent(eventData);
    
  } catch (error) {
    console.error('Error saving event:', error);
    showToast(
      event ? 'Failed to update event. Please try again.' : 'Failed to create event. Please try again.',
      'error'
    );
    setLoading(false);
  }
};


// Add these handler functions:
const handleConflictProceed = async () => {
  setShowConflictWarning(false);
  try {
    await saveEvent(pendingEventData);
  } catch (error) {
    console.error('Error saving event after conflict warning:', error);
    showToast('Failed to create event. Please try again.', 'error');
  }
};

const handleConflictCancel = () => {
  setShowConflictWarning(false);
  setConflicts([]);
  setPendingEventData(null);
  setLoading(false);
};

  const eventTypeColors = {
    Class: '#3788d8',
    Exam: '#dc3545',
    Deadline: '#fd7e14',
    Meeting: '#28a745',
    Other: '#6f42c1',
  };

  const handleEventTypeChange = (e) => {
    const type = e.target.value;
    setFormData({
      ...formData,
      eventType: type,
      colorCode: eventTypeColors[type] || '#3788d8',
    });
  };

  const daysOfWeek = [
    { short: 'MON', full: 'Monday' },
    { short: 'TUE', full: 'Tuesday' },
    { short: 'WED', full: 'Wednesday' },
    { short: 'THU', full: 'Thursday' },
    { short: 'FRI', full: 'Friday' },
    { short: 'SAT', full: 'Saturday' },
    { short: 'SUN', full: 'Sunday' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {event 
              ? (event.isException || event.parentEventId 
                  ? 'Edit Event Instance' 
                  : 'Edit Event')
              : 'Create New Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type *
              </label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleEventTypeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Class">Class</option>
                <option value="Exam">Exam</option>
                <option value="Deadline">Deadline</option>
                <option value="Meeting">Meeting</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                name="colorCode"
                value={formData.colorCode}
                onChange={handleChange}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                name="startDateTime"
                value={formData.startDateTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                name="endDateTime"
                value={formData.endDateTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Room 301"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Recurring Event Section */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="isRecurring"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={handleChange}
                className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary rounded"
              />
              <label htmlFor="isRecurring" className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                <RefreshCw className="w-4 h-4 mr-2" />
                Recurring Event
              </label>
            </div>

            {formData.isRecurring && (
              <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Repeat Pattern
                    </label>
                    <select
                      name="recurrencePattern"
                      value={formData.recurrencePattern}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>

                  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Every
  </label>
  <div className="flex items-center space-x-2">
    <input
      type="number"
      name="recurrenceInterval"
      value={formData.recurrenceInterval}
      onChange={handleChange}
      min="1"
      max="30"
      disabled={formData.recurrencePattern === 'WEEKLY' && formData.recurrenceDaysOfWeek}
      className={`w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
        formData.recurrencePattern === 'WEEKLY' && formData.recurrenceDaysOfWeek
          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
          : ''
      }`}
    />
    <span className="text-sm text-gray-600">
      {formData.recurrencePattern === 'DAILY' && 'day(s)'}
      {formData.recurrencePattern === 'WEEKLY' && 'week(s)'}
      {formData.recurrencePattern === 'MONTHLY' && 'month(s)'}
      {formData.recurrencePattern === 'YEARLY' && 'year(s)'}
    </span>
  </div>
  {formData.recurrencePattern === 'WEEKLY' && formData.recurrenceDaysOfWeek && (
    <p className="text-xs text-gray-500 mt-1">
      ℹ️ Interval is disabled when specific days are selected
    </p>
  )}
</div>
                </div>

                {formData.recurrencePattern === 'WEEKLY' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repeat On
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map(day => {
                        const isSelected = formData.recurrenceDaysOfWeek.includes(day.short);
                        return (
                          <button
                            key={day.short}
                            type="button"
                            onClick={() => toggleDayOfWeek(day.short)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                              isSelected
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title={day.full}
                          >
                            {day.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ends
                  </label>
                  
                  <div className="space-y-2 mb-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recurrenceEndType"
                        value="never"
                        checked={formData.recurrenceEndType === 'never'}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">Never</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recurrenceEndType"
                        value="date"
                        checked={formData.recurrenceEndType === 'date'}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">On date</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recurrenceEndType"
                        value="count"
                        checked={formData.recurrenceEndType === 'count'}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">After</span>
                    </label>
                  </div>

                  {formData.recurrenceEndType === 'date' && (
                    <input
                      type="date"
                      name="recurrenceEndDate"
                      value={formData.recurrenceEndDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  )}

                  {formData.recurrenceEndType === 'count' && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        name="recurrenceCount"
                        value={formData.recurrenceCount}
                        onChange={handleChange}
                        min="1"
                        max="365"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <span className="text-sm text-gray-600">occurrences</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>

          {/* Conflict Warning Modal */}
      {showConflictWarning && (
        <ConflictWarningModal
          isOpen={showConflictWarning}
          onClose={handleConflictCancel}
          onProceed={handleConflictProceed}
          conflicts={conflicts}
          newEvent={pendingEventData}
        />
      )}
    </div>
  );
};

export default EventModal;
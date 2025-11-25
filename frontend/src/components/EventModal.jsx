import React, { useState, useEffect } from 'react';
import { eventAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { X, RefreshCw } from 'lucide-react';

const EventModal = ({ onClose, onSave, userId, initialDate, event = null }) => {
  const { showToast } = useToast();
  
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
    // ✅ NEW: End options
    recurrenceEndType: 'never', // 'never', 'date', 'count'
    recurrenceCount: 10,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('EventModal received event:', event); // ✅ Debug log
    
    if (event) {
      const startDT = new Date(event.startDateTime);
      const endDT = new Date(event.endDateTime);
      
      // ✅ UPDATED: Determine end type (handle exception events)
      let endType = 'never';
      // Exception events should not show recurring options
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
        // ✅ FIXED: Exception events should not be recurring
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
        userId,
        startDateTime: formatDateTimeForBackend(formData.startDateTime),
        endDateTime: formatDateTimeForBackend(formData.endDateTime),
        isRecurring: formData.isRecurring,
        recurrencePattern: formData.isRecurring ? formData.recurrencePattern : null,
        recurrenceInterval: formData.isRecurring ? formData.recurrenceInterval : 1,
        // ✅ UPDATED: Handle end type
        recurrenceEndDate: 
          formData.isRecurring && formData.recurrenceEndType === 'date' && formData.recurrenceEndDate
            ? formData.recurrenceEndDate + 'T23:59:59' 
            : null,
        recurrenceCount:
          formData.isRecurring && formData.recurrenceEndType === 'count'
            ? formData.recurrenceCount
            : null,
        recurrenceDaysOfWeek: 
          formData.isRecurring && formData.recurrencePattern === 'WEEKLY' 
            ? formData.recurrenceDaysOfWeek 
            : null,
      };

      // ✅ FIXED: Handle exception events properly
      if (event) {
        // Check if this is an exception event
        if (event.isException || event.parentEventId) {
          // Include exception-specific fields
          eventData.isException = true;
          eventData.parentEventId = event.parentEventId;
          eventData.exceptionDate = event.exceptionDate;
          
          // If the event has an ID, update it; otherwise create new
          if (event.id) {
            await eventAPI.updateEvent(event.id, eventData);
            showToast('Event instance updated successfully!', 'success');
          } else {
            // First time saving this exception
            await eventAPI.createEvent(eventData);
            
            // Mark the date as canceled in the parent event
            const instanceDate = new Date(event.exceptionDate);
            await eventAPI.cancelInstance(event.parentEventId, instanceDate.toISOString());
            
            showToast('Event instance created successfully!', 'success');
          }
        } else {
          // Regular event update
          await eventAPI.updateEvent(event.id, eventData);
          showToast('Event updated successfully!', 'success');
        }
      } else {
        // Creating new event
        await eventAPI.createEvent(eventData);
        showToast(
          formData.isRecurring ? 'Recurring event created successfully!' : 'Event created successfully!', 
          'success'
        );
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving event:', error);
      showToast(
        event ? 'Failed to update event. Please try again.' : 'Failed to create event. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
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
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <span className="text-sm text-gray-600">
                        {formData.recurrencePattern === 'DAILY' && 'day(s)'}
                        {formData.recurrencePattern === 'WEEKLY' && 'week(s)'}
                        {formData.recurrencePattern === 'MONTHLY' && 'month(s)'}
                        {formData.recurrencePattern === 'YEARLY' && 'year(s)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Days of Week Selection (only for weekly) */}
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

                {/* ✅ NEW: End Options Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ends
                  </label>
                  
                  {/* Radio buttons for end type */}
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

                  {/* Date picker - shown when 'date' is selected */}
                  {formData.recurrenceEndType === 'date' && (
                    <input
                      type="date"
                      name="recurrenceEndDate"
                      value={formData.recurrenceEndDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  )}

                  {/* Count picker - shown when 'count' is selected */}
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
    </div>
  );
};

export default EventModal;
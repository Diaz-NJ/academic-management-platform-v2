import React, { useState, useEffect } from 'react';
import { eventAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { X } from 'lucide-react';

const EventModal = ({ onClose, onSave, userId, initialDate, event = null }) => {
  const { showToast } = useToast();
  
  // ✅ IMPROVED: Better datetime formatting that preserves exact local time
  const formatDateTimeLocal = (dateInput) => {
    let d;
    
    if (typeof dateInput === 'string') {
      // If it's a string from the backend, parse it as local time
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
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      // ✅ FIX: When editing, use the EXACT datetime from the event
      const startDT = new Date(event.startDateTime);
      const endDT = new Date(event.endDateTime);
      
      setFormData({
        title: event.title || '',
        description: event.description || '',
        eventType: event.eventType || 'Class',
        startDateTime: formatDateTimeLocal(startDT),
        endDateTime: formatDateTimeLocal(endDT),
        location: event.location || '',
        colorCode: event.colorCode || '#3788d8',
      });
    } else {
      // Creating new event
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
      });
    }
  }, [event, initialDate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Format datetime for backend (local time, no timezone conversion)
      const formatDateTimeForBackend = (datetimeLocal) => {
        // datetime-local input gives us "2024-11-25T14:30"
        // Backend expects "2024-11-25T14:30:00"
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
      };

      if (event) {
        await eventAPI.updateEvent(event.id, eventData);
        showToast('Event updated successfully!', 'success');
      } else {
        await eventAPI.createEvent(eventData);
        showToast('Event created successfully!', 'success');
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {event ? 'Edit Event' : 'Create New Event'}
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
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { eventAPI } from '../services/api';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import EventModal from '../components/EventModal';

const Calendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    try {
      const response = await eventAPI.getEvents(user.id);
      setEvents(response.data);
    } catch (error) {
      console.error('Error loading events:', error);
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
    setSelectedDate(clickedDate);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Academic Calendar</h2>
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setShowEventModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
        >
          <Plus className="w-5 h-5" />
          <span>New Event</span>
        </button>
      </div>

      {/* Calendar Header */}
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
            const isToday =
              date.toDateString() === new Date().toDateString();

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
                      className={`text-xs text-white rounded px-1 py-0.5 truncate ${getEventTypeColor(event.eventType)}`}
                      title={event.title}
                    >
                      {event.title}
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
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Upcoming Events</h3>
        <div className="space-y-3">
          {events
            .filter(e => new Date(e.startDateTime) >= new Date())
            .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
            .slice(0, 5)
            .map(event => (
              <div key={event.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.eventType)}`} />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{event.title}</h4>
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
                <span className={`px-2 py-1 text-xs rounded-full ${getEventTypeColor(event.eventType)} text-white`}>
                  {event.eventType}
                </span>
              </div>
            ))}
          {events.filter(e => new Date(e.startDateTime) >= new Date()).length === 0 && (
            <p className="text-gray-500 text-center py-4">No upcoming events</p>
          )}
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          onClose={() => {
            setShowEventModal(false);
            setSelectedDate(null);
          }}
          onSave={loadEvents}
          userId={user.id}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
};

export default Calendar;
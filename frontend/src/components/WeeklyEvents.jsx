import React from 'react';
import { Clock, MapPin, Calendar as CalendarIcon } from 'lucide-react';

const WeeklyEvents = ({ events }) => {
  // Get start and end of current week (Sunday to Saturday)
  const getWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { startOfWeek, endOfWeek };
  };

  const { startOfWeek, endOfWeek } = getWeekRange();

  // Filter events for this week
  const weekEvents = events
    .filter(event => {
      const eventDate = new Date(event.startDateTime);
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    })
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

  // Group events by day
  const eventsByDay = {};
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateKey = date.toDateString();
    eventsByDay[dateKey] = {
      dayName: daysOfWeek[i],
      date: date,
      events: []
    };
  }

  weekEvents.forEach(event => {
    const eventDate = new Date(event.startDateTime);
    const dateKey = eventDate.toDateString();
    if (eventsByDay[dateKey]) {
      eventsByDay[dateKey].events.push(event);
    }
  });

  const getEventTypeColor = (type) => {
    const colors = {
      Class: 'bg-blue-500 border-blue-600',
      Exam: 'bg-red-500 border-red-600',
      Deadline: 'bg-orange-500 border-orange-600',
      Meeting: 'bg-green-500 border-green-600',
      Other: 'bg-purple-500 border-purple-600',
    };
    return colors[type] || 'bg-gray-500 border-gray-600';
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (weekEvents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No events scheduled for this week</p>
        <p className="text-sm mt-1">Add events to your calendar to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.values(eventsByDay).map((day) => {
        if (day.events.length === 0) return null;
        
        return (
          <div key={day.date.toDateString()} className="border-l-4 border-primary pl-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-semibold ${isToday(day.date) ? 'text-primary' : 'text-gray-700'}`}>
                {day.dayName}
                {isToday(day.date) && (
                  <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded-full">
                    Today
                  </span>
                )}
              </h3>
              <span className="text-sm text-gray-500">
                {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            
            <div className="space-y-2">
              {day.events.map(event => (
                <div
                  key={event.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border-l-4 ${getEventTypeColor(event.eventType)} bg-gray-50 hover:bg-gray-100 transition`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-800">{event.title}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full text-white ${getEventTypeColor(event.eventType)}`}>
                        {event.eventType}
                      </span>
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(event.startDateTime)}
                        {event.endDateTime && ` - ${formatTime(event.endDateTime)}`}
                      </span>
                      {event.location && (
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyEvents;
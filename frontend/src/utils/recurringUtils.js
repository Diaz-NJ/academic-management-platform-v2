// frontend/src/utils/recurringUtils.js

/**
 * Expands recurring events into individual instances for display
 * @param {Array} events - Array of events from the API
 * @param {Date} viewStart - Start date of the view (e.g., start of month)
 * @param {Date} viewEnd - End date of the view (e.g., end of month)
 * @returns {Array} Expanded array with recurring event instances
 */
export const expandRecurringEvents = (events, viewStart, viewEnd) => {
  const expandedEvents = [];

  events.forEach(event => {
    if (!event.isRecurring) {
      // Non-recurring event, add as-is
      expandedEvents.push(event);
      return;
    }

    // Parse dates
    const eventStart = new Date(event.startDateTime);
    const eventEnd = new Date(event.endDateTime);
    const recurrenceEnd = event.recurrenceEndDate 
      ? new Date(event.recurrenceEndDate) 
      : new Date(viewEnd.getTime() + 365 * 24 * 60 * 60 * 1000); // Default 1 year ahead

    // Calculate duration
    const duration = eventEnd - eventStart;

    // Determine which days to generate events for
    const daysToGenerate = event.recurrenceDaysOfWeek 
      ? event.recurrenceDaysOfWeek.split(',') 
      : [];

    let currentDate = new Date(eventStart);

    // Generate instances based on pattern
    while (currentDate <= viewEnd && currentDate <= recurrenceEnd) {
      if (currentDate >= viewStart) {
        let shouldInclude = false;

        if (event.recurrencePattern === 'WEEKLY' && daysToGenerate.length > 0) {
          // Check if current day matches selected days
          const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
          const currentDay = dayNames[currentDate.getDay()];
          shouldInclude = daysToGenerate.includes(currentDay);
        } else {
          shouldInclude = true;
        }

        if (shouldInclude) {
          const instanceStart = new Date(currentDate);
          const instanceEnd = new Date(currentDate.getTime() + duration);

          expandedEvents.push({
            ...event,
            id: `${event.id}-${instanceStart.toISOString()}`, // Unique ID for each instance
            originalId: event.id, // Keep reference to original
            startDateTime: instanceStart.toISOString(),
            endDateTime: instanceEnd.toISOString(),
            isRecurringInstance: true,
          });
        }
      }

      // Advance to next occurrence
      switch (event.recurrencePattern) {
        case 'DAILY':
          currentDate.setDate(currentDate.getDate() + (event.recurrenceInterval || 1));
          break;
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + 1); // Check each day for weekly
          break;
        case 'MONTHLY':
          currentDate.setMonth(currentDate.getMonth() + (event.recurrenceInterval || 1));
          break;
        case 'YEARLY':
          currentDate.setFullYear(currentDate.getFullYear() + (event.recurrenceInterval || 1));
          break;
        default:
          currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  });

  return expandedEvents;
};

/**
 * Get a human-readable description of the recurrence pattern
 * @param {Object} event - Event with recurrence data
 * @returns {string} Description like "Every Monday and Wednesday"
 */
export const getRecurrenceDescription = (event) => {
  if (!event.isRecurring) return '';

  const { recurrencePattern, recurrenceInterval, recurrenceDaysOfWeek } = event;
  
  let description = 'Repeats ';
  
  if (recurrenceInterval > 1) {
    description += `every ${recurrenceInterval} `;
  } else {
    description += 'every ';
  }

  switch (recurrencePattern) {
    case 'DAILY':
      description += recurrenceInterval > 1 ? 'days' : 'day';
      break;
    case 'WEEKLY':
      if (recurrenceDaysOfWeek) {
        const dayNames = {
          MON: 'Monday',
          TUE: 'Tuesday',
          WED: 'Wednesday',
          THU: 'Thursday',
          FRI: 'Friday',
          SAT: 'Saturday',
          SUN: 'Sunday',
        };
        const days = recurrenceDaysOfWeek.split(',').map(d => dayNames[d]);
        if (days.length === 1) {
          description = `Every ${days[0]}`;
        } else if (days.length === 7) {
          description = 'Every day';
        } else {
          description = `Every ${days.join(', ')}`;
        }
      } else {
        description += recurrenceInterval > 1 ? 'weeks' : 'week';
      }
      break;
    case 'MONTHLY':
      description += recurrenceInterval > 1 ? 'months' : 'month';
      break;
    case 'YEARLY':
      description += recurrenceInterval > 1 ? 'years' : 'year';
      break;
    default:
      description = 'Custom recurrence';
  }

  if (event.recurrenceEndDate) {
    const endDate = new Date(event.recurrenceEndDate);
    description += ` until ${endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })}`;
  }

  return description;
};
// frontend/src/utils/recurringUtils.js - COMPLETE REPLACEMENT

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
    // ✅ Skip exception events - they'll be added manually
    if (event.isException) {
      expandedEvents.push(event);
      return;
    }

    if (!event.isRecurring) {
      expandedEvents.push(event);
      return;
    }

    // Parse dates
    const eventStart = new Date(event.startDateTime);
    const eventEnd = new Date(event.endDateTime);
    
    // ✅ Handle multiple end conditions
    let recurrenceEnd;
    if (event.recurrenceCount) {
      // Calculate end date based on count
      recurrenceEnd = calculateEndDateFromCount(
        eventStart,
        event.recurrencePattern,
        event.recurrenceInterval,
        event.recurrenceCount,
        event.recurrenceDaysOfWeek
      );
    } else if (event.recurrenceEndDate) {
      recurrenceEnd = new Date(event.recurrenceEndDate);
    } else {
      // Default 1 year ahead if no end specified
      recurrenceEnd = new Date(viewEnd.getTime() + 365 * 24 * 60 * 60 * 1000);
    }

    // Calculate duration
    const duration = eventEnd - eventStart;

    // ✅ Parse canceled dates
    const canceledDates = event.canceledDates 
      ? event.canceledDates.split(',').map(d => d.trim()) 
      : [];

    // ✅ NEW: Parse deleted dates
    const deletedDates = event.deletedDates 
      ? event.deletedDates.split(',').map(d => d.trim()) 
      : [];

    // Determine which days to generate events for
    const daysToGenerate = event.recurrenceDaysOfWeek 
      ? event.recurrenceDaysOfWeek.split(',') 
      : [];

    let currentDate = new Date(eventStart);
    let occurrenceCount = 0;
    const maxOccurrences = event.recurrenceCount || Infinity;

    // Generate instances based on pattern
    while (
      currentDate <= viewEnd && 
      currentDate <= recurrenceEnd && 
      occurrenceCount < maxOccurrences
    ) {
      if (currentDate >= viewStart) {
        let shouldInclude = false;

        if (event.recurrencePattern === 'WEEKLY' && daysToGenerate.length > 0) {
          const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
          const currentDay = dayNames[currentDate.getDay()];
          shouldInclude = daysToGenerate.includes(currentDay);
        } else {
          shouldInclude = true;
        }

        if (shouldInclude) {
          const instanceStart = new Date(currentDate);
          const instanceEnd = new Date(currentDate.getTime() + duration);
          
          // ✅ Check if this date is canceled
          // Check if this date is canceled
          const instanceDateStr = instanceStart.toISOString();
          const isCanceled = canceledDates.some(cd => {
            // ✅ Extract just date part for comparison
            const canceledDatePart = cd.includes('T') ? cd.substring(0, 10) : cd;
            const instanceDatePart = instanceDateStr.substring(0, 10);
            return canceledDatePart === instanceDatePart;
          });

          // Check if this date is permanently deleted
          const isDeleted = deletedDates.some(dd => {
            const deletedDatePart = dd.includes('T') ? dd.substring(0, 10) : dd;
            const instanceDatePart = instanceDateStr.substring(0, 10);
            return deletedDatePart === instanceDatePart;
          });

          // ✅ UPDATED: Don't include deleted instances at all
          if (!isDeleted) {
            expandedEvents.push({
              ...event,
              id: `${event.id}-${instanceStart.toISOString()}`,
              originalId: event.id,
              startDateTime: instanceStart.toISOString(),
              endDateTime: instanceEnd.toISOString(),
              isRecurringInstance: true,
              isCanceled: isCanceled,
            });
          }
          
          occurrenceCount++;
        }
      }

      // Advance to next occurrence
      switch (event.recurrencePattern) {
        case 'DAILY':
          currentDate.setDate(currentDate.getDate() + (event.recurrenceInterval || 1));
          break;
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + 1);
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
 * Calculate end date from occurrence count
 */
const calculateEndDateFromCount = (startDate, pattern, interval, count, daysOfWeek) => {
  const start = new Date(startDate);
  let occurrences = 0;
  let current = new Date(start);
  
  const daysToGenerate = daysOfWeek ? daysOfWeek.split(',') : [];
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  while (occurrences < count) {
    let shouldCount = false;

    if (pattern === 'WEEKLY' && daysToGenerate.length > 0) {
      const currentDay = dayNames[current.getDay()];
      shouldCount = daysToGenerate.includes(currentDay);
    } else {
      shouldCount = true;
    }

    if (shouldCount) {
      occurrences++;
      if (occurrences >= count) break;
    }

    switch (pattern) {
      case 'DAILY':
        current.setDate(current.getDate() + (interval || 1));
        break;
      case 'WEEKLY':
        current.setDate(current.getDate() + 1);
        break;
      case 'MONTHLY':
        current.setMonth(current.getMonth() + (interval || 1));
        break;
      case 'YEARLY':
        current.setFullYear(current.getFullYear() + (interval || 1));
        break;
      default:
        current.setDate(current.getDate() + 1);
    }
  }

  return current;
};

/**
 * Get a human-readable description of the recurrence pattern
 */
export const getRecurrenceDescription = (event) => {
  if (!event.isRecurring) return '';

  const { recurrencePattern, recurrenceInterval, recurrenceDaysOfWeek, recurrenceCount, recurrenceEndDate } = event;
  
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

  // ✅ Handle count vs date
  if (recurrenceCount) {
    description += `, ${recurrenceCount} times`;
  } else if (recurrenceEndDate) {
    const endDate = new Date(recurrenceEndDate);
    description += ` until ${endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })}`;
  }

  return description;
};
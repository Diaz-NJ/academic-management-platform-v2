// frontend/src/hooks/useConflictDetection.js

import { useState, useEffect } from 'react';

/**
 * Hook to detect scheduling conflicts between events
 */
export const useConflictDetection = (events) => {
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    if (events && events.length > 0) {
      const detectedConflicts = detectConflicts(events);
      setConflicts(detectedConflicts);
    }
  }, [events]);

  /**
   * Check if a new/edited event conflicts with existing events
   */
  const checkEventConflict = (newEvent, excludeEventId = null) => {
    const conflictingEvents = events.filter(event => {
      // Skip the event being edited
      if (event.id === excludeEventId) return false;
      
      // Skip canceled events
      if (event.isCanceled) return false;

      return doEventsOverlap(event, newEvent);
    });

    return {
      hasConflict: conflictingEvents.length > 0,
      conflicts: conflictingEvents.map(event => ({
        id: `${event.id}-${newEvent.id || 'new'}`,
        event1: newEvent,
        event2: event,
        severity: calculateConflictSeverity(newEvent, event)
      }))
    };
  };

  /**
   * Get all conflicts for a specific event
   */
  const getEventConflicts = (eventId) => {
    return conflicts.filter(conflict => 
      conflict.event1.id === eventId || conflict.event2.id === eventId
    );
  };

  return {
    conflicts,
    checkEventConflict,
    getEventConflicts,
    hasConflicts: conflicts.length > 0
  };
};

/**
 * Detect all conflicts in a list of events
 */
const detectConflicts = (events) => {
  const conflicts = [];
  
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const event1 = events[i];
      const event2 = events[j];
      
      // Skip canceled events
      if (event1.isCanceled || event2.isCanceled) continue;
      
      if (doEventsOverlap(event1, event2)) {
        conflicts.push({
          id: `${event1.id}-${event2.id}`,
          event1,
          event2,
          severity: calculateConflictSeverity(event1, event2)
        });
      }
    }
  }
  
  return conflicts;
};

/**
 * Check if two events overlap in time
 */
const doEventsOverlap = (event1, event2) => {
  const start1 = new Date(event1.startDateTime);
  const end1 = new Date(event1.endDateTime);
  const start2 = new Date(event2.startDateTime);
  const end2 = new Date(event2.endDateTime);
  
  // Events overlap if one starts before the other ends
  return start1 < end2 && start2 < end1;
};

/**
 * Calculate conflict severity (minor, moderate, severe)
 */
const calculateConflictSeverity = (event1, event2) => {
  const start1 = new Date(event1.startDateTime);
  const end1 = new Date(event1.endDateTime);
  const start2 = new Date(event2.startDateTime);
  const end2 = new Date(event2.endDateTime);
  
  // Calculate overlap duration in minutes
  const overlapStart = new Date(Math.max(start1, start2));
  const overlapEnd = new Date(Math.min(end1, end2));
  const overlapMinutes = (overlapEnd - overlapStart) / (1000 * 60);
  
  // Determine severity based on overlap duration
  if (overlapMinutes >= 60) return 'severe';
  if (overlapMinutes >= 30) return 'moderate';
  return 'minor';
};

/**
 * Format conflict message
 */
export const formatConflictMessage = (conflict) => {
  const { event1, event2, severity } = conflict;
  
  const start1 = new Date(event1.startDateTime);
  const start2 = new Date(event2.startDateTime);
  
  const timeStr1 = start1.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  const timeStr2 = start2.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  return `"${event1.title}" at ${timeStr1} overlaps with "${event2.title}" at ${timeStr2}`;
};

export default useConflictDetection;
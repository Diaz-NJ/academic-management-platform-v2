package com.ptc.amp.service;

import com.ptc.amp.model.Event;
import com.ptc.amp.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EventService {
    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public Event createEvent(Event event) {
        if (event.getIsRecurring() == null) {
            event.setIsRecurring(false);
        }
        return eventRepository.save(event);
    }

    public Optional<Event> getEventById(Long id) {
        return eventRepository.findById(id);
    }

    public List<Event> getEventsByUserId(Long userId) {
        return eventRepository.findByUserIdOrderByStartDateTimeAsc(userId);
    }

    public List<Event> getExceptionsByParentId(Long parentId) {
        return eventRepository.findByParentEventId(parentId);
    }

    // Cancel a single instance of a recurring event
    public Event cancelInstance(Long eventId, String dateStr) {
        Optional<Event> eventOpt = eventRepository.findById(eventId);
        if (eventOpt.isEmpty()) {
            throw new RuntimeException("Event not found");
        }

        Event event = eventOpt.get();
        
        // ✅ Extract just the date part (YYYY-MM-DD) from ISO string
        String datePart = dateStr.substring(0, 10);
        
        String currentCanceled = event.getCanceledDates();
        List<String> canceledList = new ArrayList<>();
        
        if (currentCanceled != null && !currentCanceled.isEmpty()) {
            canceledList = new ArrayList<>(Arrays.asList(currentCanceled.split(",")));
        }
        
        if (!canceledList.contains(datePart)) {
            canceledList.add(datePart);
        }
        
        event.setCanceledDates(String.join(",", canceledList));
        return eventRepository.save(event);
    }

    // ✅ Un-cancel an instance (restore it to normal)
    public Event removeCanceledInstance(Long eventId, String dateStr) {
        Optional<Event> eventOpt = eventRepository.findById(eventId);
        if (eventOpt.isEmpty()) {
            throw new RuntimeException("Event not found");
        }

        Event event = eventOpt.get();
        
        String currentCanceled = event.getCanceledDates();
        if (currentCanceled == null || currentCanceled.isEmpty()) {
            return event;
        }
        
        List<String> canceledList = new ArrayList<>(Arrays.asList(currentCanceled.split(",")));
        canceledList.remove(dateStr);
        
        if (canceledList.isEmpty()) {
            event.setCanceledDates(null);
        } else {
            event.setCanceledDates(String.join(",", canceledList));
        }
        
        return eventRepository.save(event);
    }

    // ✅ NEW: Permanently delete an instance
    public Event deleteInstance(Long eventId, String dateStr) {
        Optional<Event> eventOpt = eventRepository.findById(eventId);
        if (eventOpt.isEmpty()) {
            throw new RuntimeException("Event not found");
        }

        Event event = eventOpt.get();
        
        // Add date to deletedDates list
        String currentDeleted = event.getDeletedDates();
        List<String> deletedList = new ArrayList<>();
        
        if (currentDeleted != null && !currentDeleted.isEmpty()) {
            deletedList = new ArrayList<>(Arrays.asList(currentDeleted.split(",")));
        }
        
        if (!deletedList.contains(dateStr)) {
            deletedList.add(dateStr);
        }
        
        event.setDeletedDates(String.join(",", deletedList));
        
        // Also remove from canceledDates if it was there
        String currentCanceled = event.getCanceledDates();
        if (currentCanceled != null && !currentCanceled.isEmpty()) {
            List<String> canceledList = new ArrayList<>(Arrays.asList(currentCanceled.split(",")));
            canceledList.remove(dateStr);
            
            if (canceledList.isEmpty()) {
                event.setCanceledDates(null);
            } else {
                event.setCanceledDates(String.join(",", canceledList));
            }
        }
        
        return eventRepository.save(event);
    }

    public Event updateEvent(Event event) {
        Optional<Event> existingEventOpt = eventRepository.findById(event.getId());
        
        if (existingEventOpt.isPresent()) {
            Event existingEvent = existingEventOpt.get();
            
            existingEvent.setTitle(event.getTitle());
            existingEvent.setDescription(event.getDescription());
            existingEvent.setEventType(event.getEventType());
            existingEvent.setStartDateTime(event.getStartDateTime());
            existingEvent.setEndDateTime(event.getEndDateTime());
            existingEvent.setLocation(event.getLocation());
            existingEvent.setColorCode(event.getColorCode());
            
            existingEvent.setIsRecurring(event.getIsRecurring() != null ? event.getIsRecurring() : false);
            existingEvent.setRecurrencePattern(event.getRecurrencePattern());
            existingEvent.setRecurrenceInterval(event.getRecurrenceInterval());
            existingEvent.setRecurrenceEndDate(event.getRecurrenceEndDate());
            existingEvent.setRecurrenceDaysOfWeek(event.getRecurrenceDaysOfWeek());
            existingEvent.setRecurrenceCount(event.getRecurrenceCount());
            
            if (event.getCanceledDates() != null) {
                existingEvent.setCanceledDates(event.getCanceledDates());
            }
            
            return eventRepository.save(existingEvent);
        }
        
        if (event.getIsRecurring() == null) {
            event.setIsRecurring(false);
        }
        return eventRepository.save(event);
    }

    public boolean deleteEvent(Long id) {
        if (eventRepository.existsById(id)) {
            Optional<Event> eventOpt = eventRepository.findById(id);
            if (eventOpt.isEmpty()) {
                return false;
            }
            
            Event event = eventOpt.get();
            
            if (event.getIsCanceled() != null && event.getIsCanceled()) {
                eventRepository.deleteById(id);
                return true;
            }
            
            List<Event> exceptions = getExceptionsByParentId(id);
            for (Event exception : exceptions) {
                eventRepository.deleteById(exception.getId());
            }
            
            eventRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
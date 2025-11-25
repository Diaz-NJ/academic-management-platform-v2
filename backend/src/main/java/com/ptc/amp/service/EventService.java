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

    // ✅ NEW: Get exception events by parent ID
    public List<Event> getExceptionsByParentId(Long parentId) {
        return eventRepository.findByParentEventId(parentId);
    }

    // ✅ NEW: Cancel a single instance of a recurring event
    public Event cancelInstance(Long eventId, String dateStr) {
        Optional<Event> eventOpt = eventRepository.findById(eventId);
        if (eventOpt.isEmpty()) {
            throw new RuntimeException("Event not found");
        }

        Event event = eventOpt.get();
        
        // Add date to canceledDates list
        String currentCanceled = event.getCanceledDates();
        List<String> canceledList = new ArrayList<>();
        
        if (currentCanceled != null && !currentCanceled.isEmpty()) {
            canceledList = new ArrayList<>(Arrays.asList(currentCanceled.split(",")));
        }
        
        if (!canceledList.contains(dateStr)) {
            canceledList.add(dateStr);
        }
        
        event.setCanceledDates(String.join(",", canceledList));
        return eventRepository.save(event);
    }

    public Event updateEvent(Event event) {
        Optional<Event> existingEventOpt = eventRepository.findById(event.getId());
        
        if (existingEventOpt.isPresent()) {
            Event existingEvent = existingEventOpt.get();
            
            // Update all basic fields
            existingEvent.setTitle(event.getTitle());
            existingEvent.setDescription(event.getDescription());
            existingEvent.setEventType(event.getEventType());
            existingEvent.setStartDateTime(event.getStartDateTime());
            existingEvent.setEndDateTime(event.getEndDateTime());
            existingEvent.setLocation(event.getLocation());
            existingEvent.setColorCode(event.getColorCode());
            
            // Update recurring fields
            existingEvent.setIsRecurring(event.getIsRecurring() != null ? event.getIsRecurring() : false);
            existingEvent.setRecurrencePattern(event.getRecurrencePattern());
            existingEvent.setRecurrenceInterval(event.getRecurrenceInterval());
            existingEvent.setRecurrenceEndDate(event.getRecurrenceEndDate());
            existingEvent.setRecurrenceDaysOfWeek(event.getRecurrenceDaysOfWeek());
            
            // ✅ NEW: Update new fields
            existingEvent.setRecurrenceCount(event.getRecurrenceCount());
            
            // Preserve canceledDates if provided
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
                    
                    // ✅ NEW: If it's a cancelled instance, just remove from parent's canceledDates
                    if (event.getIsCanceled() != null && event.getIsCanceled()) {
                        // This is a cancelled instance marker - we can safely delete it
                        eventRepository.deleteById(id);
                        return true;
                    }
                    
                    // ✅ For regular events, also delete all exception events
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
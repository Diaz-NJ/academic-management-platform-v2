package com.ptc.amp.service;

import com.ptc.amp.model.Event;
import com.ptc.amp.repository.EventRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class EventService {
    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public Event createEvent(Event event) {
        // ✅ Ensure isRecurring is never null
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

    public Event updateEvent(Event event) {
        // ✅ FIX: Properly merge all fields when updating
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
            
            // ✅ FIX: Update recurring fields
            existingEvent.setIsRecurring(event.getIsRecurring() != null ? event.getIsRecurring() : false);
            existingEvent.setRecurrencePattern(event.getRecurrencePattern());
            existingEvent.setRecurrenceInterval(event.getRecurrenceInterval());
            existingEvent.setRecurrenceEndDate(event.getRecurrenceEndDate());
            existingEvent.setRecurrenceDaysOfWeek(event.getRecurrenceDaysOfWeek());
            
            return eventRepository.save(existingEvent);
        }
        
        // If event doesn't exist, create new
        if (event.getIsRecurring() == null) {
            event.setIsRecurring(false);
        }
        return eventRepository.save(event);
    }

    public boolean deleteEvent(Long id) {
        if (eventRepository.existsById(id)) {
            eventRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
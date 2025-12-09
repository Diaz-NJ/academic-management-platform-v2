package com.ptc.amp.service;

import com.ptc.amp.model.Event;
import com.ptc.amp.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

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
        return eventRepository.findActiveEventsByUserId(userId);
    }

    public List<Event> getExceptionsByParentId(Long parentId) {
        return eventRepository.findByParentEventId(parentId);
    }

    public List<Event> getEventsByGroupId(Long groupId) {
        System.out.println("📋 EventService: Getting events for group " + groupId);
        List<Event> events = eventRepository.findByGroupIdOrderByStartDateTimeAsc(groupId);
        System.out.println("✅ Found " + events.size() + " events for group " + groupId);
        return events;
    }

    public Event cancelEvent(Long eventId) {
        System.out.println("🚫 cancelEvent called for ID: " + eventId);
        
        Optional<Event> eventOpt = eventRepository.findById(eventId);
        if (eventOpt.isEmpty()) {
            throw new RuntimeException("Event not found");
        }

        Event event = eventOpt.get();
        System.out.println("✅ Found event: " + event.getTitle());
        System.out.println("   - Is Recurring: " + event.getIsRecurring());
        
        // ✅ FIXED: Always set BOTH canceledDates AND isCanceled for consistency
        String dateStr = event.getStartDateTime().toLocalDate().toString();
        event.setCanceledDates(dateStr);
        event.setIsCanceled(true);
        
        Event saved = eventRepository.saveAndFlush(event);
        System.out.println("✅ Event canceled: " + saved.getTitle());
        System.out.println("   - canceledDates: " + saved.getCanceledDates());
        System.out.println("   - isCanceled: " + saved.getIsCanceled());
        return saved;
    }

    public Event uncancelEvent(Long eventId) {
        System.out.println("♻️ uncancelEvent called for ID: " + eventId);
        
        Optional<Event> eventOpt = eventRepository.findById(eventId);
        if (eventOpt.isEmpty()) {
            throw new RuntimeException("Event not found");
        }

        Event event = eventOpt.get();
        System.out.println("✅ Found event: " + event.getTitle());
        System.out.println("   - Is Recurring: " + event.getIsRecurring());
        
        // ✅ FIXED: Always clear BOTH canceledDates AND isCanceled
        event.setCanceledDates(null);
        event.setIsCanceled(false);
        
        Event saved = eventRepository.saveAndFlush(event);
        System.out.println("✅ Event un-canceled: " + saved.getTitle());
        System.out.println("   - canceledDates: " + saved.getCanceledDates());
        System.out.println("   - isCanceled: " + saved.getIsCanceled());
        return saved;
    }

    public Event cancelInstance(Long eventId, String dateStr) {
        System.out.println("🚫 cancelInstance called");
        System.out.println("   - Event ID: " + eventId);
        System.out.println("   - Date: " + dateStr);
        
        Optional<Event> eventOpt = eventRepository.findById(eventId);
        if (eventOpt.isEmpty()) {
            throw new RuntimeException("Event not found");
        }

        Event event = eventOpt.get();

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
        Event saved = eventRepository.saveAndFlush(event);
        
        System.out.println("✅ Instance canceled: " + saved.getCanceledDates());
        return saved;
    }

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

@Transactional
    public Event deleteInstance(Long eventId, String dateStr) {
        System.out.println("🔍 ========================================");
        System.out.println("🔍 deleteInstance called");
        System.out.println("🔍 Event ID: " + eventId);
        System.out.println("🔍 Date: " + dateStr);
        System.out.println("🔍 ========================================");
        
        // ✅ CRITICAL: Use findById with transaction isolation
        Optional<Event> eventOpt = eventRepository.findById(eventId);
        if (eventOpt.isEmpty()) {
            System.err.println("❌ Event not found: " + eventId);
            throw new RuntimeException("Event not found: " + eventId);
        }

        Event event = eventOpt.get();
        
        System.out.println("✅ Found event:");
        System.out.println("   - ID: " + event.getId());
        System.out.println("   - Title: " + event.getTitle());
        System.out.println("   - Is Recurring: " + event.getIsRecurring());
        System.out.println("   - Current deletedDates: " + event.getDeletedDates());
        System.out.println("   - Current canceledDates: " + event.getCanceledDates());
        
        // ✅ Build new deletedDates
        String currentDeleted = event.getDeletedDates();
        List<String> deletedList = new ArrayList<>();
        
        if (currentDeleted != null && !currentDeleted.isEmpty()) {
            deletedList = new ArrayList<>(Arrays.asList(currentDeleted.split(",")));
        }
        
        if (!deletedList.contains(dateStr)) {
            deletedList.add(dateStr);
            System.out.println("✅ Adding " + dateStr + " to deletedDates");
        }
        
        event.setDeletedDates(String.join(",", deletedList));

        // ✅ Remove from canceledDates if present
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
        
        System.out.println("💾 Saving with deletedDates: " + event.getDeletedDates());
        
        // ✅ Save and flush immediately
        Event saved = eventRepository.saveAndFlush(event);
        
        System.out.println("✅✅✅ Event saved successfully");
        System.out.println("   - Saved deletedDates: " + saved.getDeletedDates());
        System.out.println("🔍 ========================================");
        
        return saved;
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
    System.out.println("🔍 EventService.deleteEvent called for ID: " + id);
    
    // ✅ FIXED: Fetch once and check
    Optional<Event> eventOpt = eventRepository.findById(id);
    
    if (eventOpt.isEmpty()) {
        System.err.println("❌ Event not found: " + id);
        return false;
    }
    
    Event event = eventOpt.get();
    System.out.println("✅ Event found: " + event.getTitle() + " (ID: " + id + ")");

    // Delete child exceptions first
    List<Event> exceptions = getExceptionsByParentId(id);
    System.out.println("🗑️ Deleting " + exceptions.size() + " child exceptions");
    
    for (Event exception : exceptions) {
        eventRepository.deleteById(exception.getId());
        System.out.println("  ✅ Deleted exception ID: " + exception.getId());
    }

    // Delete the main event
    eventRepository.deleteById(id);
    System.out.println("✅ Main event deleted: ID " + id);
    
    // ✅ VERIFY DELETION
    boolean stillExists = eventRepository.existsById(id);
    if (stillExists) {
        System.err.println("❌❌❌ EVENT STILL EXISTS AFTER DELETE! ID: " + id);
        return false;
    }
    
    System.out.println("✅✅✅ Confirmed deletion: ID " + id);
    return true;
}

    public void cleanupOrphanedExceptions(Long userId) {
        List<Event> allEvents = eventRepository.findByUserIdOrderByStartDateTimeAsc(userId);

        List<Event> orphanedExceptions = allEvents.stream()
            .filter(event -> event.getIsException() != null && event.getIsException())
            .filter(event -> {
                Long parentId = event.getParentEventId();
                if (parentId == null) return false;
                return !eventRepository.existsById(parentId);
            })
            .collect(java.util.stream.Collectors.toList());

        for (Event orphan : orphanedExceptions) {
            eventRepository.deleteById(orphan.getId());
        }
        
        System.out.println("Cleaned up " + orphanedExceptions.size() + " orphaned exceptions");
    }
}
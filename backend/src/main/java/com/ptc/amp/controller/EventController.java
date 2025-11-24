package com.ptc.amp.controller;

import com.ptc.amp.model.Event;
import com.ptc.amp.service.EventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody Map<String, Object> eventData) {
        Event event = new Event();
        event.setUserId(((Number) eventData.get("userId")).longValue());
        event.setTitle((String) eventData.get("title"));
        event.setDescription((String) eventData.get("description"));
        event.setEventType((String) eventData.get("eventType"));
        event.setLocation((String) eventData.get("location"));
        event.setColorCode((String) eventData.get("colorCode"));
        
        LocalDateTime startDT = parseDateTime((String) eventData.get("startDateTime"));
        LocalDateTime endDT = parseDateTime((String) eventData.get("endDateTime"));
        
        event.setStartDateTime(startDT);
        event.setEndDateTime(endDT);
        
        // Recurring fields
        if (eventData.containsKey("isRecurring")) {
            Boolean isRecurring = (Boolean) eventData.get("isRecurring");
            event.setIsRecurring(isRecurring != null ? isRecurring : false);
        } else {
            event.setIsRecurring(false);
        }
        
        if (eventData.containsKey("recurrencePattern") && eventData.get("recurrencePattern") != null) {
            event.setRecurrencePattern((String) eventData.get("recurrencePattern"));
        }
        
        if (eventData.containsKey("recurrenceInterval") && eventData.get("recurrenceInterval") != null) {
            event.setRecurrenceInterval(((Number) eventData.get("recurrenceInterval")).intValue());
        }
        
        if (eventData.containsKey("recurrenceEndDate") && eventData.get("recurrenceEndDate") != null) {
            String endDateStr = (String) eventData.get("recurrenceEndDate");
            if (!endDateStr.isEmpty()) {
                event.setRecurrenceEndDate(parseDateTime(endDateStr));
            }
        }
        
        if (eventData.containsKey("recurrenceDaysOfWeek") && eventData.get("recurrenceDaysOfWeek") != null) {
            String days = (String) eventData.get("recurrenceDaysOfWeek");
            if (!days.isEmpty()) {
                event.setRecurrenceDaysOfWeek(days);
            }
        }

        // ✅ NEW: Handle recurrenceCount
        if (eventData.containsKey("recurrenceCount") && eventData.get("recurrenceCount") != null) {
            event.setRecurrenceCount(((Number) eventData.get("recurrenceCount")).intValue());
        }

        // ✅ NEW: Handle exception fields
        if (eventData.containsKey("parentEventId") && eventData.get("parentEventId") != null) {
            event.setParentEventId(((Number) eventData.get("parentEventId")).longValue());
        }

        if (eventData.containsKey("isException") && eventData.get("isException") != null) {
            event.setIsException((Boolean) eventData.get("isException"));
        }

        if (eventData.containsKey("exceptionDate") && eventData.get("exceptionDate") != null) {
            event.setExceptionDate(parseDateTime((String) eventData.get("exceptionDate")));
        }
        
        Event created = eventService.createEvent(event);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Event> getEvent(@PathVariable Long id) {
        return eventService.getEventById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Event>> getUserEvents(@PathVariable Long userId) {
        List<Event> events = eventService.getEventsByUserId(userId);
        return ResponseEntity.ok(events);
    }

    // ✅ NEW: Cancel a single instance
    @PostMapping("/{id}/cancel-instance")
    public ResponseEntity<Event> cancelInstance(
            @PathVariable Long id,
            @RequestBody Map<String, String> data) {
        String dateStr = data.get("date");
        if (dateStr == null || dateStr.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        Event updated = eventService.cancelInstance(id, dateStr);
        return ResponseEntity.ok(updated);
    }

    // ✅ NEW: Get exceptions for a recurring event
    @GetMapping("/{id}/exceptions")
    public ResponseEntity<List<Event>> getExceptions(@PathVariable Long id) {
        List<Event> exceptions = eventService.getExceptionsByParentId(id);
        return ResponseEntity.ok(exceptions);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Event> updateEvent(@PathVariable Long id, @RequestBody Map<String, Object> eventData) {
        Event event = new Event();
        event.setId(id);
        event.setUserId(((Number) eventData.get("userId")).longValue());
        event.setTitle((String) eventData.get("title"));
        event.setDescription((String) eventData.get("description"));
        event.setEventType((String) eventData.get("eventType"));
        event.setLocation((String) eventData.get("location"));
        event.setColorCode((String) eventData.get("colorCode"));
        
        event.setStartDateTime(parseDateTime((String) eventData.get("startDateTime")));
        event.setEndDateTime(parseDateTime((String) eventData.get("endDateTime")));
        
        // Recurring fields
        if (eventData.containsKey("isRecurring")) {
            Boolean isRecurring = (Boolean) eventData.get("isRecurring");
            event.setIsRecurring(isRecurring != null ? isRecurring : false);
        } else {
            event.setIsRecurring(false);
        }
        
        if (eventData.containsKey("recurrencePattern") && eventData.get("recurrencePattern") != null) {
            event.setRecurrencePattern((String) eventData.get("recurrencePattern"));
        }
        
        if (eventData.containsKey("recurrenceInterval") && eventData.get("recurrenceInterval") != null) {
            event.setRecurrenceInterval(((Number) eventData.get("recurrenceInterval")).intValue());
        }
        
        if (eventData.containsKey("recurrenceEndDate") && eventData.get("recurrenceEndDate") != null) {
            String endDateStr = (String) eventData.get("recurrenceEndDate");
            if (!endDateStr.isEmpty()) {
                event.setRecurrenceEndDate(parseDateTime(endDateStr));
            }
        }
        
        if (eventData.containsKey("recurrenceDaysOfWeek") && eventData.get("recurrenceDaysOfWeek") != null) {
            String days = (String) eventData.get("recurrenceDaysOfWeek");
            if (!days.isEmpty()) {
                event.setRecurrenceDaysOfWeek(days);
            }
        }

        // ✅ NEW: Handle recurrenceCount
        if (eventData.containsKey("recurrenceCount") && eventData.get("recurrenceCount") != null) {
            event.setRecurrenceCount(((Number) eventData.get("recurrenceCount")).intValue());
        }

        // ✅ NEW: Preserve canceledDates
        if (eventData.containsKey("canceledDates") && eventData.get("canceledDates") != null) {
            event.setCanceledDates((String) eventData.get("canceledDates"));
        }
        
        Event updated = eventService.updateEvent(event);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        boolean deleted = eventService.deleteEvent(id);
        return deleted ? 
                ResponseEntity.ok(Map.of("success", true, "message", "Event deleted")) :
                ResponseEntity.notFound().build();
    }
    
    private LocalDateTime parseDateTime(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.isEmpty()) {
            return null;
        }
        
        try {
            ZonedDateTime zonedDateTime = ZonedDateTime.parse(dateTimeStr, DateTimeFormatter.ISO_DATE_TIME);
            return zonedDateTime.toLocalDateTime();
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(dateTimeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception ex) {
                System.err.println("Failed to parse datetime: " + dateTimeStr);
                return LocalDateTime.now();
            }
        }
    }
}
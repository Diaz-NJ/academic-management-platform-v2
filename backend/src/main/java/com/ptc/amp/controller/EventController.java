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
        // ✅ DEBUG: Log what we receive
        System.out.println("=== CREATE EVENT DEBUG ===");
        System.out.println("Received data: " + eventData);
        System.out.println("isRecurring: " + eventData.get("isRecurring"));
        System.out.println("recurrencePattern: " + eventData.get("recurrencePattern"));
        
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
        
        // ✅ FIX: Handle recurring fields properly
        if (eventData.containsKey("isRecurring")) {
            Boolean isRecurring = (Boolean) eventData.get("isRecurring");
            event.setIsRecurring(isRecurring != null ? isRecurring : false);
            System.out.println("Set isRecurring to: " + event.getIsRecurring());
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
        
        Event created = eventService.createEvent(event);
        
        // ✅ DEBUG: Log what we saved
        System.out.println("Saved event - isRecurring: " + created.getIsRecurring());
        System.out.println("========================");
        
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
        
        // ✅ DEBUG: Log what we're returning
        System.out.println("=== FETCHING USER EVENTS ===");
        for (Event e : events) {
            System.out.println("Event: " + e.getTitle() + " - isRecurring: " + e.getIsRecurring());
        }
        System.out.println("===========================");
        
        return ResponseEntity.ok(events);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Event> updateEvent(@PathVariable Long id, @RequestBody Map<String, Object> eventData) {
        // ✅ DEBUG: Log what we receive
        System.out.println("=== UPDATE EVENT DEBUG ===");
        System.out.println("Updating event ID: " + id);
        System.out.println("isRecurring: " + eventData.get("isRecurring"));
        
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
        
        // ✅ FIX: Handle recurring fields on update
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
        
        Event updated = eventService.updateEvent(event);
        System.out.println("Updated - isRecurring: " + updated.getIsRecurring());
        System.out.println("========================");
        
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
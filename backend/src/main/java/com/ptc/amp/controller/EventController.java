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
        System.out.println("Received startDateTime: " + eventData.get("startDateTime"));
        
        Event event = new Event();
        event.setUserId(((Number) eventData.get("userId")).longValue());
        event.setTitle((String) eventData.get("title"));
        event.setDescription((String) eventData.get("description"));
        event.setEventType((String) eventData.get("eventType"));
        event.setLocation((String) eventData.get("location"));
        event.setColorCode((String) eventData.get("colorCode"));
        
        LocalDateTime startDT = parseDateTime((String) eventData.get("startDateTime"));
        LocalDateTime endDT = parseDateTime((String) eventData.get("endDateTime"));
        
        // ✅ DEBUG: Log what we parsed
        System.out.println("Parsed startDateTime: " + startDT);
        
        event.setStartDateTime(startDT);
        event.setEndDateTime(endDT);
        
        Event created = eventService.createEvent(event);
        
        // ✅ DEBUG: Log what we're returning
        System.out.println("Returning startDateTime: " + created.getStartDateTime());
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
        return ResponseEntity.ok(events);
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
        
        // Parse datetime strings properly
        event.setStartDateTime(parseDateTime((String) eventData.get("startDateTime")));
        event.setEndDateTime(parseDateTime((String) eventData.get("endDateTime")));
        
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
    
    // Helper method to parse ISO datetime string to LocalDateTime
    private LocalDateTime parseDateTime(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.isEmpty()) {
            return null;
        }
        
        try {
            // Parse ISO string (2024-11-25T14:30:00.000Z) and convert to LocalDateTime
            // This strips the timezone, keeping only the date/time values
            ZonedDateTime zonedDateTime = ZonedDateTime.parse(dateTimeStr, DateTimeFormatter.ISO_DATE_TIME);
            return zonedDateTime.toLocalDateTime();
        } catch (Exception e) {
            // Fallback: if it's already LocalDateTime format (2024-11-25T14:30:00)
            try {
                return LocalDateTime.parse(dateTimeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception ex) {
                System.err.println("Failed to parse datetime: " + dateTimeStr);
                return LocalDateTime.now();
            }
        }
    }
}
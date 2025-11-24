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
        
        // ✅ NEW: Handle recurring fields
        if (eventData.containsKey("isRecurring")) {
            event.setIsRecurring((Boolean) eventData.get("isRecurring"));
        }
        
        if (eventData.containsKey("recurrencePattern")) {
            event.setRecurrencePattern((String) eventData.get("recurrencePattern"));
        }
        
        if (eventData.containsKey("recurrenceInterval")) {
            event.setRecurrenceInterval(((Number) eventData.get("recurrenceInterval")).intValue());
        }
        
        if (eventData.containsKey("recurrenceEndDate") && eventData.get("recurrenceEndDate") != null) {
            event.setRecurrenceEndDate(parseDateTime((String) eventData.get("recurrenceEndDate")));
        }
        
        if (eventData.containsKey("recurrenceDaysOfWeek")) {
            event.setRecurrenceDaysOfWeek((String) eventData.get("recurrenceDaysOfWeek"));
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
        
        // ✅ NEW: Handle recurring fields on update
        if (eventData.containsKey("isRecurring")) {
            event.setIsRecurring((Boolean) eventData.get("isRecurring"));
        }
        
        if (eventData.containsKey("recurrencePattern")) {
            event.setRecurrencePattern((String) eventData.get("recurrencePattern"));
        }
        
        if (eventData.containsKey("recurrenceInterval")) {
            event.setRecurrenceInterval(((Number) eventData.get("recurrenceInterval")).intValue());
        }
        
        if (eventData.containsKey("recurrenceEndDate") && eventData.get("recurrenceEndDate") != null) {
            event.setRecurrenceEndDate(parseDateTime((String) eventData.get("recurrenceEndDate")));
        }
        
        if (eventData.containsKey("recurrenceDaysOfWeek")) {
            event.setRecurrenceDaysOfWeek((String) eventData.get("recurrenceDaysOfWeek"));
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
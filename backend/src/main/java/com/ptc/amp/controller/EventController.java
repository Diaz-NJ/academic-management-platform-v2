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
        try {
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
            
            // Recurring fields - with null safety
            Boolean isRecurring = (Boolean) eventData.get("isRecurring");
            event.setIsRecurring(isRecurring != null ? isRecurring : false);
            
            if (Boolean.TRUE.equals(isRecurring)) {
                // Only set recurring fields if isRecurring is true
                Object patternObj = eventData.get("recurrencePattern");
                if (patternObj != null) {
                    event.setRecurrencePattern((String) patternObj);
                }
                
                Object intervalObj = eventData.get("recurrenceInterval");
                if (intervalObj != null) {
                    event.setRecurrenceInterval(((Number) intervalObj).intValue());
                } else {
                    event.setRecurrenceInterval(1);
                }
                
                // Handle recurrence end date
                Object endDateObj = eventData.get("recurrenceEndDate");
                if (endDateObj != null && !endDateObj.toString().isEmpty()) {
                    String endDateStr = (String) endDateObj;
                    try {
                        event.setRecurrenceEndDate(parseDateTime(endDateStr));
                    } catch (Exception e) {
                        System.err.println("Failed to parse recurrence end date: " + endDateStr);
                        event.setRecurrenceEndDate(null);
                    }
                }
                
                // Handle recurrence count
                Object countObj = eventData.get("recurrenceCount");
                if (countObj != null) {
                    event.setRecurrenceCount(((Number) countObj).intValue());
                }
                
                // Handle days of week
                Object daysObj = eventData.get("recurrenceDaysOfWeek");
                if (daysObj != null && !daysObj.toString().isEmpty()) {
                    event.setRecurrenceDaysOfWeek((String) daysObj);
                }
            }
            
            // Handle exception fields
            Object parentIdObj = eventData.get("parentEventId");
            if (parentIdObj != null) {
                event.setParentEventId(((Number) parentIdObj).longValue());
            }

            Object isExceptionObj = eventData.get("isException");
            if (isExceptionObj != null) {
                event.setIsException((Boolean) isExceptionObj);
            }

            Object exceptionDateObj = eventData.get("exceptionDate");
            if (exceptionDateObj != null && !exceptionDateObj.toString().isEmpty()) {
                event.setExceptionDate(parseDateTime((String) exceptionDateObj));
            }
            
            Event created = eventService.createEvent(event);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            System.err.println("Error creating event: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
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

    @GetMapping("/{id}/exceptions")
    public ResponseEntity<List<Event>> getExceptions(@PathVariable Long id) {
        List<Event> exceptions = eventService.getExceptionsByParentId(id);
        return ResponseEntity.ok(exceptions);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Event> updateEvent(@PathVariable Long id, @RequestBody Map<String, Object> eventData) {
        try {
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
            
            // Recurring fields - with null safety
            Boolean isRecurring = (Boolean) eventData.get("isRecurring");
            event.setIsRecurring(isRecurring != null ? isRecurring : false);
            
            if (Boolean.TRUE.equals(isRecurring)) {
                Object patternObj = eventData.get("recurrencePattern");
                if (patternObj != null) {
                    event.setRecurrencePattern((String) patternObj);
                }
                
                Object intervalObj = eventData.get("recurrenceInterval");
                if (intervalObj != null) {
                    event.setRecurrenceInterval(((Number) intervalObj).intValue());
                } else {
                    event.setRecurrenceInterval(1);
                }
                
                Object endDateObj = eventData.get("recurrenceEndDate");
                if (endDateObj != null && !endDateObj.toString().isEmpty()) {
                    String endDateStr = (String) endDateObj;
                    try {
                        event.setRecurrenceEndDate(parseDateTime(endDateStr));
                    } catch (Exception e) {
                        System.err.println("Failed to parse recurrence end date: " + endDateStr);
                        event.setRecurrenceEndDate(null);
                    }
                }
                
                Object countObj = eventData.get("recurrenceCount");
                if (countObj != null) {
                    event.setRecurrenceCount(((Number) countObj).intValue());
                }
                
                Object daysObj = eventData.get("recurrenceDaysOfWeek");
                if (daysObj != null && !daysObj.toString().isEmpty()) {
                    event.setRecurrenceDaysOfWeek((String) daysObj);
                }
            }

            // Preserve canceledDates
            Object canceledDatesObj = eventData.get("canceledDates");
            if (canceledDatesObj != null) {
                event.setCanceledDates((String) canceledDatesObj);
            }
            
            Event updated = eventService.updateEvent(event);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            System.err.println("Error updating event: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
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
package com.ptc.amp.controller;

import com.ptc.amp.model.Event;
import com.ptc.amp.service.EventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;
import java.util.*;
import com.ptc.amp.model.Task;
import com.ptc.amp.service.TaskService;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventService eventService;
    private final TaskService taskService;

    public EventController(EventService eventService, TaskService taskService) {
    this.eventService = eventService;
    this.taskService = taskService;
    }

    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody Map<String, Object> eventData) {
        try {
            if (!eventData.containsKey("userId") || eventData.get("userId") == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "userId is required"
                ));
            }
            
            if (!eventData.containsKey("title") || eventData.get("title") == null || 
                eventData.get("title").toString().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "title is required"
                ));
            }
            
            if (!eventData.containsKey("startDateTime") || eventData.get("startDateTime") == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "startDateTime is required"
                ));
            }

            Event event = new Event();
            event.setUserId(((Number) eventData.get("userId")).longValue());
            event.setTitle((String) eventData.get("title"));
            
            event.setDescription(eventData.get("description") != null 
                ? (String) eventData.get("description") 
                : null);
            event.setEventType(eventData.get("eventType") != null 
                ? (String) eventData.get("eventType") 
                : "Other");
            event.setLocation(eventData.get("location") != null 
                ? (String) eventData.get("location") 
                : null);
            event.setColorCode(eventData.get("colorCode") != null 
                ? (String) eventData.get("colorCode") 
                : "#3788d8");
            
            LocalDateTime startDT = parseDateTime((String) eventData.get("startDateTime"));
            event.setStartDateTime(startDT);
            
            if (eventData.get("endDateTime") != null && 
                !eventData.get("endDateTime").toString().isEmpty()) {
                LocalDateTime endDT = parseDateTime((String) eventData.get("endDateTime"));
                event.setEndDateTime(endDT);
            } else {
                event.setEndDateTime(startDT.plusHours(1));
            }
            
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
            
        } catch (NumberFormatException e) {
            System.err.println("Number format error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Invalid number format in request data"
            ));
        } catch (ClassCastException e) {
            System.err.println("Type casting error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Invalid data type in request"
            ));
        } catch (Exception e) {
            System.err.println("Error creating event: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to create event: " + e.getMessage()
            ));
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
            
            System.out.println("Canceling instance - Event ID: " + id + ", Date: " + dateStr);
            
            Event updated = eventService.cancelInstance(id, dateStr);
            return ResponseEntity.ok(updated);
        }

    @DeleteMapping("/{id}/cancel-instance")
    public ResponseEntity<?> uncancelInstance(
            @PathVariable Long id,
            @RequestBody Map<String, String> data) {
        String dateStr = data.get("date");
        if (dateStr == null || dateStr.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Date is required"
            ));
        }
        
        try {
            Event updated = eventService.removeCanceledInstance(id, dateStr);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of(
                "success", false,
                "message", "Event not found"
            ));
        }
    }

    @DeleteMapping("/cleanup-orphans/{userId}")
public ResponseEntity<?> cleanupOrphanedEvents(@PathVariable Long userId) {
    try {
        List<Event> allEvents = eventService.getEventsByUserId(userId);

        Set<Long> validEventIds = allEvents.stream()
            .map(Event::getId)
            .collect(Collectors.toSet());

        List<Event> orphanedEvents = allEvents.stream()
            .filter(event -> event.getParentEventId() != null)
            .filter(event -> !validEventIds.contains(event.getParentEventId()))
            .collect(Collectors.toList());

        for (Event orphan : orphanedEvents) {
            eventService.deleteEvent(orphan.getId());
        }
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Cleanup completed",
            "deleted", orphanedEvents.size(),
            "deletedEvents", orphanedEvents.stream()
                .map(e -> Map.of("id", e.getId(), "title", e.getTitle()))
                .collect(Collectors.toList())
        ));
    } catch (Exception e) {
        return ResponseEntity.status(500).body(Map.of(
            "success", false,
            "message", "Cleanup failed: " + e.getMessage()
        ));
    }
}

    @PostMapping("/{id}/delete-instance")
public ResponseEntity<Event> deleteInstance(
        @PathVariable Long id,
        @RequestBody Map<String, String> data) {
    String dateStr = data.get("date");
    if (dateStr == null || dateStr.isEmpty()) {
        return ResponseEntity.badRequest().build();
    }
    
    // ✅ Extract just the date part (first 10 characters)
    String datePart = dateStr.substring(0, 10);
    
    System.out.println("🗑️ Backend: Deleting instance for event ID: " + id + ", date: " + datePart);
    
    Event updated = eventService.deleteInstance(id, datePart);
    return ResponseEntity.ok(updated);
}

    @GetMapping("/{id}/exceptions")
    public ResponseEntity<List<Event>> getExceptions(@PathVariable Long id) {
        List<Event> exceptions = eventService.getExceptionsByParentId(id);
        return ResponseEntity.ok(exceptions);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestBody Map<String, Object> eventData) {
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

            Object canceledDatesObj = eventData.get("canceledDates");
            if (canceledDatesObj != null) {
                event.setCanceledDates((String) canceledDatesObj);
            }
            
            Event updated = eventService.updateEvent(event);
            return ResponseEntity.ok(updated);
            
        } catch (Exception e) {
            System.err.println("Error updating event: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to update event: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
    try {
        Optional<Event> eventOpt = eventService.getEventById(id);
        if (eventOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Event event = eventOpt.get();

        List<Task> allTasks = taskService.getTasksByUserId(event.getUserId());
        for (Task task : allTasks) {
            if (task.getEventId() != null && task.getEventId().equals(id)) {
                task.setEventId(null);
                task.setShowOnCalendar(false);
                taskService.updateTask(task);
            }
        }
        
        boolean deleted = eventService.deleteEvent(id);
        return deleted ? 
                ResponseEntity.ok(Map.of(
                    "success", true, 
                    "message", "Event deleted"
                )) :
                ResponseEntity.notFound().build();
    } catch (Exception e) {
        return ResponseEntity.status(500).body(Map.of(
            "success", false,
            "message", "Failed to delete event: " + e.getMessage()
        ));
    }
}

    private LocalDateTime parseDateTime(String dateTimeStr) {
    try {
        return LocalDateTime.parse(dateTimeStr, DateTimeFormatter.ISO_DATE_TIME);
    } catch (Exception e) {
        return LocalDateTime.parse(dateTimeStr);
    }
}
}
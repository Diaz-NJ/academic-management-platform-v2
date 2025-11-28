// backend/src/main/java/com/ptc/amp/controller/TaskController.java - COMPLETE VERSION
package com.ptc.amp.controller;

import com.ptc.amp.model.Task;
import com.ptc.amp.model.Event;
import com.ptc.amp.service.TaskService;
import com.ptc.amp.service.EventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;
import com.ptc.amp.service.TaskService;
import com.ptc.amp.service.EventService;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService taskService;
    private final EventService eventService;

    public TaskController(TaskService taskService, EventService eventService) {
        this.taskService = taskService;
        this.eventService = eventService;
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        Task created = taskService.createTask(task);
        
        // ✅ AUTOMATIC: If task has a due date, link it to calendar
        if (created.getDueDate() != null) {
            autoLinkToCalendar(created);
        }
        
        return ResponseEntity.ok(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTask(@PathVariable Long id) {
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Task>> getUserTasks(@PathVariable Long userId) {
        List<Task> tasks = taskService.getTasksByUserId(userId);
        return ResponseEntity.ok(tasks);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task task) {
        task.setId(id);
        
        Optional<Task> existingTaskOpt = taskService.getTaskById(id);
        if (existingTaskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Task existingTask = existingTaskOpt.get();
        Task updated = taskService.updateTask(task);
        
        // ✅ AUTOMATIC: Handle calendar linking based on due date changes
        if (updated.getDueDate() != null && !updated.getShowOnCalendar()) {
            // Due date added - create calendar event
            autoLinkToCalendar(updated);
        } else if (updated.getDueDate() != null && updated.getShowOnCalendar()) {
            // Due date changed - update existing calendar event
            updateCalendarEvent(updated);
        } else if (updated.getDueDate() == null && updated.getShowOnCalendar()) {
            // Due date removed - delete calendar event
            removeFromCalendar(updated);
        }
        
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        Optional<Task> taskOpt = taskService.getTaskById(id);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Task task = taskOpt.get();
        
        // If linked to calendar, delete the calendar event first
        if (task.getShowOnCalendar() && task.getEventId() != null) {
            try {
                eventService.deleteEvent(task.getEventId());
            } catch (Exception e) {
                System.err.println("Error deleting linked calendar event: " + e.getMessage());
            }
        }
        
        boolean deleted = taskService.deleteTask(id);
        return deleted ? 
                ResponseEntity.ok(Map.of("success", true, "message", "Task deleted")) :
                ResponseEntity.notFound().build();
    }

    // ✅ NEW: Add task to calendar (creates event)
    @PostMapping("/{id}/add-to-calendar")
    public ResponseEntity<?> addTaskToCalendar(@PathVariable Long id) {
        try {
            Optional<Task> taskOpt = taskService.getTaskById(id);
            if (taskOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Task task = taskOpt.get();
            
            // Check if already on calendar
            if (task.getEventId() != null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Task is already on calendar"
                ));
            }

            // Create calendar event from task
            Event event = new Event();
            event.setUserId(task.getUserId());
            event.setTitle(task.getTitle());
            event.setDescription(task.getDescription());
            event.setEventType("Deadline");
            event.setStartDateTime(task.getDueDate());
            event.setEndDateTime(task.getDueDate().plusHours(1));
            event.setColorCode(getPriorityColor(task.getPriority()));
            
            Event createdEvent = eventService.createEvent(event);
            
            // Link task to event
            task.setEventId(createdEvent.getId());
            task.setShowOnCalendar(true);
            taskService.updateTask(task);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Task added to calendar",
                "eventId", createdEvent.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to add task to calendar: " + e.getMessage()
            ));
        }
    }

    // ✅ NEW: Remove task from calendar (deletes linked event)
    @DeleteMapping("/{id}/remove-from-calendar")
    public ResponseEntity<?> removeTaskFromCalendar(@PathVariable Long id) {
        try {
            Optional<Task> taskOpt = taskService.getTaskById(id);
            if (taskOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Task task = taskOpt.get();
            
            if (task.getEventId() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Task is not on calendar"
                ));
            }

            // Delete the linked event
            eventService.deleteEvent(task.getEventId());
            
            // Unlink task from event
            task.setEventId(null);
            task.setShowOnCalendar(false);
            taskService.updateTask(task);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Task removed from calendar"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to remove task from calendar: " + e.getMessage()
            ));
        }
    }

    // ✅ NEW: Link task to group
    @PostMapping("/{id}/link-to-group/{groupId}")
    public ResponseEntity<?> linkTaskToGroup(
            @PathVariable Long id, 
            @PathVariable Long groupId) {
        try {
            Optional<Task> taskOpt = taskService.getTaskById(id);
            if (taskOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Task task = taskOpt.get();
            task.setGroupId(groupId);
            taskService.updateTask(task);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Task linked to group"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to link task to group: " + e.getMessage()
            ));
        }
    }

    // ✅ NEW: Unlink task from group
    @DeleteMapping("/{id}/unlink-from-group")
    public ResponseEntity<?> unlinkTaskFromGroup(@PathVariable Long id) {
        try {
            Optional<Task> taskOpt = taskService.getTaskById(id);
            if (taskOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Task task = taskOpt.get();
            task.setGroupId(null);
            taskService.updateTask(task);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Task unlinked from group"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to unlink task from group: " + e.getMessage()
            ));
        }
    }

    // ✅ NEW: Get tasks for a specific group
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<Task>> getGroupTasks(@PathVariable Long groupId) {
        List<Task> tasks = taskService.getTasksByGroupId(groupId);
        return ResponseEntity.ok(tasks);
    }

    // ========== HELPER METHODS ==========
    
    private void autoLinkToCalendar(Task task) {
        try {
            Event event = new Event();
            event.setUserId(task.getUserId());
            event.setTitle(task.getTitle() + " (Deadline)");
            event.setDescription(task.getDescription());
            event.setEventType("Deadline");
            event.setStartDateTime(task.getDueDate());
            event.setEndDateTime(task.getDueDate().plusHours(1));
            event.setColorCode(getPriorityColor(task.getPriority()));
            
            Event createdEvent = eventService.createEvent(event);
            
            task.setEventId(createdEvent.getId());
            task.setShowOnCalendar(true);
            taskService.updateTask(task);
            
            System.out.println("✅ Task automatically linked to calendar: " + task.getTitle());
        } catch (Exception e) {
            System.err.println("Error auto-linking to calendar: " + e.getMessage());
        }
    }
    
    private void updateCalendarEvent(Task task) {
        if (task.getEventId() == null) return;
        
        try {
            Optional<Event> eventOpt = eventService.getEventById(task.getEventId());
            if (eventOpt.isPresent()) {
                Event event = eventOpt.get();
                event.setTitle(task.getTitle() + " (Deadline)");
                event.setDescription(task.getDescription());
                event.setStartDateTime(task.getDueDate());
                event.setEndDateTime(task.getDueDate().plusHours(1));
                event.setColorCode(getPriorityColor(task.getPriority()));
                eventService.updateEvent(event);
                
                System.out.println("✅ Calendar event updated: " + task.getTitle());
            }
        } catch (Exception e) {
            System.err.println("Error updating calendar event: " + e.getMessage());
        }
    }
    
    private void removeFromCalendar(Task task) {
        if (task.getEventId() == null) return;
        
        try {
            eventService.deleteEvent(task.getEventId());
            task.setEventId(null);
            task.setShowOnCalendar(false);
            taskService.updateTask(task);
            
            System.out.println("✅ Task removed from calendar: " + task.getTitle());
        } catch (Exception e) {
            System.err.println("Error removing from calendar: " + e.getMessage());
        }
    }

    private String getPriorityColor(String priority) {
        return switch (priority) {
            case "Urgent" -> "#dc3545";
            case "High" -> "#fd7e14";
            case "Medium" -> "#ffc107";
            case "Low" -> "#3788d8";
            default -> "#6c757d";
        };
    }
}
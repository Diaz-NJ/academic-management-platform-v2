package com.ptc.amp.controller;

import com.ptc.amp.model.Task;
import com.ptc.amp.model.Event;
import com.ptc.amp.service.TaskService;
import com.ptc.amp.service.EventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

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
    Long oldEventId = existingTask.getEventId();
    
    // Check if due date changed
    boolean dueDateChanged = false;
    if (existingTask.getDueDate() != null && task.getDueDate() != null) {
        dueDateChanged = !existingTask.getDueDate().equals(task.getDueDate());
    } else if (existingTask.getDueDate() != null || task.getDueDate() != null) {
        dueDateChanged = true;
    }
    
    System.out.println("=== UPDATE TASK DEBUG ===");
    System.out.println("Task ID: " + id);
    System.out.println("Old Event ID: " + oldEventId);
    System.out.println("Old Due Date: " + existingTask.getDueDate());
    System.out.println("New Due Date: " + task.getDueDate());
    System.out.println("Due Date Changed: " + dueDateChanged);
    
    // Step 1: Handle old event deletion if due date changed
    if (oldEventId != null && dueDateChanged) {
    try {
        System.out.println("🗑️ DELETING old event ID: " + oldEventId);
        boolean deleted = eventService.deleteEvent(oldEventId);
        
        if (deleted) {
            System.out.println("✅ Old event deleted successfully");
        } else {
            System.err.println("❌ Failed to delete old event!");
        }
        
        task.setEventId(null);
        task.setShowOnCalendar(false);
    } catch (Exception e) {
        System.err.println("❌ Error deleting old event: " + e.getMessage());
        e.printStackTrace();
    }
}
    
    // Step 2: Update task in database FIRST
    Task updated = taskService.updateTask(task);
    System.out.println("📝 Task updated in database");
    
    // Step 3: Handle calendar event creation/update
    if (updated.getDueDate() != null) {
        if (dueDateChanged || updated.getEventId() == null) {
            // Due date changed or no event - create new one
            System.out.println("📅 Creating new calendar event");
            Long newEventId = createCalendarEventOnly(updated);
            
            if (newEventId != null) {
                // Update task with new event ID (direct DB update, no recursion)
                updated.setEventId(newEventId);
                updated.setShowOnCalendar(true);
                taskService.updateTask(updated);
                System.out.println("✅ Task linked to new event ID: " + newEventId);
            }
        } else {
            // Just update existing event properties
            System.out.println("🔄 Updating existing event properties");
            updateCalendarEventOnly(updated);
        }
    } else if (updated.getEventId() != null) {
        // No due date but event exists - remove it
        System.out.println("🗑️ Removing event (no due date)");
        try {
            eventService.deleteEvent(updated.getEventId());
            updated.setEventId(null);
            updated.setShowOnCalendar(false);
            taskService.updateTask(updated);
        } catch (Exception e) {
            System.err.println("Error removing event: " + e.getMessage());
        }
    }
    
    System.out.println("=== UPDATE COMPLETE ===");
    System.out.println("Final Event ID: " + updated.getEventId());
    System.out.println();
    
    return ResponseEntity.ok(updated);
}

// ✅ NEW: Only creates event, returns event ID - NO task update
private Long createCalendarEventOnly(Task task) {
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
        System.out.println("✅ Event created with ID: " + createdEvent.getId());
        
        return createdEvent.getId();
    } catch (Exception e) {
        System.err.println("❌ Error creating calendar event: " + e.getMessage());
        e.printStackTrace();
        return null;
    }
}

// ✅ NEW: Only updates event - NO task update
private void updateCalendarEventOnly(Task task) {
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
            System.out.println("✅ Event updated successfully");
        } else {
            System.err.println("⚠️ Event not found, creating new one");
            Long newEventId = createCalendarEventOnly(task);
            if (newEventId != null) {
                task.setEventId(newEventId);
                task.setShowOnCalendar(true);
                taskService.updateTask(task);
            }
        }
    } catch (Exception e) {
        System.err.println("❌ Error updating event: " + e.getMessage());
        e.printStackTrace();
    }
}

// New helper method that doesn't call updateTask again
private void createNewCalendarEvent(Task task) {
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
        System.out.println("✅ Created new event with ID: " + createdEvent.getId());
        
        // Update task with new event ID
        task.setEventId(createdEvent.getId());
        task.setShowOnCalendar(true);
        taskService.updateTask(task);
        
        System.out.println("✅ Task linked to new calendar event");
    } catch (Exception e) {
        System.err.println("❌ Error creating calendar event: " + e.getMessage());
        e.printStackTrace();
    }
}

// Separate method for updating existing events
private void updateExistingCalendarEvent(Task task) {
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
            System.out.println("✅ Calendar event updated");
        } else {
            System.err.println("⚠️ Event not found, creating new one");
            createNewCalendarEvent(task);
        }
    } catch (Exception e) {
        System.err.println("❌ Error updating calendar event: " + e.getMessage());
        e.printStackTrace();
    }
}

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        Optional<Task> taskOpt = taskService.getTaskById(id);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Task task = taskOpt.get();
        
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

    @PostMapping("/{id}/add-to-calendar")
    public ResponseEntity<?> addTaskToCalendar(@PathVariable Long id) {
        try {
            Optional<Task> taskOpt = taskService.getTaskById(id);
            if (taskOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Task task = taskOpt.get();
            
            if (task.getEventId() != null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Task is already on calendar"
                ));
            }

            Event event = new Event();
            event.setUserId(task.getUserId());
            event.setTitle(task.getTitle());
            event.setDescription(task.getDescription());
            event.setEventType("Deadline");
            event.setStartDateTime(task.getDueDate());
            event.setEndDateTime(task.getDueDate().plusHours(1));
            event.setColorCode(getPriorityColor(task.getPriority()));
            
            Event createdEvent = eventService.createEvent(event);

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

            eventService.deleteEvent(task.getEventId());

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

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<Task>> getGroupTasks(@PathVariable Long groupId) {
        List<Task> tasks = taskService.getTasksByGroupId(groupId);
        return ResponseEntity.ok(tasks);
    }
    
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
            
            // ✅ FIXED: Update all event properties including date/time
            event.setTitle(task.getTitle());
            event.setDescription(task.getDescription());
            event.setStartDateTime(task.getDueDate());
            event.setEndDateTime(task.getDueDate().plusHours(1));
            event.setColorCode(getPriorityColor(task.getPriority()));
            event.setEventType("Deadline"); // Ensure it stays as deadline
            
            eventService.updateEvent(event);
            
            System.out.println("✅ Calendar event updated successfully: " + task.getTitle());
        } else {
            System.err.println("⚠️ Calendar event not found, creating new one");
            // Event doesn't exist - create a new one
            task.setEventId(null);
            task.setShowOnCalendar(false);
            autoLinkToCalendar(task);
        }
    } catch (Exception e) {
        System.err.println("❌ Error updating calendar event: " + e.getMessage());
        e.printStackTrace();
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
package com.ptc.amp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String subject;

    @Column(nullable = false)
    private LocalDateTime dueDate;

    @Column(length = 20)
    private String priority; // Low, Medium, High, Urgent

    @Column(length = 20)
    private String status; // Pending, In Progress, Completed

    // ✅ NEW: Link to calendar event
    @Column(name = "event_id")
    private Long eventId;

    // ✅ NEW: Link to group
    @Column(name = "group_id")
    private Long groupId;

    // ✅ NEW: Flag to show on calendar
    @Column(name = "show_on_calendar")
    private Boolean showOnCalendar = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public Task() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.showOnCalendar = false;
    }

    // Existing Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { 
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // ✅ NEW: Getters and Setters
    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }

    public Long getGroupId() { return groupId; }
    public void setGroupId(Long groupId) { this.groupId = groupId; }

    public Boolean getShowOnCalendar() { return showOnCalendar; }
    public void setShowOnCalendar(Boolean showOnCalendar) { 
        this.showOnCalendar = showOnCalendar;
        this.updatedAt = LocalDateTime.now();
    }
}
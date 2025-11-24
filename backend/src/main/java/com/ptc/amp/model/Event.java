package com.ptc.amp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String eventType;

    @Column(nullable = false)
    private LocalDateTime startDateTime;

    private LocalDateTime endDateTime;

    @Column(length = 255)
    private String location;

    @Column(length = 7)
    private String colorCode;

    // Recurring event fields
    @Column(name = "is_recurring")
    private Boolean isRecurring = false;

    @Column(name = "recurrence_pattern", length = 20)
    private String recurrencePattern;

    @Column(name = "recurrence_interval")
    private Integer recurrenceInterval = 1;

    @Column(name = "recurrence_end_date")
    private LocalDateTime recurrenceEndDate;

    @Column(name = "recurrence_days_of_week", length = 50)
    private String recurrenceDaysOfWeek;

    // ✅ NEW: End after X occurrences
    @Column(name = "recurrence_count")
    private Integer recurrenceCount;

    // ✅ NEW: For single instance exceptions
    @Column(name = "parent_event_id")
    private Long parentEventId;

    @Column(name = "is_exception")
    private Boolean isException = false;

    @Column(name = "exception_date")
    private LocalDateTime exceptionDate;

    // ✅ NEW: For canceled instances
    @Column(name = "is_canceled")
    private Boolean isCanceled = false;

    // ✅ NEW: Canceled dates (comma-separated ISO dates)
    @Column(name = "canceled_dates", columnDefinition = "TEXT")
    private String canceledDates;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Event() {
        this.createdAt = LocalDateTime.now();
        this.colorCode = "#3788d8";
        this.isRecurring = false;
        this.recurrenceInterval = 1;
        this.isException = false;
        this.isCanceled = false;
    }

    // Existing getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public LocalDateTime getStartDateTime() { return startDateTime; }
    public void setStartDateTime(LocalDateTime startDateTime) { this.startDateTime = startDateTime; }

    public LocalDateTime getEndDateTime() { return endDateTime; }
    public void setEndDateTime(LocalDateTime endDateTime) { this.endDateTime = endDateTime; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getColorCode() { return colorCode; }
    public void setColorCode(String colorCode) { this.colorCode = colorCode; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public Boolean getIsRecurring() { return isRecurring; }
    public void setIsRecurring(Boolean isRecurring) { this.isRecurring = isRecurring; }

    public String getRecurrencePattern() { return recurrencePattern; }
    public void setRecurrencePattern(String recurrencePattern) { this.recurrencePattern = recurrencePattern; }

    public Integer getRecurrenceInterval() { return recurrenceInterval; }
    public void setRecurrenceInterval(Integer recurrenceInterval) { this.recurrenceInterval = recurrenceInterval; }

    public LocalDateTime getRecurrenceEndDate() { return recurrenceEndDate; }
    public void setRecurrenceEndDate(LocalDateTime recurrenceEndDate) { this.recurrenceEndDate = recurrenceEndDate; }

    public String getRecurrenceDaysOfWeek() { return recurrenceDaysOfWeek; }
    public void setRecurrenceDaysOfWeek(String recurrenceDaysOfWeek) { this.recurrenceDaysOfWeek = recurrenceDaysOfWeek; }

    // ✅ NEW getters and setters
    public Integer getRecurrenceCount() { return recurrenceCount; }
    public void setRecurrenceCount(Integer recurrenceCount) { this.recurrenceCount = recurrenceCount; }

    public Long getParentEventId() { return parentEventId; }
    public void setParentEventId(Long parentEventId) { this.parentEventId = parentEventId; }

    public Boolean getIsException() { return isException; }
    public void setIsException(Boolean isException) { this.isException = isException; }

    public LocalDateTime getExceptionDate() { return exceptionDate; }
    public void setExceptionDate(LocalDateTime exceptionDate) { this.exceptionDate = exceptionDate; }

    public Boolean getIsCanceled() { return isCanceled; }
    public void setIsCanceled(Boolean isCanceled) { this.isCanceled = isCanceled; }

    public String getCanceledDates() { return canceledDates; }
    public void setCanceledDates(String canceledDates) { this.canceledDates = canceledDates; }
}
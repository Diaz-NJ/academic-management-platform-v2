package com.ptc.amp.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class Group {
    private Long id;
    private Long createdBy; // User ID of creator
    private String groupNumber; // e.g., "Group 1", "Team A" (nullable)
    private String groupName;   // Name of the group
    private String subject;     // Subject this group is for
    private String taskDescription; // What task/project this group is working on
    private List<GroupMember> members; // List of member IDs and names
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Group() {
        this.members = new ArrayList<>();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Inner class for members
    public static class GroupMember {
        private Long userId;
        private String name;
        private String role; // "Admin" or "Member"

        public GroupMember() {}

        public GroupMember(Long userId, String name, String role) {
            this.userId = userId;
            this.name = name;
            this.role = role;
        }

        // Getters and Setters
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

    public String getGroupNumber() { return groupNumber; }
    public void setGroupNumber(String groupNumber) { this.groupNumber = groupNumber; }

    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getTaskDescription() { return taskDescription; }
    public void setTaskDescription(String taskDescription) { this.taskDescription = taskDescription; }

    public List<GroupMember> getMembers() { return members; }
    public void setMembers(List<GroupMember> members) { this.members = members; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Helper methods
    public void addMember(GroupMember member) {
        this.members.add(member);
        this.updatedAt = LocalDateTime.now();
    }

    public void removeMember(Long userId) {
        this.members.removeIf(m -> m.getUserId().equals(userId));
        this.updatedAt = LocalDateTime.now();
    }

    public int getMemberCount() {
        return this.members.size();
    }
}
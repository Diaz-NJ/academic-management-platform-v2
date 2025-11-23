package com.ptc.amp.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "`groups`")
public class Group {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long createdBy;

    @Column(length = 100)
    private String groupNumber;

    @Column(nullable = false, length = 255)
    private String groupName;

    @Column(nullable = false, length = 255)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String taskDescription;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<GroupMember> members = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public Group() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Inner class for members
    @Entity
    @Table(name = "group_members")
    public static class GroupMember {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne
        @JoinColumn(name = "group_id", nullable = false)
        @JsonBackReference
        private Group group;

        @Column(nullable = false)
        private Long userId;

        @Column(nullable = false, length = 255)
        private String name;

        @Column(length = 20)
        private String role; // "Leader" or "Member"

        public GroupMember() {}

        public GroupMember(Long userId, String name, String role) {
            this.userId = userId;
            this.name = name;
            this.role = role;
        }

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Group getGroup() { return group; }
        public void setGroup(Group group) { this.group = group; }

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
    public void setMembers(List<GroupMember> members) { 
        this.members.clear();
        if (members != null) {
            members.forEach(this::addMember);
        }
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Helper methods
    public void addMember(GroupMember member) {
        member.setGroup(this);
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
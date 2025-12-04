// GroupMember.java - NEW FILE (separate class)
package com.ptc.amp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "group_members")
public class GroupMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 20)
    private String role = "Member";

    public GroupMember() {}

    public GroupMember(Long userId, String name, String role) {
        this.userId = userId;
        this.name = name;
        this.role = role;
    }

    // Getters and setters
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
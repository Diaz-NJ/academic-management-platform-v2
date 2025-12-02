package com.ptc.amp.controller;

import com.ptc.amp.model.Group;
import com.ptc.amp.service.GroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.ptc.amp.service.TaskService;
import com.ptc.amp.model.Task;
import com.ptc.amp.model.User;
import com.ptc.amp.service.AuthService;

import java.util.*;

@RestController
@RequestMapping("/api/groups")
public class GroupController {
    private final GroupService groupService;
    private final TaskService taskService;
    private final AuthService authService;

    public GroupController(GroupService groupService, TaskService taskService, AuthService authService) {
    this.groupService = groupService;
    this.taskService = taskService;
    this.authService = authService; 
    }

    @PostMapping
public ResponseEntity<?> createGroup(@RequestBody Group group) {
    try {
        System.out.println("=== CREATE GROUP REQUEST ===");
        System.out.println("Group Name: " + group.getGroupName());
        System.out.println("Created By: " + group.getCreatedBy());
        
        if (group.getGroupName() == null || group.getGroupName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Group name is required"
            ));
        }
        
        if (group.getCreatedBy() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Creator ID is required"
            ));
        }

        if (group.getMembers() == null || group.getMembers().isEmpty()) {
            System.out.println("No members provided - adding creator as leader");

            Optional<User> creator = authService.getUserById(group.getCreatedBy());
            if (creator.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Creator user not found"
                ));
            }

            Group.GroupMember leaderMember = new Group.GroupMember(
                creator.get().getId(),
                creator.get().getFullName(),
                "Leader"
            );
            group.addMember(leaderMember);
            
            System.out.println("✅ Added creator as leader: " + creator.get().getFullName());
        }
        
        Group created = groupService.createGroup(group);
        
        System.out.println("✅ Group created successfully! ID: " + created.getId());
        System.out.println("✅ Final members count: " + created.getMembers().size());
        
        return ResponseEntity.ok(created);
        
    } catch (Exception e) {
        System.err.println("❌ ERROR creating group: " + e.getMessage());
        e.printStackTrace();
        
        return ResponseEntity.status(500).body(Map.of(
            "success", false,
            "message", "Failed to create group: " + e.getMessage()
        ));
    }
}

    @GetMapping("/{id}")
    public ResponseEntity<Group> getGroup(@PathVariable Long id) {
        return groupService.getGroupById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Group>> getUserGroups(@PathVariable Long userId) {
        List<Group> groups = groupService.getGroupsByUserId(userId);
        return ResponseEntity.ok(groups);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Group> updateGroup(@PathVariable Long id, @RequestBody Group group) {
        group.setId(id);
        Group updated = groupService.updateGroup(group);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
public ResponseEntity<?> deleteGroup(@PathVariable Long id) {
    try {
        List<Task> linkedTasks = taskService.getTasksByGroupId(id);
        for (Task task : linkedTasks) {
            task.setGroupId(null);
            taskService.updateTask(task);
        }
        
        boolean deleted = groupService.deleteGroup(id);
        return deleted ? 
                ResponseEntity.ok(Map.of(
                    "success", true, 
                    "message", "Group deleted",
                    "unlinkedTasks", linkedTasks.size()
                )) :
                ResponseEntity.notFound().build();
    } catch (Exception e) {
        return ResponseEntity.status(500).body(Map.of(
            "success", false,
            "message", "Failed to delete group: " + e.getMessage()
        ));
    }
}

    @PostMapping("/{id}/members")
    public ResponseEntity<?> addMember(
            @PathVariable Long id, 
            @RequestBody Group.GroupMember member) {
        boolean added = groupService.addMemberToGroup(id, member);
        return added ?
                ResponseEntity.ok(Map.of("success", true, "message", "Member added")) :
                ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<?> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId) {
        boolean removed = groupService.removeMemberFromGroup(id, userId);
        return removed ?
                ResponseEntity.ok(Map.of("success", true, "message", "Member removed")) :
                ResponseEntity.notFound().build();
    }

     @PostMapping("/{groupId}/leave")
    public ResponseEntity<?> leaveGroup(
            @PathVariable Long groupId,
            @RequestBody Map<String, Object> data) {
        try {
            Long userId = ((Number) data.get("userId")).longValue();

            Optional<Group> groupOpt = groupService.getGroupById(groupId);
            if (groupOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Group group = groupOpt.get();
            
            boolean isMember = group.getMembers().stream()
                .anyMatch(m -> m.getUserId().equals(userId));
            
            if (!isMember) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "You are not a member of this group"
                ));
            }

            long leaderCount = group.getMembers().stream()
                .filter(m -> "Leader".equals(m.getRole()))
                .count();
            
            boolean isLeader = group.getMembers().stream()
                .anyMatch(m -> m.getUserId().equals(userId) && "Leader".equals(m.getRole()));
            
            if (isLeader && leaderCount == 1) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "You cannot leave as you are the only leader. Transfer leadership or delete the group."
                ));
            }

            groupService.removeMemberFromGroup(groupId, userId);

            groupOpt = groupService.getGroupById(groupId);
            if (groupOpt.isPresent() && groupOpt.get().getMembers().isEmpty()) {
                List<Task> linkedTasks = taskService.getTasksByGroupId(groupId);
                for (Task task : linkedTasks) {
                    task.setGroupId(null);
                    taskService.updateTask(task);
                }
                
                groupService.deleteGroup(groupId);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Left group successfully. Group was deleted as no members remain.",
                    "groupDeleted", true
                ));
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Left group successfully"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Failed to leave group: " + e.getMessage()
            ));
        }
    }

@PutMapping("/{groupId}/members/{userId}/role")
public ResponseEntity<?> changeMemberRole(
        @PathVariable Long groupId,
        @PathVariable Long userId,
        @RequestBody Map<String, Object> data,
        @RequestHeader("Session-Id") String sessionId) {
    try {
        Optional<Long> requestingUserIdOpt = authService.validateSession(sessionId);
        if (requestingUserIdOpt.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", "Invalid session"
            ));
        }
        
        Long requestingUserId = requestingUserIdOpt.get();
        String newRole = (String) data.get("role");

        Optional<Group> groupOpt = groupService.getGroupById(groupId);
        if (groupOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Group group = groupOpt.get();

        boolean isLeader = group.getMembers().stream()
            .anyMatch(m -> m.getUserId().equals(requestingUserId) && "Leader".equals(m.getRole()));
        
        if (!isLeader) {
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", "Only leaders can change member roles"
            ));
        }

        long leaderCount = group.getMembers().stream()
            .filter(m -> "Leader".equals(m.getRole()))
            .count();
        
        boolean isDemotingLeader = group.getMembers().stream()
            .anyMatch(m -> m.getUserId().equals(userId) && "Leader".equals(m.getRole()));
        
        if (isDemotingLeader && leaderCount == 1 && "Member".equals(newRole)) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Cannot demote the last leader. Promote someone else first."
            ));
        }

        boolean updated = groupService.updateMemberRole(groupId, userId, newRole);
        
        if (updated) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Role updated successfully"
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to update role"
            ));
        }
        
    } catch (Exception e) {
        return ResponseEntity.status(500).body(Map.of(
            "success", false,
            "message", "Failed to update role: " + e.getMessage()
        ));
    }
}
}
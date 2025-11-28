package com.ptc.amp.controller;

import com.ptc.amp.model.Group;
import com.ptc.amp.service.GroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import com.ptc.amp.service.TaskService;
import com.ptc.amp.model.Task;
import java.util.List

@RestController
@RequestMapping("/api/groups")
public class GroupController {
    private final GroupService groupService;
    private final TaskService taskService;

    public GroupController(GroupService groupService, TaskService taskService) {
        this.groupService = groupService;
        this.taskService = taskService;
    }

    @PostMapping
    public ResponseEntity<Group> createGroup(@RequestBody Group group) {
        Group created = groupService.createGroup(group);
        return ResponseEntity.ok(created);
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
        // ✅ FIXED: Unlink all tasks from this group before deleting
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
}
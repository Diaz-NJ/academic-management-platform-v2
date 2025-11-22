package com.ptc.amp.controller;

import com.ptc.amp.model.Group;
import com.ptc.amp.service.GroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class GroupController {
    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
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
        boolean deleted = groupService.deleteGroup(id);
        return deleted ? 
                ResponseEntity.ok(Map.of("success", true, "message", "Group deleted")) :
                ResponseEntity.notFound().build();
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
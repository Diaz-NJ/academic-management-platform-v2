package com.ptc.amp.controller;

import com.ptc.amp.model.Discussion;
import com.ptc.amp.model.DiscussionMessage;
import com.ptc.amp.service.DiscussionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/discussions")
public class DiscussionController {
    private final DiscussionService discussionService;

    public DiscussionController(DiscussionService discussionService) {
        this.discussionService = discussionService;
    }

    // Create new discussion thread
    @PostMapping
    public ResponseEntity<Discussion> createDiscussion(@RequestBody Discussion discussion) {
        Discussion created = discussionService.createDiscussion(discussion);
        return ResponseEntity.ok(created);
    }

    // Get all discussions for a group
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<Discussion>> getGroupDiscussions(@PathVariable Long groupId) {
        List<Discussion> discussions = discussionService.getDiscussionsByGroupId(groupId);
        return ResponseEntity.ok(discussions);
    }

    // Get a single discussion
    @GetMapping("/{id}")
    public ResponseEntity<Discussion> getDiscussion(@PathVariable Long id) {
        return discussionService.getDiscussionById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // Update discussion (title, description, pinned, locked)
    @PutMapping("/{id}")
    public ResponseEntity<Discussion> updateDiscussion(
            @PathVariable Long id, 
            @RequestBody Discussion discussion) {
        Discussion updated = discussionService.updateDiscussion(id, discussion);
        return ResponseEntity.ok(updated);
    }

    // Delete discussion
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDiscussion(@PathVariable Long id) {
        discussionService.deleteDiscussion(id);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Discussion deleted"
        ));
    }

    // Create new message in discussion
    @PostMapping("/messages")
    public ResponseEntity<DiscussionMessage> createMessage(@RequestBody DiscussionMessage message) {
        DiscussionMessage created = discussionService.createMessage(message);
        return ResponseEntity.ok(created);
    }

    // Get all messages for a discussion
    @GetMapping("/{discussionId}/messages")
    public ResponseEntity<List<DiscussionMessage>> getMessages(
            @PathVariable Long discussionId,
            @RequestHeader("Session-Id") String sessionId) {
        
        // For now, we'll get userId from the first message or default to 0
        // In production, you'd validate the session and get the real userId
        List<DiscussionMessage> messages = discussionService.getMessagesByDiscussionId(discussionId, 0L);
        return ResponseEntity.ok(messages);
    }

    // Update message
    @PutMapping("/messages/{id}")
    public ResponseEntity<DiscussionMessage> updateMessage(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updateData) {
        
        String newContent = (String) updateData.get("content");
        Long userId = ((Number) updateData.get("userId")).longValue();
        
        DiscussionMessage updated = discussionService.updateMessage(id, newContent, userId);
        return ResponseEntity.ok(updated);
    }

    // Delete message
    @DeleteMapping("/messages/{id}")
    public ResponseEntity<?> deleteMessage(
            @PathVariable Long id,
            @RequestBody Map<String, Object> deleteData) {
        
        Long userId = ((Number) deleteData.get("userId")).longValue();
        discussionService.deleteMessage(id, userId);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Message deleted"
        ));
    }
}
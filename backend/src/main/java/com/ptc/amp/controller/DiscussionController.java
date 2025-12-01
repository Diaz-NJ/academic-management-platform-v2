package com.ptc.amp.controller;

import com.ptc.amp.model.Discussion;
import com.ptc.amp.model.DiscussionMessage;
import com.ptc.amp.model.User;
import com.ptc.amp.service.DiscussionService;
import com.ptc.amp.service.DiscussionMessageService;
import com.ptc.amp.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/discussions")
public class DiscussionController {
    private final DiscussionService discussionService;
    private final DiscussionMessageService messageService;
    private final AuthService authService;

    public DiscussionController(
            DiscussionService discussionService,
            DiscussionMessageService messageService,
            AuthService authService) {
        this.discussionService = discussionService;
        this.messageService = messageService;
        this.authService = authService;
    }

    // ===== DISCUSSION ENDPOINTS =====
    
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<Discussion>> getGroupDiscussions(@PathVariable Long groupId) {
        List<Discussion> discussions = discussionService.getGroupDiscussions(groupId);
        return ResponseEntity.ok(discussions);
    }

    @PostMapping
    public ResponseEntity<?> createDiscussion(@RequestBody Map<String, Object> discussionData) {
        try {
            Long groupId = ((Number) discussionData.get("groupId")).longValue();
            Long createdBy = ((Number) discussionData.get("createdBy")).longValue();
            String title = (String) discussionData.get("title");
            String description = (String) discussionData.get("description");

            Discussion discussion = new Discussion();
            discussion.setGroupId(groupId);
            discussion.setCreatedBy(createdBy);
            discussion.setTitle(title);
            discussion.setDescription(description);

            Discussion created = discussionService.createDiscussion(discussion);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to create discussion: " + e.getMessage()
            ));
        }
    }

      @PutMapping("/{discussionId}")
    public ResponseEntity<?> updateDiscussion(
            @PathVariable Long discussionId,
            @RequestBody Map<String, Object> discussionData) {
        try {
            String title = (String) discussionData.get("title");
            String description = (String) discussionData.get("description");
            
            Discussion updated = discussionService.updateDiscussion(discussionId, title, description);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to update discussion: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{discussionId}")
    public ResponseEntity<?> deleteDiscussion(@PathVariable Long discussionId) {
        try {
            boolean deleted = discussionService.deleteDiscussion(discussionId);
            return deleted ? 
                ResponseEntity.ok(Map.of("success", true, "message", "Discussion deleted")) :
                ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to delete discussion: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/{discussionId}/pin")
    public ResponseEntity<?> togglePin(@PathVariable Long discussionId) {
        try {
            Discussion updated = discussionService.togglePin(discussionId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to toggle pin: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/{discussionId}/lock")
    public ResponseEntity<?> toggleLock(@PathVariable Long discussionId) {
        try {
            Discussion updated = discussionService.toggleLock(discussionId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to toggle lock: " + e.getMessage()
            ));
        }
    }

    // ===== MESSAGE ENDPOINTS =====
    
    @GetMapping("/{discussionId}/messages")
    public ResponseEntity<List<DiscussionMessage>> getDiscussionMessages(@PathVariable Long discussionId) {
        List<DiscussionMessage> messages = messageService.getDiscussionMessages(discussionId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/messages")
    public ResponseEntity<?> createMessage(@RequestBody Map<String, Object> messageData) {
        try {
            Long discussionId = ((Number) messageData.get("discussionId")).longValue();
            Long userId = ((Number) messageData.get("userId")).longValue();
            String content = (String) messageData.get("content");

            DiscussionMessage message = new DiscussionMessage();
            message.setDiscussionId(discussionId);
            message.setUserId(userId);
            message.setContent(content);

            DiscussionMessage created = messageService.createMessage(message);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to create message: " + e.getMessage()
            ));
        }
    }

    // ===== MESSAGE READ STATUS ENDPOINTS =====

@PostMapping("/{discussionId}/mark-read")
public ResponseEntity<?> markDiscussionAsRead(
        @PathVariable Long discussionId,
        @RequestBody Map<String, Object> data) {
    try {
        Long userId = ((Number) data.get("userId")).longValue();
        
        messageService.markAllMessagesAsRead(discussionId, userId);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "All messages marked as read"
        ));
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body(Map.of(
            "success", false,
            "message", "Failed to mark as read: " + e.getMessage()
        ));
    }
}

@GetMapping("/{discussionId}/unread-count")
public ResponseEntity<?> getUnreadCount(
        @PathVariable Long discussionId,
        @RequestParam Long userId) {
    try {
        int unreadCount = messageService.getUnreadCount(discussionId, userId);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "unreadCount", unreadCount
        ));
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body(Map.of(
            "success", false,
            "message", "Failed to get unread count: " + e.getMessage()
        ));
    }
}

@GetMapping("/group/{groupId}/unread-counts")
public ResponseEntity<?> getGroupUnreadCounts(
        @PathVariable Long groupId,
        @RequestParam Long userId) {
    try {
        List<Discussion> discussions = discussionService.getGroupDiscussions(groupId);
        Map<Long, Integer> unreadCounts = new HashMap<>();
        
        for (Discussion discussion : discussions) {
            int unreadCount = messageService.getUnreadCount(discussion.getId(), userId);
            unreadCounts.put(discussion.getId(), unreadCount);
        }
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "unreadCounts", unreadCounts
        ));
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body(Map.of(
            "success", false,
            "message", "Failed to get unread counts: " + e.getMessage()
        ));
    }
}
}
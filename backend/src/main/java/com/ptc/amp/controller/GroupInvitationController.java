package com.ptc.amp.controller;

import com.ptc.amp.model.GroupInvitation;
import com.ptc.amp.model.User;
import com.ptc.amp.service.GroupInvitationService;
import com.ptc.amp.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/invitations")
public class GroupInvitationController {
    private final GroupInvitationService invitationService;
    private final AuthService authService;

    public GroupInvitationController(GroupInvitationService invitationService, AuthService authService) {
        this.invitationService = invitationService;
        this.authService = authService;
    }

    // Send invitation by email
    @PostMapping("/send")
    public ResponseEntity<?> sendInvitation(@RequestBody Map<String, Object> inviteData) {
        try {
            Long groupId = ((Number) inviteData.get("groupId")).longValue();
            String invitedEmail = (String) inviteData.get("invitedEmail");
            Long invitedById = ((Number) inviteData.get("invitedBy")).longValue();
            
            // Check if user exists by email
            User invitedUser = authService.getUserByEmail(invitedEmail);
            if (invitedUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "No user found with email: " + invitedEmail
                ));
            }
            
            // Check if already invited or member
            if (invitationService.isAlreadyInvited(groupId, invitedUser.getId())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "User already invited to this group"
                ));
            }
            
            if (invitationService.isAlreadyMember(groupId, invitedUser.getId())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "User is already a member of this group"
                ));
            }
            
            GroupInvitation invitation = invitationService.createInvitation(
                groupId, 
                invitedUser.getId(), 
                invitedById
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Invitation sent successfully",
                "invitation", invitation
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to send invitation: " + e.getMessage()
            ));
        }
    }

    // Get invitations for a user (received)
    @GetMapping("/received/{userId}")
    public ResponseEntity<List<GroupInvitation>> getReceivedInvitations(@PathVariable Long userId) {
        List<GroupInvitation> invitations = invitationService.getReceivedInvitations(userId);
        return ResponseEntity.ok(invitations);
    }

    // Get invitations sent by a user
    @GetMapping("/sent/{userId}")
    public ResponseEntity<List<GroupInvitation>> getSentInvitations(@PathVariable Long userId) {
        List<GroupInvitation> invitations = invitationService.getSentInvitations(userId);
        return ResponseEntity.ok(invitations);
    }

    // Accept invitation
    @PostMapping("/{invitationId}/accept")
    public ResponseEntity<?> acceptInvitation(@PathVariable Long invitationId) {
        try {
            GroupInvitation invitation = invitationService.acceptInvitation(invitationId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Invitation accepted",
                "invitation", invitation
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // Reject invitation
    @PostMapping("/{invitationId}/reject")
    public ResponseEntity<?> rejectInvitation(@PathVariable Long invitationId) {
        try {
            GroupInvitation invitation = invitationService.rejectInvitation(invitationId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Invitation rejected",
                "invitation", invitation
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // Cancel invitation (by sender)
    @DeleteMapping("/{invitationId}")
    public ResponseEntity<?> cancelInvitation(@PathVariable Long invitationId) {
        try {
            invitationService.cancelInvitation(invitationId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Invitation canceled"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}
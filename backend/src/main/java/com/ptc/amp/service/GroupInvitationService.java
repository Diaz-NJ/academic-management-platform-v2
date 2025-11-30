package com.ptc.amp.service;

import com.ptc.amp.model.GroupInvitation;
import com.ptc.amp.model.Group;
import com.ptc.amp.model.User;
import com.ptc.amp.repository.GroupInvitationRepository;
import com.ptc.amp.repository.GroupRepository;
import com.ptc.amp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class GroupInvitationService {
    private final GroupInvitationRepository invitationRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final GroupService groupService;

    public GroupInvitationService(
            GroupInvitationRepository invitationRepository,
            GroupRepository groupRepository,
            UserRepository userRepository,
            GroupService groupService) {
        this.invitationRepository = invitationRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.groupService = groupService;
    }

    public GroupInvitation createInvitation(Long groupId, Long invitedUserId, Long invitedBy) {
        GroupInvitation invitation = new GroupInvitation();
        invitation.setGroupId(groupId);
        invitation.setInvitedUserId(invitedUserId);
        invitation.setInvitedBy(invitedBy);
        invitation.setStatus("PENDING");
        
        // Enrich with names
        enrichInvitation(invitation);
        
        return invitationRepository.save(invitation);
    }

    public List<GroupInvitation> getReceivedInvitations(Long userId) {
        List<GroupInvitation> invitations = invitationRepository.findByInvitedUserIdAndStatus(userId, "PENDING");
        invitations.forEach(this::enrichInvitation);
        return invitations;
    }

    public List<GroupInvitation> getSentInvitations(Long userId) {
        List<GroupInvitation> invitations = invitationRepository.findByInvitedBy(userId);
        invitations.forEach(this::enrichInvitation);
        return invitations;
    }

   public GroupInvitation acceptInvitation(Long invitationId) {
    System.out.println("=== ACCEPTING INVITATION ID: " + invitationId + " ===");
    
    GroupInvitation invitation = invitationRepository.findById(invitationId)
        .orElseThrow(() -> new RuntimeException("Invitation not found"));
    
    if (!"PENDING".equals(invitation.getStatus())) {
        throw new RuntimeException("Invitation already processed");
    }

    // Get the group with all members - FORCE EAGER FETCH
    Group group = groupRepository.findById(invitation.getGroupId())
        .orElseThrow(() -> new RuntimeException("Group not found"));
    
    // ✅ Force load members
    int existingMemberCount = group.getMembers().size();
    System.out.println("Current group has " + existingMemberCount + " members:");
    group.getMembers().forEach(m -> 
        System.out.println("  - " + m.getName() + " (Role: " + m.getRole() + ")")
    );
    
    User user = userRepository.findById(invitation.getInvitedUserId())
        .orElseThrow(() -> new RuntimeException("User not found"));

    System.out.println("Adding user: " + user.getFullName() + " (ID: " + user.getId() + ")");

    // ✅ Check if user is already a member
    boolean isAlreadyMember = group.getMembers().stream()
        .anyMatch(m -> m.getUserId().equals(user.getId()));
    
    if (isAlreadyMember) {
        System.out.println("⚠️ User already a member!");
    } else {
        System.out.println("✅ Adding new member...");
        
        Group.GroupMember member = new Group.GroupMember(
            user.getId(),
            user.getFullName(),
            "Member"
        );
        
        // ✅ Set bidirectional relationship explicitly
        member.setGroup(group);
        group.getMembers().add(member);
        
        // ✅ Save and flush immediately
        Group savedGroup = groupRepository.saveAndFlush(group);
        
        System.out.println("✅ Member added! New total: " + savedGroup.getMembers().size());
        savedGroup.getMembers().forEach(m -> 
            System.out.println("  - " + m.getName() + " (Role: " + m.getRole() + ")")
        );
    }

    invitation.setStatus("ACCEPTED");
    invitation.setRespondedAt(LocalDateTime.now());
    
    return invitationRepository.save(invitation);
}

    public GroupInvitation rejectInvitation(Long invitationId) {
        GroupInvitation invitation = invitationRepository.findById(invitationId)
            .orElseThrow(() -> new RuntimeException("Invitation not found"));
        
        if (!"PENDING".equals(invitation.getStatus())) {
            throw new RuntimeException("Invitation already processed");
        }

        invitation.setStatus("REJECTED");
        invitation.setRespondedAt(LocalDateTime.now());
        
        return invitationRepository.save(invitation);
    }

    public void cancelInvitation(Long invitationId) {
        invitationRepository.deleteById(invitationId);
    }

    public boolean isAlreadyInvited(Long groupId, Long userId) {
        return invitationRepository.existsByGroupIdAndInvitedUserIdAndStatus(groupId, userId, "PENDING");
    }

    public boolean isAlreadyMember(Long groupId, Long userId) {
        Optional<Group> group = groupRepository.findById(groupId);
        if (group.isEmpty()) return false;
        
        return group.get().getMembers().stream()
            .anyMatch(m -> m.getUserId().equals(userId));
    }

    private void enrichInvitation(GroupInvitation invitation) {
        groupRepository.findById(invitation.getGroupId())
            .ifPresent(g -> invitation.setGroupName(g.getGroupName()));
        
        userRepository.findById(invitation.getInvitedBy())
            .ifPresent(u -> invitation.setInvitedByName(u.getFullName()));
        
        userRepository.findById(invitation.getInvitedUserId())
            .ifPresent(u -> {
                invitation.setInvitedUserName(u.getFullName());
                invitation.setInvitedUserEmail(u.getEmail());
            });
    }
}
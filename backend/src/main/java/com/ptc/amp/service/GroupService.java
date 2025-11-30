package com.ptc.amp.service;

import com.ptc.amp.model.Group;
import com.ptc.amp.repository.GroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class GroupService {
    private final GroupRepository groupRepository;

    public GroupService(GroupRepository groupRepository) {
        this.groupRepository = groupRepository;
    }

    public Group createGroup(Group group) {
    System.out.println("=== GROUP SERVICE: createGroup ===");
    
    // Ensure bidirectional relationship is set
    if (group.getMembers() != null && !group.getMembers().isEmpty()) {
        System.out.println("Setting up " + group.getMembers().size() + " members");
        
        // ✅ Clear and re-add to ensure proper relationships
        List<Group.GroupMember> membersCopy = new ArrayList<>(group.getMembers());
        group.getMembers().clear();
        
        for (Group.GroupMember member : membersCopy) {
            System.out.println("  - Adding member: " + member.getName() + " (Role: " + member.getRole() + ")");
            member.setGroup(group);
            group.getMembers().add(member);
        }
    } else {
        System.out.println("⚠️ No members provided in group creation");
    }
    
    Group saved = groupRepository.save(group);
    System.out.println("✅ Group saved with ID: " + saved.getId() + ", Members: " + saved.getMembers().size());
    
    return saved;
}

    public Optional<Group> getGroupById(Long id) {
        return groupRepository.findById(id);
    }

    public List<Group> getGroupsByUserId(Long userId) {
        return groupRepository.findByUserId(userId);
    }

    public Group updateGroup(Group updatedGroup) {
        Optional<Group> existingGroupOpt = groupRepository.findById(updatedGroup.getId());
        
        if (existingGroupOpt.isPresent()) {
            Group existingGroup = existingGroupOpt.get();
            
            // Update basic fields
            existingGroup.setGroupNumber(updatedGroup.getGroupNumber());
            existingGroup.setGroupName(updatedGroup.getGroupName());
            existingGroup.setSubject(updatedGroup.getSubject());
            existingGroup.setTaskDescription(updatedGroup.getTaskDescription());
            
            // Clear existing members
            existingGroup.getMembers().clear();
            
            // Add new members with proper bidirectional relationship
            if (updatedGroup.getMembers() != null) {
                updatedGroup.getMembers().forEach(member -> {
                    member.setGroup(existingGroup);
                    existingGroup.getMembers().add(member);
                });
            }
            
            return groupRepository.save(existingGroup);
        }
        
        return updatedGroup;
    }

    public boolean deleteGroup(Long id) {
        if (groupRepository.existsById(id)) {
            groupRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public boolean addMemberToGroup(Long groupId, Group.GroupMember member) {
        Optional<Group> groupOpt = groupRepository.findById(groupId);
        if (groupOpt.isPresent()) {
            Group group = groupOpt.get();
            member.setGroup(group);
            group.getMembers().add(member);
            groupRepository.save(group);
            return true;
        }
        return false;
    }

    public boolean removeMemberFromGroup(Long groupId, Long userId) {
        Optional<Group> groupOpt = groupRepository.findById(groupId);
        if (groupOpt.isPresent()) {
            Group group = groupOpt.get();
            group.getMembers().removeIf(m -> m.getUserId().equals(userId));
            groupRepository.save(group);
            return true;
        }
        return false;
    }
}
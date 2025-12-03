package com.ptc.amp.service;

import com.ptc.amp.model.Group;
import com.ptc.amp.repository.GroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Service
@Transactional
public class GroupService {
    private final GroupRepository groupRepository;
    private final Map<Long, List<Group>> userGroupsCache = new ConcurrentHashMap<>();
    private final Map<Long, Long> cacheTimestamps = new ConcurrentHashMap<>();
    private static final long CACHE_DURATION = 30000;

    private void clearUserCache(Long userId) {
        userGroupsCache.remove(userId);
        cacheTimestamps.remove(userId);
    }

    public GroupService(GroupRepository groupRepository) {
        this.groupRepository = groupRepository;
    }

    public Group createGroup(Group group) {
    System.out.println("=== GROUP SERVICE: createGroup ===");

    if (group.getMembers() != null && !group.getMembers().isEmpty()) {
        System.out.println("Setting up " + group.getMembers().size() + " members");

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
    clearUserCache(group.getCreatedBy());
    System.out.println("✅ Group saved with ID: " + saved.getId() + ", Members: " + saved.getMembers().size());
    
    return saved;
}

    public Optional<Group> getGroupById(Long id) {
        return groupRepository.findById(id);
    }

    public List<Group> getGroupsByUserId(Long userId) {
        Long now = System.currentTimeMillis();
        Long cachedTime = cacheTimestamps.get(userId);
        
        // Return cached data if less than 30 seconds old
        if (cachedTime != null && (now - cachedTime) < CACHE_DURATION) {
            List<Group> cached = userGroupsCache.get(userId);
            if (cached != null) {
                return cached;
            }
        }
        
        // Fetch fresh data
        List<Group> groups = groupRepository.findByUserId(userId);
        
        // Update cache
        userGroupsCache.put(userId, groups);
        cacheTimestamps.put(userId, now);
        
        return groups;
    }

    public Group updateGroup(Group updatedGroup) {
    System.out.println("=== GROUP SERVICE: updateGroup ===");
    System.out.println("Updating group ID: " + updatedGroup.getId());
    
    Optional<Group> existingGroupOpt = groupRepository.findById(updatedGroup.getId());
    
    if (existingGroupOpt.isPresent()) {
        Group existingGroup = existingGroupOpt.get();
        
        System.out.println("Existing group found with " + existingGroup.getMembers().size() + " members");

        existingGroup.setGroupNumber(updatedGroup.getGroupNumber());
        existingGroup.setGroupName(updatedGroup.getGroupName());
        existingGroup.setSubject(updatedGroup.getSubject());
        existingGroup.setTaskDescription(updatedGroup.getTaskDescription());
        existingGroup.getMembers().clear();

        groupRepository.flush();

        if (updatedGroup.getMembers() != null && !updatedGroup.getMembers().isEmpty()) {
            System.out.println("Adding " + updatedGroup.getMembers().size() + " new members");
            
            for (Group.GroupMember member : updatedGroup.getMembers()) {
                System.out.println("  - Adding: " + member.getName() + " (Role: " + member.getRole() + ")");

                Group.GroupMember newMember = new Group.GroupMember(
                    member.getUserId(),
                    member.getName(),
                    member.getRole()
                );
                newMember.setGroup(existingGroup);
                existingGroup.getMembers().add(newMember);
            }
        }
        
        System.out.println("Saving updated group with " + existingGroup.getMembers().size() + " members");
        
        Group saved = groupRepository.saveAndFlush(existingGroup);
        clearUserCache(saved.getCreatedBy());
        
        System.out.println("✅ Group updated successfully! Final member count: " + saved.getMembers().size());
        
        return saved;
    }
    
    System.out.println("⚠️ Group not found, creating new one");
    return createGroup(updatedGroup);
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

    public boolean updateMemberRole(Long groupId, Long userId, String newRole) {
        Optional<Group> groupOpt = groupRepository.findById(groupId);
        if (groupOpt.isPresent()) {
            Group group = groupOpt.get();

            for (Group.GroupMember member : group.getMembers()) {
                if (member.getUserId().equals(userId)) {
                    member.setRole(newRole);
                    group.setUpdatedAt(java.time.LocalDateTime.now());
                    groupRepository.save(group);
                    return true;
                }
            }
        }
        return false;
    }
}
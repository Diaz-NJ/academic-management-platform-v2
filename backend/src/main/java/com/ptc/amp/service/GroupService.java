package com.ptc.amp.service;

import com.ptc.amp.model.Group;
import com.ptc.amp.repository.GroupRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class GroupService {
    private final GroupRepository groupRepository;

    public GroupService(GroupRepository groupRepository) {
        this.groupRepository = groupRepository;
    }

    public Group createGroup(Group group) {
        return groupRepository.save(group);
    }

    public Optional<Group> getGroupById(Long id) {
        return groupRepository.findById(id);
    }

    public List<Group> getGroupsByUserId(Long userId) {
        return groupRepository.findByUserId(userId);
    }

    public Group updateGroup(Group group) {
        return groupRepository.save(group);
    }

    public boolean deleteGroup(Long id) {
        if (groupRepository.findById(id).isPresent()) {
            groupRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public boolean addMemberToGroup(Long groupId, Group.GroupMember member) {
        Optional<Group> groupOpt = groupRepository.findById(groupId);
        if (groupOpt.isPresent()) {
            Group group = groupOpt.get();
            group.addMember(member);
            groupRepository.save(group);
            return true;
        }
        return false;
    }

    public boolean removeMemberFromGroup(Long groupId, Long userId) {
        Optional<Group> groupOpt = groupRepository.findById(groupId);
        if (groupOpt.isPresent()) {
            Group group = groupOpt.get();
            group.removeMember(userId);
            groupRepository.save(group);
            return true;
        }
        return false;
    }
}
package com.ptc.amp.repository;

import com.ptc.amp.model.Group;
import org.springframework.stereotype.Repository;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Repository
public class GroupRepository {
    private final Map<Long, Group> groups = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    public Group save(Group group) {
        if (group.getId() == null) {
            group.setId(idGenerator.getAndIncrement());
        }
        groups.put(group.getId(), group);
        return group;
    }

    public Optional<Group> findById(Long id) {
        return Optional.ofNullable(groups.get(id));
    }

    public List<Group> findByUserId(Long userId) {
        return groups.values().stream()
                .filter(g -> g.getMembers().stream()
                        .anyMatch(m -> m.getUserId().equals(userId)))
                .sorted(Comparator.comparing(Group::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    public List<Group> findAll() {
        return new ArrayList<>(groups.values());
    }

    public void deleteById(Long id) {
        groups.remove(id);
    }
}
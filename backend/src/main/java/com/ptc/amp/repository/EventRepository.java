package com.ptc.amp.repository;

import com.ptc.amp.model.Event;
import org.springframework.stereotype.Repository;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Repository
public class EventRepository {
    private final Map<Long, Event> events = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    public Event save(Event event) {
        if (event.getId() == null) {
            event.setId(idGenerator.getAndIncrement());
        }
        events.put(event.getId(), event);
        return event;
    }

    public Optional<Event> findById(Long id) {
        return Optional.ofNullable(events.get(id));
    }

    public List<Event> findByUserId(Long userId) {
        return events.values().stream()
                .filter(e -> e.getUserId().equals(userId))
                .sorted(Comparator.comparing(Event::getStartDateTime))
                .collect(Collectors.toList());
    }

    public void deleteById(Long id) {
        events.remove(id);
    }
}
package com.ptc.amp.service;

import com.ptc.amp.model.Event;
import com.ptc.amp.repository.EventRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class EventService {
    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public Event createEvent(Event event) {
        return eventRepository.save(event);
    }

    public Optional<Event> getEventById(Long id) {
        return eventRepository.findById(id);
    }

    public List<Event> getEventsByUserId(Long userId) {
        return eventRepository.findByUserId(userId);
    }

    public Event updateEvent(Event event) {
        return eventRepository.save(event);
    }

    public boolean deleteEvent(Long id) {
        if (eventRepository.findById(id).isPresent()) {
            eventRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
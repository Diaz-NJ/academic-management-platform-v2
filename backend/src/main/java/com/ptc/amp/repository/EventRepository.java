package com.ptc.amp.repository;

import com.ptc.amp.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByUserIdOrderByStartDateTimeAsc(Long userId);
} 
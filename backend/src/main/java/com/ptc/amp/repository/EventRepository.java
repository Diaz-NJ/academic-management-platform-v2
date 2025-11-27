package com.ptc.amp.repository;

import com.ptc.amp.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByUserIdOrderByStartDateTimeAsc(Long userId);
    List<Event> findByParentEventId(Long parentEventId);
    
    // ✅ NEW: Get only non-deleted events
    @Query("SELECT e FROM Event e WHERE e.userId = :userId AND (e.deletedDates IS NULL OR e.deletedDates = '') ORDER BY e.startDateTime ASC")
    List<Event> findActiveEventsByUserId(@Param("userId") Long userId);
}
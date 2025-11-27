package com.ptc.amp.repository;

import com.ptc.amp.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserIdOrderByDueDateAsc(Long userId);
    
    // ✅ NEW: Find tasks by group ID
    List<Task> findByGroupIdOrderByDueDateAsc(Long groupId);
}
package com.ptc.amp.repository;

import com.ptc.amp.model.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    // ✅ FIXED: Changed the entity reference to use the full inner class path
    @Query("SELECT DISTINCT g FROM Group g LEFT JOIN g.members m WHERE g.createdBy = :userId OR m.userId = :userId ORDER BY g.createdAt DESC")
    List<Group> findByUserId(@Param("userId") Long userId);
}
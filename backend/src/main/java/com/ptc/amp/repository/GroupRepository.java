package com.ptc.amp.repository;

import com.ptc.amp.model.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    @Query("SELECT DISTINCT g FROM Group g LEFT JOIN FETCH g.members m WHERE m.userId = :userId ORDER BY g.createdAt DESC")
    List<Group> findByUserId(@Param("userId") Long userId);
}
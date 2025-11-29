package com.ptc.amp.repository;

import com.ptc.amp.model.Discussion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DiscussionRepository extends JpaRepository<Discussion, Long> {
    List<Discussion> findByGroupIdOrderByIsPinnedDescLastMessageAtDesc(Long groupId);
}
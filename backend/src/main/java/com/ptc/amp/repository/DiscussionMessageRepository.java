package com.ptc.amp.repository;

import com.ptc.amp.model.DiscussionMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DiscussionMessageRepository extends JpaRepository<DiscussionMessage, Long> {
    List<DiscussionMessage> findByDiscussionIdOrderByCreatedAtAsc(Long discussionId);
}
package com.ptc.amp.service;

import com.ptc.amp.model.Discussion;
import com.ptc.amp.model.User;
import com.ptc.amp.repository.DiscussionRepository;
import com.ptc.amp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class DiscussionService {
    private final DiscussionRepository discussionRepository;
    private final UserRepository userRepository;

    public DiscussionService(DiscussionRepository discussionRepository, UserRepository userRepository) {
        this.discussionRepository = discussionRepository;
        this.userRepository = userRepository;
    }

    public List<Discussion> getGroupDiscussions(Long groupId) {
        List<Discussion> discussions = discussionRepository.findByGroupIdOrderByIsPinnedDescLastMessageAtDesc(groupId);
        
        for (Discussion discussion : discussions) {
            Optional<User> creator = userRepository.findById(discussion.getCreatedBy());
            creator.ifPresent(user -> discussion.setCreatorName(user.getFullName()));
        }
        
        return discussions;
    }

    public List<Discussion> getGroupDiscussionsWithUnreadCounts(Long groupId, Long userId) {
        List<Discussion> discussions = getGroupDiscussions(groupId);
        return discussions;
    }

    public Discussion createDiscussion(Discussion discussion) {
        Discussion created = discussionRepository.save(discussion);

        Optional<User> creator = userRepository.findById(created.getCreatedBy());
        creator.ifPresent(user -> created.setCreatorName(user.getFullName()));
        
        return created;
    }

    public Discussion updateDiscussion(Long discussionId, String title, String description) {
        Optional<Discussion> discussionOpt = discussionRepository.findById(discussionId);
        if (discussionOpt.isEmpty()) {
            throw new RuntimeException("Discussion not found");
        }
        
        Discussion discussion = discussionOpt.get();
        discussion.setTitle(title);
        discussion.setDescription(description);
        discussion.setUpdatedAt(java.time.LocalDateTime.now());
        
        return discussionRepository.save(discussion);
    }

    public boolean deleteDiscussion(Long discussionId) {
        if (discussionRepository.existsById(discussionId)) {
            discussionRepository.deleteById(discussionId);
            return true;
        }
        return false;
    }

    public Discussion togglePin(Long discussionId) {
        Optional<Discussion> discussionOpt = discussionRepository.findById(discussionId);
        if (discussionOpt.isEmpty()) {
            throw new RuntimeException("Discussion not found");
        }
        
        Discussion discussion = discussionOpt.get();
        discussion.setIsPinned(!discussion.getIsPinned());
        return discussionRepository.save(discussion);
    }

    public Discussion toggleLock(Long discussionId) {
        Optional<Discussion> discussionOpt = discussionRepository.findById(discussionId);
        if (discussionOpt.isEmpty()) {
            throw new RuntimeException("Discussion not found");
        }
        
        Discussion discussion = discussionOpt.get();
        discussion.setIsLocked(!discussion.getIsLocked());
        return discussionRepository.save(discussion);
    }
}
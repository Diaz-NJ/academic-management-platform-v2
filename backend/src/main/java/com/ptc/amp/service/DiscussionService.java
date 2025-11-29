package com.ptc.amp.service;

import com.ptc.amp.model.Discussion;
import com.ptc.amp.model.DiscussionMessage;
import com.ptc.amp.model.User;
import com.ptc.amp.repository.DiscussionRepository;
import com.ptc.amp.repository.DiscussionMessageRepository;
import com.ptc.amp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class DiscussionService {
    private final DiscussionRepository discussionRepository;
    private final DiscussionMessageRepository messageRepository;
    private final UserRepository userRepository;

    public DiscussionService(
            DiscussionRepository discussionRepository,
            DiscussionMessageRepository messageRepository,
            UserRepository userRepository) {
        this.discussionRepository = discussionRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    public Discussion createDiscussion(Discussion discussion) {
        discussion.setMessageCount(0);
        discussion.setIsPinned(false);
        discussion.setIsLocked(false);
        
        Discussion saved = discussionRepository.save(discussion);
        enrichDiscussion(saved);
        return saved;
    }

    public List<Discussion> getDiscussionsByGroupId(Long groupId) {
        List<Discussion> discussions = discussionRepository.findByGroupIdOrderByIsPinnedDescLastMessageAtDesc(groupId);
        discussions.forEach(this::enrichDiscussion);
        return discussions;
    }

    public Optional<Discussion> getDiscussionById(Long id) {
        Optional<Discussion> discussion = discussionRepository.findById(id);
        discussion.ifPresent(this::enrichDiscussion);
        return discussion;
    }

    public Discussion updateDiscussion(Long id, Discussion updatedDiscussion) {
        Discussion discussion = discussionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Discussion not found"));
        
        discussion.setTitle(updatedDiscussion.getTitle());
        discussion.setDescription(updatedDiscussion.getDescription());
        discussion.setIsPinned(updatedDiscussion.getIsPinned());
        discussion.setIsLocked(updatedDiscussion.getIsLocked());
        discussion.setUpdatedAt(LocalDateTime.now());
        
        Discussion saved = discussionRepository.save(discussion);
        enrichDiscussion(saved);
        return saved;
    }

    public void deleteDiscussion(Long id) {
        discussionRepository.deleteById(id);
    }

    public DiscussionMessage createMessage(DiscussionMessage message) {
        DiscussionMessage saved = messageRepository.save(message);
        
        // Update discussion metadata
        Discussion discussion = discussionRepository.findById(message.getDiscussionId())
            .orElseThrow(() -> new RuntimeException("Discussion not found"));
        
        discussion.setMessageCount(discussion.getMessageCount() + 1);
        discussion.setLastMessageAt(LocalDateTime.now());
        discussion.setUpdatedAt(LocalDateTime.now());
        discussionRepository.save(discussion);
        
        enrichMessage(saved, message.getUserId());
        return saved;
    }

    public List<DiscussionMessage> getMessagesByDiscussionId(Long discussionId, Long currentUserId) {
        List<DiscussionMessage> messages = messageRepository.findByDiscussionIdOrderByCreatedAtAsc(discussionId);
        messages.forEach(m -> enrichMessage(m, currentUserId));
        return messages;
    }

    public DiscussionMessage updateMessage(Long id, String newContent, Long userId) {
        DiscussionMessage message = messageRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Message not found"));
        
        if (!message.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to edit this message");
        }
        
        message.setContent(newContent);
        message.setIsEdited(true);
        message.setEditedAt(LocalDateTime.now());
        
        DiscussionMessage saved = messageRepository.save(message);
        enrichMessage(saved, userId);
        return saved;
    }

    public void deleteMessage(Long id, Long userId) {
        DiscussionMessage message = messageRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Message not found"));
        
        if (!message.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this message");
        }
        
        messageRepository.deleteById(id);
        
        // Update discussion message count
        Discussion discussion = discussionRepository.findById(message.getDiscussionId())
            .orElseThrow(() -> new RuntimeException("Discussion not found"));
        
        discussion.setMessageCount(Math.max(0, discussion.getMessageCount() - 1));
        discussionRepository.save(discussion);
    }

    private void enrichDiscussion(Discussion discussion) {
        userRepository.findById(discussion.getCreatedBy())
            .ifPresent(u -> discussion.setCreatorName(u.getFullName()));
        
        // Get last message preview
        List<DiscussionMessage> messages = messageRepository.findByDiscussionIdOrderByCreatedAtAsc(discussion.getId());
        if (!messages.isEmpty()) {
            DiscussionMessage lastMessage = messages.get(messages.size() - 1);
            String preview = lastMessage.getContent();
            if (preview.length() > 50) {
                preview = preview.substring(0, 50) + "...";
            }
            discussion.setLastMessagePreview(preview);
        }
    }

    private void enrichMessage(DiscussionMessage message, Long currentUserId) {
        userRepository.findById(message.getUserId())
            .ifPresent(u -> message.setUserName(u.getFullName()));
        
        message.setIsOwner(message.getUserId().equals(currentUserId));
    }
}
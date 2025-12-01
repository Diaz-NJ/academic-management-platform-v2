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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class DiscussionMessageService {
    private final DiscussionMessageRepository messageRepository;
    private final DiscussionRepository discussionRepository;
    private final UserRepository userRepository;

    public DiscussionMessageService(
            DiscussionMessageRepository messageRepository,
            DiscussionRepository discussionRepository,
            UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.discussionRepository = discussionRepository;
        this.userRepository = userRepository;
    }

    public List<DiscussionMessage> getDiscussionMessages(Long discussionId) {
        List<DiscussionMessage> messages = messageRepository.findByDiscussionIdOrderByCreatedAtAsc(discussionId);
        
        // Enrich with user names
        for (DiscussionMessage message : messages) {
            Optional<User> user = userRepository.findById(message.getUserId());
            user.ifPresent(u -> message.setUserName(u.getFullName()));
        }
        
        return messages;
    }

    public DiscussionMessage createMessage(DiscussionMessage message) {
    // ✅ Mark the sender as having read the message automatically
    message.setReadBy(String.valueOf(message.getUserId()));
    
    // Save the message
    DiscussionMessage created = messageRepository.save(message);
    
    // Update discussion's message count and last message time
    Optional<Discussion> discussionOpt = discussionRepository.findById(message.getDiscussionId());
    discussionOpt.ifPresent(discussion -> {
        discussion.setMessageCount(discussion.getMessageCount() + 1);
        discussion.setLastMessageAt(LocalDateTime.now());
        discussionRepository.save(discussion);
    });
    
    // Enrich with user name
    Optional<User> user = userRepository.findById(created.getUserId());
    user.ifPresent(u -> created.setUserName(u.getFullName()));
    
    return created;
}

    // ✅ NEW: Mark message as read by a user
public DiscussionMessage markMessageAsRead(Long messageId, Long userId) {
    Optional<DiscussionMessage> messageOpt = messageRepository.findById(messageId);
    if (messageOpt.isEmpty()) {
        throw new RuntimeException("Message not found");
    }
    
    DiscussionMessage message = messageOpt.get();
    String readBy = message.getReadBy();
    
    if (readBy == null || readBy.isEmpty()) {
        message.setReadBy(String.valueOf(userId));
    } else {
        List<String> readers = new ArrayList<>(Arrays.asList(readBy.split(",")));
        String userIdStr = String.valueOf(userId);
        
        if (!readers.contains(userIdStr)) {
            readers.add(userIdStr);
            message.setReadBy(String.join(",", readers));
        }
    }
    
    return messageRepository.save(message);
}

// ✅ NEW: Mark all messages in a discussion as read
public void markAllMessagesAsRead(Long discussionId, Long userId) {
    List<DiscussionMessage> messages = messageRepository.findByDiscussionIdOrderByCreatedAtAsc(discussionId);
    
    for (DiscussionMessage message : messages) {
        String readBy = message.getReadBy();
        
        if (readBy == null || readBy.isEmpty()) {
            message.setReadBy(String.valueOf(userId));
        } else {
            List<String> readers = new ArrayList<>(Arrays.asList(readBy.split(",")));
            String userIdStr = String.valueOf(userId);
            
            if (!readers.contains(userIdStr)) {
                readers.add(userIdStr);
                message.setReadBy(String.join(",", readers));
            }
        }
        
        messageRepository.save(message);
    }
}

// ✅ NEW: Get unread count for a discussion
public int getUnreadCount(Long discussionId, Long userId) {
    List<DiscussionMessage> messages = messageRepository.findByDiscussionIdOrderByCreatedAtAsc(discussionId);
    String userIdStr = String.valueOf(userId);
    
    int unreadCount = 0;
    for (DiscussionMessage message : messages) {
        // Skip messages sent by the user themselves
        if (message.getUserId().equals(userId)) {
            continue;
        }
        
        String readBy = message.getReadBy();
        if (readBy == null || readBy.isEmpty() || !Arrays.asList(readBy.split(",")).contains(userIdStr)) {
            unreadCount++;
        }
    }
    
    return unreadCount;
}
}
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
}
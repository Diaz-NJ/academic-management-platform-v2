package com.ptc.amp.service;

import com.ptc.amp.model.User;
import com.ptc.amp.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final Map<String, Long> sessions = new HashMap<>();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Map<String, Object> register(User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return Map.of("success", false, "message", "Email already registered");
        }
        if (userRepository.findByStudentId(user.getStudentId()).isPresent()) {
            return Map.of("success", false, "message", "Student ID already registered");
        }

        User saved = userRepository.save(user);
        return Map.of(
            "success", true,
            "message", "Registration successful",
            "userId", saved.getId()
        );
    }

    public Map<String, Object> login(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(password)) {
            return Map.of("success", false, "message", "Invalid credentials");
        }

        User user = userOpt.get();
        String sessionId = UUID.randomUUID().toString();
        sessions.put(sessionId, user.getId());

        return Map.of(
            "success", true,
            "sessionId", sessionId,
            "user", Map.of(
                "id", user.getId(),
                "name", user.getFullName(),
                "email", user.getEmail(),
                "studentId", user.getStudentId(),
                "section", user.getSection()
            )
        );
    }

    public Optional<Long> validateSession(String sessionId) {
        return Optional.ofNullable(sessions.get(sessionId));
    }

    public void logout(String sessionId) {
        sessions.remove(sessionId);
    }
}
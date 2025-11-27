package com.ptc.amp.service;

import com.ptc.amp.model.User;
import com.ptc.amp.repository.UserRepository;
import com.ptc.amp.util.PasswordUtil;
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

        // Hash password before saving
        String hashedPassword = PasswordUtil.hashPassword(user.getPassword());
        user.setPassword(hashedPassword);

        User saved = userRepository.save(user);
        return Map.of(
            "success", true,
            "message", "Registration successful",
            "userId", saved.getId()
        );
    }

    public Map<String, Object> login(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            return Map.of("success", false, "message", "Invalid credentials");
        }

        User user = userOpt.get();
        
        // Check hashed password
        if (!PasswordUtil.checkPassword(password, user.getPassword())) {
            return Map.of("success", false, "message", "Invalid credentials");
        }

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

    // ✅ NEW: Get user by ID
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    // ✅ NEW: Check if email exists
    public boolean emailExists(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    // ✅ NEW: Check if student ID exists
    public boolean studentIdExists(String studentId) {
        return userRepository.findByStudentId(studentId).isPresent();
    }

    // ✅ NEW: Update user
    public Map<String, Object> updateUser(Long id, User updatedUser) {
        Optional<User> userOpt = userRepository.findById(id);
        
        if (userOpt.isEmpty()) {
            return Map.of("success", false, "message", "User not found");
        }
        
        User user = userOpt.get();
        
        // Update fields (don't update password here - that should be separate)
        user.setFirstName(updatedUser.getFirstName());
        user.setLastName(updatedUser.getLastName());
        user.setEmail(updatedUser.getEmail());
        user.setStudentId(updatedUser.getStudentId());
        user.setSection(updatedUser.getSection());
        
        User saved = userRepository.save(user);
        
        return Map.of(
            "success", true,
            "message", "Profile updated successfully",
            "user", Map.of(
                "id", saved.getId(),
                "name", saved.getFullName(),
                "email", saved.getEmail(),
                "studentId", saved.getStudentId(),
                "section", saved.getSection()
            )
        );
    }
    // ✅ NEW: Change password
    public Map<String, Object> changePassword(Long userId, String currentPassword, String newPassword) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return Map.of("success", false, "message", "User not found");
        }
        
        User user = userOpt.get();
        
        // Verify current password
        if (!PasswordUtil.checkPassword(currentPassword, user.getPassword())) {
            return Map.of("success", false, "message", "Current password is incorrect");
        }
        
        // Hash and save new password
        String hashedNewPassword = PasswordUtil.hashPassword(newPassword);
        user.setPassword(hashedNewPassword);
        userRepository.save(user);
        
        return Map.of(
            "success", true,
            "message", "Password changed successfully"
        );
    }

    public Map<String, Object> deleteUserWithPasswordConfirmation(Long userId, String password) {
    try {
        // Get the user
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return Map.of("success", false, "message", "User not found");
        }
        
        User user = userOpt.get();
        
        // ✅ CRITICAL: Verify password before deletion
        if (!PasswordUtil.checkPassword(password, user.getPassword())) {
            return Map.of("success", false, "message", "Incorrect password");
        }
        
        // Password verified - proceed with deletion
        userRepository.deleteById(userId);
        
        return Map.of(
            "success", true,
            "message", "Account deleted successfully"
        );
    } catch (Exception e) {
        System.err.println("Error deleting user: " + e.getMessage());
        e.printStackTrace();
        return Map.of(
            "success", false,
            "message", "Failed to delete account. Please try again."
        );
    }
}
}
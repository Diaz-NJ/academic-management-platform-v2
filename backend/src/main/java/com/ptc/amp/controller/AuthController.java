package com.ptc.amp.controller;

import com.ptc.amp.model.User;
import com.ptc.amp.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        Map<String, Object> result = authService.register(user);
        boolean success = (boolean) result.get("success");
        return success ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        
        Map<String, Object> result = authService.login(email, password);
        boolean success = (boolean) result.get("success");
        return success ? ResponseEntity.ok(result) : ResponseEntity.status(401).body(result);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Session-Id") String sessionId) {
        authService.logout(sessionId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out"));
    }

    @GetMapping("/session")
    public ResponseEntity<?> validateSession(@RequestHeader("Session-Id") String sessionId) {
        return authService.validateSession(sessionId)
                .map(userId -> ResponseEntity.ok(Map.of("valid", true, "userId", userId)))
                .orElse(ResponseEntity.status(401).body(Map.of("valid", false)));
    }

    // ✅ NEW: Update user endpoint
    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
        Optional<User> userOpt = authService.getUserById(id);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        User user = userOpt.get();
        
        // Check if email is being changed to one that already exists
        if (!user.getEmail().equals(updatedUser.getEmail())) {
            if (authService.emailExists(updatedUser.getEmail())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Email already in use"));
            }
        }
        
        // Check if student ID is being changed to one that already exists
        if (!user.getStudentId().equals(updatedUser.getStudentId())) {
            if (authService.studentIdExists(updatedUser.getStudentId())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Student ID already in use"));
            }
        }
        
        Map<String, Object> result = authService.updateUser(id, updatedUser);
        boolean success = (boolean) result.get("success");
        return success ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    @PutMapping("/users/{id}/password")
    public ResponseEntity<?> changePassword(
            @PathVariable Long id, 
            @RequestBody Map<String, String> passwordData) {
        
        String currentPassword = passwordData.get("currentPassword");
        String newPassword = passwordData.get("newPassword");
        
        if (currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest()
                .body(Map.of("success", false, "message", "Current and new password required"));
        }
        
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest()
                .body(Map.of("success", false, "message", "New password must be at least 6 characters"));
        }
        
        Map<String, Object> result = authService.changePassword(id, currentPassword, newPassword);
        boolean success = (boolean) result.get("success");
        return success ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    @DeleteMapping("/users/{id}")
public ResponseEntity<?> deleteUser(
        @PathVariable Long id, 
        @RequestHeader("Session-Id") String sessionId,
        @RequestBody Map<String, String> requestData) {
    
    // ✅ Verify session
    Optional<Long> sessionUserIdOpt = authService.validateSession(sessionId);
    if (sessionUserIdOpt.isEmpty()) {
        return ResponseEntity.status(403).body(Map.of(
            "success", false, 
            "message", "Session invalid or expired"
        ));
    }
    
    // ✅ Verify user is deleting their own account
    if (!sessionUserIdOpt.get().equals(id)) {
        return ResponseEntity.status(403).body(Map.of(
            "success", false, 
            "message", "Unauthorized - You can only delete your own account"
        ));
    }
    
    // ✅ Get password from request body
    String password = requestData.get("password");
    if (password == null || password.isEmpty()) {
        return ResponseEntity.badRequest().body(Map.of(
            "success", false,
            "message", "Password is required to delete your account"
        ));
    }
    
    // ✅ Verify password and delete
    Map<String, Object> result = authService.deleteUserWithPasswordConfirmation(id, password);
    boolean success = (boolean) result.get("success");
    
    if (success) {
        authService.logout(sessionId);
        return ResponseEntity.ok(result);
    } else {
        return ResponseEntity.status(401).body(result);
    }
}
}
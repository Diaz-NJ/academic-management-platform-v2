package com.ptc.amp.controller;

import com.ptc.amp.model.User;
import com.ptc.amp.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

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
}
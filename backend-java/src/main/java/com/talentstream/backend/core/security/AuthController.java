package com.talentstream.backend.core.security;

import com.talentstream.backend.user.User;
import com.talentstream.backend.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${m2m.client.id}")
    private String validClientId;

    @Value("${m2m.client.secret}")
    private String validClientSecret;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user){
        if(userRepository.findByUsername(user.getUsername()).isPresent()){
            return ResponseEntity.badRequest().body("Error: Username already exists!") ;
        }

        if(user.getEmail() != null && userRepository.findByEmail(user.getEmail()).isPresent()){
            return ResponseEntity.badRequest().body("Error: Email already in use!") ;
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        if(user.getRole() == null) {
            user.setRole("ROLE_CANDIDATE");
        }

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully!");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest){
        try {
            String identifier =  loginRequest.getUsername();
            User user = userRepository.findByUsernameOrEmail(identifier, identifier)
                    .orElseThrow(() -> new RuntimeException("Error: User not found"));
            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

                Map<String, String> response = new HashMap<>();
                response.put("token", token);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body("Error: Invalid password");
            }
        } catch (Exception e) {
                return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(java.security.Principal principal) {
        if (principal == null) return  ResponseEntity.status(401).build();
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Error: User not found"));
        return ResponseEntity.ok(user);
    }

    @PostMapping("/m2m")
    public ResponseEntity<?> authenticateMachine(@RequestBody Map<String, String> credentials) {
        String clientId = credentials.get("clientId");
        String clientSecret = credentials.get("clientSecret");

        if(validClientId.equals(clientId) && validClientSecret.equals(clientSecret)) {
            String m2mToken = jwtUtil.generateM2MToken(clientId);
            return ResponseEntity.ok(Map.of("token", m2mToken));
        }

        return ResponseEntity.status(401).body("Invalid M2M Credentials");
    }
}

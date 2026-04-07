package com.talentstream.backend;

import org.springframework.beans.factory.annotation.Autowired;
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

    @PostMapping("/register")
    public String register(@RequestBody User user){
        if(userRepository.findByUsername(user.getUsername()).isPresent()){
            return "Error: Username already exists!";
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        if(user.getRole() == null) {
            user.setRole("ROLE_RECRUITER");
        }

        userRepository.save(user);
        return "User registered successfully!";
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody User loginRequest){
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User not found"));
        if(passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())){
            String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            return response;
        } else {
            throw new RuntimeException("Error: Invalid password");
        }
    }
}

package com.talentstream.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Optional;

@Configuration
public class DataLoader {
    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            Optional<User> existingUser = userRepository.findByUsername("user");
            if (existingUser.isEmpty()) {
                System.out.println("⚠ Default user not found. Creating one now...");

                User defaultUser = new User();
                defaultUser.setUsername("user");
                defaultUser.setPassword(passwordEncoder.encode("password"));
                defaultUser.setRole("USER");
                userRepository.save(defaultUser);
                System.out.println("✅ Default user created successfully! (user / password)");
            } else {
                System.out.println("✅ Database already seeded.");
            }
        };
    }
}

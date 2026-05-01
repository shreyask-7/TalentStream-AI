package com.talentstream.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        // 1. Auth and Public Streams
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/stream").permitAll()

                        // 2. Job Endpoints
                        .requestMatchers(HttpMethod.GET, "/api/jobs").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/jobs/**").permitAll()

                        // 3. Application Endpoints (Candidates applying is public)
                        .requestMatchers(HttpMethod.POST, "/api/applications").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/applications").permitAll()

                        // 4. Secured Job Modifications (Recruiters only)
                        .requestMatchers(HttpMethod.POST, "/api/jobs").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/jobs/**").authenticated()

                        // Allow Prometheus Scraper
                        .requestMatchers("/actuator/**").permitAll()

                        // 5. M2M LOCKDOWN (Python AI)
                        // Python and Frontend need to read skills on boot
                        .requestMatchers(HttpMethod.GET, "/api/skills").permitAll()

                        // ONLY Python can teach the backend new skills
                        .requestMatchers(HttpMethod.POST, "/api/skills").hasAuthority("ROLE_INTERNAL_AI")

                        // ONLY Python can fetch ML training data
                        .requestMatchers(HttpMethod.GET, "/api/applications/training-data").hasAuthority("ROLE_INTERNAL_AI")

                        // ONLY Python can update the match score and skill gap
                        .requestMatchers(HttpMethod.PUT, "/api/applications/*/score").hasAuthority("ROLE_INTERNAL_AI")

                        // ONLY Python can inject extracted skills into a job profile
                        .requestMatchers(HttpMethod.PUT, "/api/jobs/*/skills").hasAuthority("ROLE_INTERNAL_AI")

                        // 6. Catch-all
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

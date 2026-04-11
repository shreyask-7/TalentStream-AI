package com.talentstream.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
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

                        // 2. Job Endpoints (Reading is public)
                        .requestMatchers(HttpMethod.GET, "/api/jobs").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/jobs/**").permitAll()

                        // 3. Application Endpoints (Applying and AI Scoring is public)
                        .requestMatchers(HttpMethod.POST, "/api/applications").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/applications/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/applications/*/score").permitAll()

                        // 4. Secured Job Modifications (Recruiters only)
                        .requestMatchers(HttpMethod.POST, "/api/jobs/*/skills").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/jobs/*/skills").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/jobs").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/jobs/**").authenticated()

                        // 5. Catch-all
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

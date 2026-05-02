package com.talentstream.backend.core.security;

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
                        .requestMatchers("/actuator/**").permitAll()

                        // 2. M2M LOCKDOWN (Python AI) - Must be before the generic rules!
                        .requestMatchers(HttpMethod.GET, "/api/skills").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/skills").hasAnyAuthority("ROLE_SYSTEM", "ROLE_INTERNAL_AI")
                        .requestMatchers(HttpMethod.GET, "/api/applications/training-data").hasAnyAuthority("ROLE_SYSTEM", "ROLE_INTERNAL_AI")
                        .requestMatchers(HttpMethod.PUT, "/api/applications/*/score").hasAnyAuthority("ROLE_SYSTEM", "ROLE_INTERNAL_AI")
                        .requestMatchers(HttpMethod.PUT, "/api/jobs/*/skills").hasAnyAuthority("ROLE_SYSTEM", "ROLE_INTERNAL_AI")

                        // 3. Job Endpoints
                        .requestMatchers(HttpMethod.GET, "/api/jobs").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/jobs/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/jobs").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/jobs/**").authenticated()

                        // 4. Application Endpoints
                        .requestMatchers(HttpMethod.POST, "/api/applications").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/applications").permitAll()

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
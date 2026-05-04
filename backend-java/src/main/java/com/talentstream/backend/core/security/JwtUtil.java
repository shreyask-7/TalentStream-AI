package com.talentstream.backend.core.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Map;
import java.util.HashMap;

@Component
public class JwtUtil {
    private final String SECRET = "TalentStreamSuperSecretKeyForJWTGeneration2026!";
    private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    public String generateToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000*60*60*10))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody().getSubject();
    }

    public String extractRole(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody().get("role", String.class);
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private java.security.Key getSigningKey() {
        byte[] keyBytes = SECRET.getBytes(StandardCharsets.UTF_8);
        return io.jsonwebtoken.security.Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateM2MToken(String clientId) {
        return Jwts.builder()
                .setSubject(clientId)
                .claim("role", "ROLE_SYSTEM")
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }
}

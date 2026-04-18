package com.talentstream.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.security.Principal;

@CrossOrigin("*") // Fixes any hidden browser security blocks
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamPersonalNotifications(Principal principal) {
        // Crash Guard: Check if Spring Security successfully verified the token!
        if (principal == null) {
            System.out.println("🚨 SSE CONNECTION REJECTED: Principal is null (Token failed!)");
            return null;
        }

        System.out.println("✅ SSE CONNECTION ACCEPTED FOR: " + principal.getName());
        return notificationService.subscribePersonal(principal.getName());
    }
}
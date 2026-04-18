package com.talentstream.backend;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.HashMap;

@Service
public class NotificationService {
    private final CopyOnWriteArrayList<SseEmitter> globalEmitters = new CopyOnWriteArrayList<>();

    private final ConcurrentHashMap<String, SseEmitter> personalEmitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L);
        globalEmitters.add(emitter);
        emitter.onCompletion(() -> globalEmitters.remove(emitter));
        emitter.onTimeout(() -> globalEmitters.remove(emitter));
        return emitter;
    }

    public void notifyJobUpdated(Job updatedJob) {
        for (SseEmitter emitter : globalEmitters) {
            try {
                emitter.send(SseEmitter.event().name("job-updated").data(updatedJob));
            } catch (Exception e) {
                globalEmitters.remove(emitter);
            }
        }
    }

    public SseEmitter subscribePersonal(String username) {
        SseEmitter emitter = new SseEmitter(0L);
        personalEmitters.put(username, emitter);

        emitter.onCompletion(() -> personalEmitters.remove(username));
        emitter.onTimeout(() -> personalEmitters.remove(username));
        emitter.onError((e) -> personalEmitters.remove(username));

        return emitter;
    }

    public void notifyCandidate(String username, String jobTitle, String newStatus) {
        SseEmitter emitter = personalEmitters.get(username);
        if (emitter != null) {
            try {
                Map<String, String> payload = new HashMap<>();
                payload.put("jobTitle", jobTitle);
                payload.put("newStatus", newStatus);
                payload.put("message", "Your application for " + jobTitle + " was moved to " + newStatus + "!");

                emitter.send(SseEmitter.event().name("status-updated").data(payload));
            } catch (Exception e) {
                personalEmitters.remove(username);
            }
        }
    }
}

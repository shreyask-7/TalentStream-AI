package com.talentstream.backend;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class NotificationService {
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        return emitter;
    }

    public void notifyJobUpdated(Job updatedJob) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("job-updated").data(updatedJob));
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }
}

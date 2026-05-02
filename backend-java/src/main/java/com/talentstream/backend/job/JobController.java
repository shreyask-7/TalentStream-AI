package com.talentstream.backend.job;

import com.talentstream.backend.application.Application;
import com.talentstream.backend.stream.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    @Autowired
    private JobService jobService;

    @Autowired
    private NotificationService notificationService;

    @PreAuthorize("hasRole('RECRUITER')")
    @PostMapping
    public ResponseEntity<Job> createJob(@RequestBody Job job, Principal principal) {
        job.setPostedBy(principal.getName());
        return ResponseEntity.ok(jobService.save(job));
    }

    @GetMapping
    public ResponseEntity<List<Job>> getJobs() {
        return ResponseEntity.ok(jobService.findAll());
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/my-jobs")
    public ResponseEntity<List<Job>> getMyJobs(Principal principal) {
        return ResponseEntity.ok(jobService.findMyJobs(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getJobbyId(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(jobService.findById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/{id}/applications")
    public ResponseEntity<?> getApplicationsForJob(@PathVariable Long id, Principal principal) {
        try {
            List<Application> applications = jobService.getJobApplicationsStrict(id, principal.getName());
            return ResponseEntity.ok(applications);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id) {
        jobService.delete(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/skills")
    public ResponseEntity<Void> updateSkills(@PathVariable("id") Long id, @RequestBody Map<String, List<String>> payload) {
        jobService.updateJobSkills(id, payload.get("skills"));
        return ResponseEntity.ok().build();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamJobs(){
        return notificationService.subscribe();
    }

    @GetMapping(value = "/notifications/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamPersonalNotifications(Principal principal) {
        if (principal == null) {
            System.out.println("🚨 SSE CONNECTION REJECTED: Principal is null");
            return null;
        }
        System.out.println("✅ SSE CONNECTION ACCEPTED FOR: " + principal.getName());
        return notificationService.subscribePersonal(principal.getName());
    }
}
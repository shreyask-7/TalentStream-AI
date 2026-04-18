package com.talentstream.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    @Autowired
    private JobService jobsService;
    @Autowired
    private ApplicationRepository applicationRepository;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private JobRepository jobRepository;

    @PreAuthorize("hasRole('RECRUITER')")
    @PostMapping
    public ResponseEntity<Job> createJob(@RequestBody Job job,  Principal principal) {
        String currentRecruiter = principal.getName();
        job.setPostedBy(currentRecruiter);
        return ResponseEntity.ok(jobsService.save(job));
    }

    @GetMapping
    public List<Job> getJobs() {
        return jobsService.findAll();
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/my-jobs")
    public ResponseEntity<List<Job>> getMyJobs(Principal principal) {
        List<Job> myJobs = jobRepository.findByPostedBy(principal.getName());
        return ResponseEntity.ok(myJobs);
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamJobs(){
        return notificationService.subscribe();
    }

    // --- PRIVATE CANDIDATE NOTIFICATION STREAM ---
    @GetMapping(value = "/notifications/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamPersonalNotifications(Principal principal) {
        if (principal == null) {
            System.out.println("🚨 SSE CONNECTION REJECTED: Principal is null");
            return null;
        }
        System.out.println("✅ SSE CONNECTION ACCEPTED FOR: " + principal.getName());
        return notificationService.subscribePersonal(principal.getName());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getJobbyId(@PathVariable Long id) {
        try {
            Job job = jobRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Job not found with id " + id));
            return ResponseEntity.ok(job);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/{id}/applications")
    public ResponseEntity<?> getApplicationsForJob(@PathVariable Long id, Principal principal) {
        Job job = jobRepository.findById(id).orElse(null);
        if(job == null || !job.getPostedBy().equals(principal.getName())) {
            return ResponseEntity.status(403).body("Not authorized to view these candidates.");
        }

        List<Application> applications = applicationRepository.findByJobId(id);
        return ResponseEntity.ok(applications);
    }

    @DeleteMapping("/{id}")
    public void deleteJob(@PathVariable Long id) {
        jobsService.delete(id);
    }

    @PutMapping("/{id}/skills")
    public ResponseEntity<Void> updateSkills(@PathVariable("id") Long id, @RequestBody Map<String, List<String>> payload) {
        List<String> skills = payload.get("skills");
        jobsService.updateJobSkills(id, skills);
        return ResponseEntity.ok().build();
    }
}

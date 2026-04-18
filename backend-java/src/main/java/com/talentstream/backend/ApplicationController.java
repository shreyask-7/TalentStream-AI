package com.talentstream.backend;

import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Collectors;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {
    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private NotificationService notificationService;

    @PostMapping
    public ResponseEntity<?> applyForJob(
            @RequestParam("jobId") Long jobId,
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("resume") MultipartFile resume,
            Principal principal) {
        try {
            Application application = applicationService.submitApplication(jobId, name, email, resume);

            if(principal != null) {
                application.setAppliedByUsername(principal.getName());
                applicationRepository.save(application);
            }

            return ResponseEntity.ok("Application submitted successfully! ID: " + application.getId());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Application failed: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/score")
    public ResponseEntity<?> updateScore(@PathVariable Long id, @RequestBody Map<String, Double> payload) {
        try {
            Double score = payload.get("aiMatchScore");
            if(score == null) {
                return ResponseEntity.badRequest().body("Missing aiMatchScore in payload");
            }
            Application updatedApp =  applicationService.updateApplicationScore(id, score);
            return ResponseEntity.ok("Score updated successfully for Application ID: " + updatedApp.getId());
        } catch (Exception e) {
            return  ResponseEntity.badRequest().body("Failed to update score: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping
    public ResponseEntity<?> getMyApplications(Principal principal) {
        try {
            String currentRecruiter = principal.getName();

            List<Job> myJobs = jobRepository.findByPostedBy(currentRecruiter);

            if(myJobs.isEmpty()) {
                return ResponseEntity.ok(new ArrayList<>());
            }

            List<Long> myJobIds = myJobs.stream().map(Job::getId).collect(Collectors.toList());

            List<Application> myApplications = applicationRepository.findByJobIdIn(myJobIds);
            return ResponseEntity.ok(myApplications);
        } catch (Exception e) {
            return  ResponseEntity.badRequest().body("Error fetching applications: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            Application app = applicationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Application not found for ID: " + id));
            String newStatus = payload.get("status");
            app.setStatus(newStatus);
            applicationRepository.save(app);

            String username = app.getAppliedByUsername();
            String jobTitle = app.getJob().getTitle();

            if(username != null){
                notificationService.notifyCandidate(username, jobTitle, newStatus);
            }

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update status: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/{id}/resume")
    public ResponseEntity<Resource> viewResume(@PathVariable Long id) {
        try {
            Application application = applicationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Application not found for ID: " + id));
            Path filePath = Paths.get(application.getResumeFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if(!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}

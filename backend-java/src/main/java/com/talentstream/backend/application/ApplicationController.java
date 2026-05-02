package com.talentstream.backend.application;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping
    public ResponseEntity<?> applyForJob(
            @RequestParam("jobId") Long jobId,
            @RequestParam("email") String email,
            @RequestParam("resume") MultipartFile resume,
            Principal principal) {
        try {
            if(principal == null) return ResponseEntity.status(401).body("You must be logged in");
            Application app = applicationService.submitApplication(jobId, email, resume, principal.getName());
            return ResponseEntity.ok("Application submitted successfully! ID: " + app.getId());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Application failed: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('CANDIDATE')")
    @GetMapping("/me")
    public ResponseEntity<?> getMySubmittedApplications(Principal principal) {
        if(principal == null) return ResponseEntity.status(401).body("Not authorized");
        return ResponseEntity.ok(applicationService.getApplicationsForCandidate(principal.getName()));
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping
    public ResponseEntity<?> getMyApplications(Principal principal) {
        return ResponseEntity.ok(applicationService.getApplicationsForRecruiter(principal.getName()));
    }

    @PutMapping("/{id}/score")
    public ResponseEntity<?> updateScore(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            if(payload.get("aiMatchScore") == null) return ResponseEntity.badRequest().body("Missing score");
            Double score = Double.valueOf(payload.get("aiMatchScore").toString());
            String skillGap = (String) payload.get("aiSkillGap");

            applicationService.updateApplicationScore(id, score, skillGap);
            return ResponseEntity.ok("Score updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update score: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            applicationService.updateStatus(id, payload.get("status"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update status: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @PatchMapping("/{id}/feedback")
    public ResponseEntity<?> submitAiFeedback(@PathVariable Long id, @RequestBody Map<String, Integer> payload) {
        try {
            applicationService.submitAiFeedback(id, payload.get("aiFeedback"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to save feedback: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/{id}/resume")
    public ResponseEntity<Resource> viewResume(@PathVariable Long id) {
        try {
            Resource resource = applicationService.loadResumeAsResource(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(404).build();
        }
    }

    @GetMapping("/training-data")
    public ResponseEntity<?> getTrainingData(){
        try {
            return ResponseEntity.ok(applicationService.generateTrainingData());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
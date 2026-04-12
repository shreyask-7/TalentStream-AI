package com.talentstream.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {
    @Autowired
    private ApplicationService applicationService;

    @PostMapping
    public ResponseEntity<?> applyForJob(
            @RequestParam("jobId") Long jobId,
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("resume") MultipartFile resume) {
        try {
            Application application = applicationService.submitApplication(jobId, name, email, resume);
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

    @GetMapping
    public ResponseEntity<?> getAllApplications() {
        try {
            return ResponseEntity.ok(applicationService.findAllApplications());
        } catch (Exception e) {
            return  ResponseEntity.badRequest().body("Error fetching applications: " + e.getMessage());
        }
    }
}

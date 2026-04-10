package com.talentstream.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
}

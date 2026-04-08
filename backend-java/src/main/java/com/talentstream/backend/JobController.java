package com.talentstream.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.http.ResponseEntity;
import java.util.Map;

import java.awt.*;
import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    @Autowired
    private JobService jobsService;

    @Autowired
    private NotificationService notificationService;

    @PostMapping
    public Job createJob(@RequestBody Job job) {
        return jobsService.save(job);
    }

    @GetMapping
    public List<Job> getJobs() {
        return jobsService.findAll();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamJobs() {
        return notificationService.subscribe();
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

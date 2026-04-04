package com.talentstream.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    @Autowired
    private JobService jobsService;

    @PostMapping
    public Job createJob(@RequestBody Job job) {
        return jobsService.save(job);
    }

    @GetMapping
    public List<Job> getJobs() {
        return jobsService.findAll();
    }

    @DeleteMapping("/{id}")
    public void deleteJob(@PathVariable Long id) {
        jobsService.delete(id);
    }

    @PutMapping("/{id}/skills")
    public void updateSkills(@PathVariable("id") Long id, @RequestBody List<String> skills) {
        jobsService.updateJobSkills(id, skills);
    }
}

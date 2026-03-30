package com.talentstream.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
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
}

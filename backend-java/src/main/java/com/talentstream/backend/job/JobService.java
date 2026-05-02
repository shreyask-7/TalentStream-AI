package com.talentstream.backend.job;

import com.talentstream.backend.application.Application;
import com.talentstream.backend.application.ApplicationRepository;
import com.talentstream.backend.stream.KafkaProducerService;
import com.talentstream.backend.stream.NotificationService;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final KafkaProducerService kafkaProducerService;
    private final NotificationService notificationService;

    public JobService(JobRepository jobRepository, ApplicationRepository applicationRepository, KafkaProducerService kafkaProducerService, NotificationService notificationService) {
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.kafkaProducerService = kafkaProducerService;
        this.notificationService = notificationService;
    }

    @SuppressWarnings("unchecked")
    public Job save(Job job) {
        Job savedJob = jobRepository.save(job);

        Map<String, Object> jobEvent = new HashMap<>();
        jobEvent.put("id", savedJob.getId());
        jobEvent.put("description", savedJob.getDescription());

        kafkaProducerService.sendJobEvent(jobEvent);
        return savedJob;
    }

    public List<Job> findAll() {
        return jobRepository.findAll();
    }

    public List<Job> findMyJobs(String recruiterUsername) {
        return jobRepository.findByPostedBy(recruiterUsername);
    }

    public Job findById(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id " + id));
    }

    public List<Application> getJobApplicationsStrict(Long jobId, String recruiterUsername) {
        Job job = jobRepository.findById(jobId).orElse(null);
        if(job == null || !job.getPostedBy().equals(recruiterUsername)) {
            throw new RuntimeException("Not authorized to view these candidates.");
        }
        return applicationRepository.findByJobId(jobId);
    }

    public void delete(Long id) {
        jobRepository.deleteById(id);
    }

    public void updateJobSkills(Long jobId, List<String> skills) {
        jobRepository.findById(jobId).ifPresent(job-> {
            job.setSkills(skills);
            Job savedJob = jobRepository.save(job);
            notificationService.notifyJobUpdated(savedJob);
            System.out.println("Updated Job " + jobId + " with skills: " + skills);
        });
    }
}
package com.talentstream.backend;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class JobService {

    private JobRepository jobRepository;
    private final KafkaProducerService kafkaProducerService;
    private final NotificationService notificationService;

    public JobService(JobRepository jobRepository, KafkaProducerService kafkaProducerService, NotificationService notificationService) {
        this.jobRepository = jobRepository;
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

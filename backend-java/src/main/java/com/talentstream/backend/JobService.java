package com.talentstream.backend;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class JobService {

    private JobRepository jobRepository;
    private final KafkaProducerService kafkaProducerService;

    public JobService(JobRepository jobRepository, KafkaProducerService kafkaProducerService) {
        this.jobRepository = jobRepository;
        this.kafkaProducerService = kafkaProducerService;
    }

    @SuppressWarnings("unchecked")
    public Job save(Job job) {
        Job savedJob = jobRepository.save(job);
        String message = savedJob.getId() + ":" + savedJob.getDescription();
        kafkaProducerService.sendJobEvent(message);
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
            jobRepository.save(job);
            System.out.println("Updated Job " + jobId + " with skills: " + skills);
        });
    }
}

package com.talentstream.backend;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.List;
import java.util.HashMap;

@Service
public class JobService {

    private JobRepository jobRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final String AI_SERVICE_URL = "http://localhost:5000/extract-skills";

    public JobService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    @SuppressWarnings("unchecked")
    public Job save(Job job) {
        try {
            Map<String, String> request = new HashMap<>();
            request.put("description", job.getDescription());

            Map<String, List<String>> response = restTemplate.postForObject(
                    AI_SERVICE_URL,
                    request,
                    Map.class
            );

            if(response != null && response.containsKey("skills")) {
                job.setSkills(response.get("skills"));
            }
        } catch (Exception e) {
            System.err.println("Warning: AI Service is down. Saving job without skills");
            e.printStackTrace();
        }

        return jobRepository.save(job);
    }

    public List<Job> findAll() {
        return jobRepository.findAll();
    }

    public void delete(Long id) {
        jobRepository.deleteById(id);
    }
}

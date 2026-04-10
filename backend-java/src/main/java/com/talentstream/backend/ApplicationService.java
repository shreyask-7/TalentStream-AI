package com.talentstream.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import java.util.UUID;

@Service
public class ApplicationService {
    @Autowired
    private ApplicationRepository applicationRepository;
    @Autowired
    private CandidateRepository candidateRepository;
    @Autowired
    private JobRepository jobRepository;
    @Autowired
    private JobService jobService;

    private final String UPLOAD_DIR = "uploads/";
    @Autowired
    private KafkaProducerService kafkaProducerService;

    public Application submitApplication(Long jobId, String name, String email, MultipartFile file) throws IOException {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        Optional<Candidate> existingCandidate = candidateRepository.findByEmail(email);
        Candidate candidate;
        if(existingCandidate.isPresent()) {
            candidate = existingCandidate.get();
        } else {
            candidate = new Candidate();
            candidate.setName(name);
            candidate.setEmail(email);
            candidate =  candidateRepository.save(candidate);
        }

        File directory = new File(UPLOAD_DIR);
        if(!directory.exists()) {
            directory.mkdir();
        }

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(UPLOAD_DIR, fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        Application application = new Application();
        application.setCandidate(candidate);
        application.setJob(job);
        application.setResumeFilePath(filePath.toString());
        application =  applicationRepository.save(application);

        ResumeUploadedEvent event = new ResumeUploadedEvent(application.getId(), job.getId(), application.getResumeFilePath());
        kafkaProducerService.sendResumeEvent(event);
        return application;
    }
}
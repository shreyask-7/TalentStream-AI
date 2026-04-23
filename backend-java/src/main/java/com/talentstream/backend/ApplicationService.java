package com.talentstream.backend;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Counter;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Service
public class ApplicationService {
    @Autowired
    private ApplicationRepository applicationRepository;
    @Autowired
    private JobRepository jobRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JobService jobService;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private MeterRegistry meterRegistry;

    private final String UPLOAD_DIR = "uploads/";
    @Autowired
    private KafkaProducerService kafkaProducerService;

    public Application submitApplication(Long jobId, String contactEmail, MultipartFile file, String username) throws IOException {
        if(applicationRepository.existsByJobIdAndUserUsername(jobId, username)) {
            throw new RuntimeException("You have already applied for this role!");
        }

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        User applyingUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User account not found"));

        File directory = new File(UPLOAD_DIR);
        if(!directory.exists()) {
            directory.mkdir();
        }

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(UPLOAD_DIR, fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        Application application = new Application();
        application.setUser(applyingUser);
        application.setContactEmail(contactEmail);
        application.setJob(job);
        application.setResumeFilePath(filePath.toString());

        application =  applicationRepository.save(application);

        if(job.getPostedBy() != null) {
            notificationService.notifyRecruiter(job.getPostedBy(), application);
        }

        ResumeUploadedEvent event = new ResumeUploadedEvent(application.getId(), job.getId(), application.getResumeFilePath());
        kafkaProducerService.sendResumeEvent(event);

        // Increment the custom business metric
        Counter.builder("talentstream.application.submitted")
                .description("Total number of candidate applications submitted")
                .tag("jobId", String.valueOf(jobId))
                .register(meterRegistry)
                .increment();

        return application;
    }

    public Application updateApplicationScore(Long id, Double aiMatchScore) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        application.setAiMatchScore(aiMatchScore);
        return applicationRepository.save(application);
    }

    public List<Application> findAllApplications() {
        return applicationRepository.findAll();
    }
}
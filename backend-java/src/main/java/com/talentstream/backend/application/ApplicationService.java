package com.talentstream.backend.application;

import com.talentstream.backend.user.User;
import com.talentstream.backend.user.UserRepository;
import com.talentstream.backend.job.Job;
import com.talentstream.backend.job.JobRepository;
import com.talentstream.backend.stream.NotificationService;
import com.talentstream.backend.stream.KafkaProducerService;
import com.talentstream.backend.stream.ResumeUploadedEvent;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Counter;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final KafkaProducerService kafkaProducerService;
    private final MeterRegistry meterRegistry;

    private final String UPLOAD_DIR = "uploads/";

    public ApplicationService(ApplicationRepository applicationRepository, JobRepository jobRepository, UserRepository userRepository, NotificationService notificationService, KafkaProducerService kafkaProducerService, MeterRegistry meterRegistry) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.kafkaProducerService = kafkaProducerService;
        this.meterRegistry = meterRegistry;
    }

    public Application submitApplication(Long jobId, String contactEmail, MultipartFile file, String username) throws IOException {
        if(applicationRepository.existsByJobIdAndUserUsername(jobId, username)) {
            throw new RuntimeException("You have already applied for this role!");
        }

        Job job = jobRepository.findById(jobId).orElseThrow(() -> new RuntimeException("Job not found"));
        User applyingUser = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User account not found"));

        File directory = new File(UPLOAD_DIR);
        if(!directory.exists()) directory.mkdir();

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(UPLOAD_DIR, fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        Application application = new Application();
        application.setUser(applyingUser);
        application.setContactEmail(contactEmail);
        application.setJob(job);
        application.setResumeFilePath(filePath.toString());

        application = applicationRepository.save(application);

        if(job.getPostedBy() != null) {
            notificationService.notifyRecruiter(job.getPostedBy(), application);
        }

        kafkaProducerService.sendResumeEvent(new ResumeUploadedEvent(application.getId(), job.getId(), application.getResumeFilePath()));

        Counter.builder("talentstream.application.submitted")
                .description("Total number of candidate applications submitted")
                .tag("jobId", String.valueOf(jobId))
                .register(meterRegistry).increment();

        return application;
    }

    public List<Application> getApplicationsForCandidate(String username) {
        return applicationRepository.findByUserUsername(username);
    }

    public List<Application> getApplicationsForRecruiter(String recruiterUsername) {
        List<Job> myJobs = jobRepository.findByPostedBy(recruiterUsername);
        if(myJobs.isEmpty()) return new ArrayList<>();
        List<Long> myJobIds = myJobs.stream().map(Job::getId).collect(Collectors.toList());
        return applicationRepository.findByJobIdIn(myJobIds);
    }

    public Application updateApplicationScore(Long id, Double aiMatchScore, String aiSkillGap) {
        Application application = applicationRepository.findById(id).orElseThrow(() -> new RuntimeException("Application not found"));
        application.setAiMatchScore(aiMatchScore);
        if(aiSkillGap != null) application.setAiSkillGap(aiSkillGap);
        return applicationRepository.save(application);
    }

    public void updateStatus(Long id, String newStatus) {
        Application app = applicationRepository.findById(id).orElseThrow(() -> new RuntimeException("Application not found"));
        app.setStatus(newStatus);
        applicationRepository.save(app);

        if(app.getUser().getUsername() != null){
            notificationService.notifyCandidate(app.getUser().getUsername(), app.getJob().getTitle(), newStatus);
        }
    }

    public void submitAiFeedback(Long id, Integer feedback) {
        Application app = applicationRepository.findById(id).orElseThrow(() -> new RuntimeException("Application not found"));
        app.setAiFeedback(feedback);
        applicationRepository.save(app);
    }

    public Resource loadResumeAsResource(Long id) throws Exception {
        Application application = applicationRepository.findById(id).orElseThrow(() -> new RuntimeException("Application not found"));
        Path filePath = Paths.get(application.getResumeFilePath()).normalize();
        Resource resource = new UrlResource(filePath.toUri());
        if(!resource.exists()) throw new RuntimeException("File not found on server");
        return resource;
    }

    public List<Map<String, Object>> generateTrainingData() {
        List<Application> feedbackApps = applicationRepository.findByAiFeedbackIsNotNull();
        return feedbackApps.stream().map(app -> {
            int missingSkillsCount = 0;
            if(app.getAiSkillGap() != null && app.getAiSkillGap().contains(":")) {
                String skillsPart = app.getAiSkillGap().split(":")[1];
                missingSkillsCount = skillsPart.split(",").length;
            }
            return Map.<String, Object>of(
                    "matchScore", app.getAiMatchScore() != null ? app.getAiMatchScore(): 0.0,
                    "missingSkillsCount", missingSkillsCount,
                    "feedback", app.getAiFeedback()
            );
        }).collect(Collectors.toList());
    }
}
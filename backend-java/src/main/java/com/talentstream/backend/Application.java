package com.talentstream.backend;

import jakarta.persistence.*;

@Entity
@Table(name = "applications")
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String contactEmail;

    @Column(nullable = false)
    private String resumeFilePath;

    @Column(nullable = true)
    private Double aiMatchScore;

    @Column(nullable = true)
    private String status = "APPLIED";

    public Application() {}

    public Long getId() {
        return id;
    }
    public void setId(Long id) { this.id = id; }

    public Job getJob() { return job; }
    public void setJob(Job job) { this.job = job; }

    public  User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getResumeFilePath() { return resumeFilePath; }
    public void setResumeFilePath(String resumeFilePath) { this.resumeFilePath = resumeFilePath; }

    public Double getAiMatchScore() { return aiMatchScore; }
    public void setAiMatchScore(Double aiMatchScore) { this.aiMatchScore = aiMatchScore; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

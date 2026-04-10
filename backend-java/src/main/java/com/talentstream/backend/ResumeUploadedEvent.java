package com.talentstream.backend;

public class ResumeUploadedEvent {
    private Long applicationId;
    private Long jobId;
    private String resumeUploadedPath;

    public ResumeUploadedEvent(Long applicationId, Long jobId, String resumeUploadedPath) {
        this.applicationId = applicationId;
        this.jobId = jobId;
        this.resumeUploadedPath = resumeUploadedPath;
    }

    public Long getApplicationId() {
        return applicationId;
    }
    public Long getJobId() {
        return jobId;
    }
    public String getResumeUploadedPath() {
        return resumeUploadedPath;
    }
}

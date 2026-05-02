package com.talentstream.backend.analytics;

import com.talentstream.backend.application.ApplicationRepository;
import com.talentstream.backend.job.JobRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;

    public AnalyticsService(ApplicationRepository applicationRepository, JobRepository jobRepository) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
    }

    public Map<String, Object> getRecruiterStats(String username) {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalJobs", jobRepository.countByPostedBy(username));
        stats.put("totalApplications", applicationRepository.countTotalApplicationsForRecruiter(username));

        Double avgScore = applicationRepository.getAverageAiScoreForRecruiter(username);
        stats.put("averageAiScore", avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0.0);

        List<Object[]> statusCount = applicationRepository.countApplicationsByStatusForRecruiter(username);
        Map<String, Long> pipeline = new HashMap<>();
        pipeline.put("APPLIED", 0L);
        pipeline.put("REVIEWING", 0L);
        pipeline.put("INTERVIEWING", 0L);
        pipeline.put("OFFERED", 0L);
        pipeline.put("REJECTED", 0L);

        for (Object[] row : statusCount) {
            pipeline.put((String) row[0], (Long) row[1]);
        }
        stats.put("pipeline", pipeline);

        return stats;
    }
}
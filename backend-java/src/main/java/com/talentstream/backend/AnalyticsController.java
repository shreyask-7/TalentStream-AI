package com.talentstream.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    @Autowired
    private ApplicationRepository applicationRepository;
    @Autowired
    private JobRepository jobRepository;

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/dashboard")
    public ResponseEntity<?> getRecruiterDashboardStats(Principal principal) {
        try {
            String username = principal.getName();
            Map<String, Object> stats = new HashMap<>();

            Long totalJobs = jobRepository.countByPostedBy(username);
            stats.put("totalJobs", totalJobs);

            Long totalApplications = applicationRepository.countTotalApplicationsForRecruiter(username);
            stats.put("totalApplications", totalApplications);

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
                String status = (String) row[0];
                Long count = (Long) row[1];
                pipeline.put(status, count);
            }
            stats.put("pipeline", pipeline);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching analytics: " + e.getMessage());
        }
    }
}

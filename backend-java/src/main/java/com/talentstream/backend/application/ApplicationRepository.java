package com.talentstream.backend.application;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByJobId(Long jobId);
    List<Application> findByJobIdIn(List<Long> jobIds);
    boolean existsByJobIdAndUserUsername(Long jobId, String username);
    List<Application> findByUserUsername(String username);
    List<Application> findByAiFeedbackIsNotNull();

    @Query("SELECT a.status, COUNT(a) FROM Application a WHERE a.job.postedBy = :username GROUP BY a.status")
    List<Object[]> countApplicationsByStatusForRecruiter(@Param("username") String username);

    @Query("SELECT AVG(a.aiMatchScore) FROM Application a WHERE a.job.postedBy = :username")
    Double getAverageAiScoreForRecruiter(@Param("username") String username);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.job.postedBy = :username")
    Long countTotalApplicationsForRecruiter(@Param("username") String username);
}
package com.talentstream.backend;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationRepository  extends JpaRepository<Application, Long> {
    List<Application> findByJobIdIn(List<Long> jobIds);
}

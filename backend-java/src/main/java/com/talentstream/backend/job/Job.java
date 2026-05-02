package com.talentstream.backend.job;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
import com.talentstream.backend.application.Application;

@Entity
@Table(name = "jobs")
@Data
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String company;

    @Column(nullable = true)
    private String postedBy;

    // Lombok's @Data already generates these, but we can keep them if you prefer explicit definitions!
    public String getPostedBy() { return postedBy; }
    public void setPostedBy(String postedBy) { this.postedBy = postedBy; }

    @ElementCollection
    @CollectionTable(name = "job_skills", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "skills")
    private List<String> skills;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Application> applications;
}
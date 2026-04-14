package com.talentstream.backend;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

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

    public String getPostedBy() {
        return postedBy;
    }
    public void setPostedBy(String postedBy) { this.postedBy = postedBy; }

    @ElementCollection
    @CollectionTable(name = "job_skills", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "skills")
    private List<String> skills;
}
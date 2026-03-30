package com.lms.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
public class Job {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 200)
    private String company;

    @Column(length = 200)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "skills_needed", columnDefinition = "TEXT")
    private String skillsNeeded;

    @Column(name = "salary_range", length = 100)
    private String salaryRange;

    @Column(name = "job_type", length = 50)
    private String jobType; // FULL_TIME, PART_TIME, INTERNSHIP

    @Column(name = "is_paid")
    private Boolean isPaid = true;

    @Column(length = 100)
    private String stipend;

    @Column(name = "apply_deadline", nullable = false)
    private LocalDate applyDeadline;

    @Column(name = "posted_by")
    private Long postedBy;

    @Column(length = 20)
    private String status = "ACTIVE";

    @Column(name = "notify_matched")
    private Boolean notifyMatched = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // ─── Getters & Setters ────────────────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }
    public String getSkillsNeeded() { return skillsNeeded; }
    public void setSkillsNeeded(String skillsNeeded) { this.skillsNeeded = skillsNeeded; }
    public String getSalaryRange() { return salaryRange; }
    public void setSalaryRange(String salaryRange) { this.salaryRange = salaryRange; }
    public String getJobType() { return jobType; }
    public void setJobType(String jobType) { this.jobType = jobType; }
    public Boolean getIsPaid() { return isPaid; }
    public void setIsPaid(Boolean isPaid) { this.isPaid = isPaid; }
    public String getStipend() { return stipend; }
    public void setStipend(String stipend) { this.stipend = stipend; }
    public LocalDate getApplyDeadline() { return applyDeadline; }
    public void setApplyDeadline(LocalDate applyDeadline) { this.applyDeadline = applyDeadline; }
    public Long getPostedBy() { return postedBy; }
    public void setPostedBy(Long postedBy) { this.postedBy = postedBy; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getNotifyMatched() { return notifyMatched; }
    public void setNotifyMatched(Boolean notifyMatched) { this.notifyMatched = notifyMatched; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

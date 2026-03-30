package com.lms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "leads")
public class Lead {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 200)
    private String email;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(name = "course_interest", length = 300)
    private String courseInterest;

    @Column(length = 100)
    private String source; // WALK_IN, SOCIAL_MEDIA, REFERRAL, WEBSITE, PHONE, EMAIL

    @Column(length = 50)
    private String status = "NEW"; // NEW, CONTACTED, INTERESTED, NOT_INTERESTED, CONVERTED, LOST

    @Column(length = 20)
    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH

    @Column(name = "assigned_to")
    private Long assignedTo;

    @Column(name = "next_followup_date")
    private java.time.LocalDate nextFollowupDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "converted_at")
    private LocalDateTime convertedAt;

    @Column(name = "converted_student_id")
    private Long convertedStudentId;

    // ─── Getters & Setters ────────────────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getCourseInterest() { return courseInterest; }
    public void setCourseInterest(String courseInterest) { this.courseInterest = courseInterest; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public Long getAssignedTo() { return assignedTo; }
    public void setAssignedTo(Long assignedTo) { this.assignedTo = assignedTo; }
    public java.time.LocalDate getNextFollowupDate() { return nextFollowupDate; }
    public void setNextFollowupDate(java.time.LocalDate nextFollowupDate) { this.nextFollowupDate = nextFollowupDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getConvertedAt() { return convertedAt; }
    public void setConvertedAt(LocalDateTime convertedAt) { this.convertedAt = convertedAt; }
    public Long getConvertedStudentId() { return convertedStudentId; }
    public void setConvertedStudentId(Long convertedStudentId) { this.convertedStudentId = convertedStudentId; }
}

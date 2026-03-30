package com.lms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"scheduled_class_id", "student_id"})
       })
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "scheduled_class_id", nullable = false)
    private Integer scheduledClassId;

    @Column(name = "student_id", nullable = false)
    private Integer studentId;

    @Column(nullable = false)
    private String status;  // PRESENT / ABSENT / LEAVE

    @Column(name = "approved_online")
    private Boolean approvedOnline = false;

    @Column(name = "marked_by", nullable = false)
    private Integer markedBy;

    @Column(name = "marked_at")
    private LocalDateTime markedAt = LocalDateTime.now();

    // Getters & Setters
    public Integer getId() { return id; }

    public Integer getScheduledClassId() { return scheduledClassId; }
    public void setScheduledClassId(Integer scheduledClassId) { this.scheduledClassId = scheduledClassId; }

    public Integer getStudentId() { return studentId; }
    public void setStudentId(Integer studentId) { this.studentId = studentId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getApprovedOnline() { return approvedOnline; }
    public void setApprovedOnline(Boolean approvedOnline) { this.approvedOnline = approvedOnline; }

    public Integer getMarkedBy() { return markedBy; }
    public void setMarkedBy(Integer markedBy) { this.markedBy = markedBy; }

    public LocalDateTime getMarkedAt() { return markedAt; }
    public void setMarkedAt(LocalDateTime markedAt) { this.markedAt = markedAt; }
}
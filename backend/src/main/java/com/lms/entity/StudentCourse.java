package com.lms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "student_course",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "course_id"})
    }
)
public class StudentCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many students can map to one course
    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    // Many students can map to one course
    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private CourseMaster course;

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    @Column(name = "fee_paid")
    private Double feePaid = 0.0;

    @Column(name = "fee_pending")
    private Double feePending = 0.0;

    @Column(name = "course_mode", length = 30)
    private String courseMode; // ONLINE, OFFLINE, HYBRID

    @Column(name = "enrolled_at")
    private LocalDateTime enrolledAt;

    // ===== GETTERS & SETTERS =====

    public Long getId() {
        return id;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public CourseMaster getCourse() {
        return course;
    }

    public void setCourse(CourseMaster course) {
        this.course = course;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getFeePaid() { return feePaid; }
    public void setFeePaid(Double feePaid) { this.feePaid = feePaid; }

    public Double getFeePending() { return feePending; }
    public void setFeePending(Double feePending) { this.feePending = feePending; }

    public String getCourseMode() { return courseMode; }
    public void setCourseMode(String courseMode) { this.courseMode = courseMode; }

    public LocalDateTime getEnrolledAt() { return enrolledAt; }
    public void setEnrolledAt(LocalDateTime enrolledAt) { this.enrolledAt = enrolledAt; }
}
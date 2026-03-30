package com.lms.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "trainer_marked_attendance")
public class TrainerMarkedAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "student_id", nullable = false)
    private Integer studentId;

    @Column(name = "batch_id", nullable = false)
    private Integer batchId;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(nullable = false)
    private String status; // Expecting: 'PRESENT', 'ABSENT', or 'LEAVE'

    @Column(name = "approved_online")
    private Boolean approvedOnline = false;

    @Column(name = "topic", length = 255)
    private String topic;

    @Column(name = "late_minutes")
    private Integer lateMinutes;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // --- Constructors ---

    public TrainerMarkedAttendance() {
    }

    public TrainerMarkedAttendance(Integer studentId, Integer batchId, LocalDate attendanceDate, String status, String topic) {
        this.studentId = studentId;
        this.batchId = batchId;
        this.attendanceDate = attendanceDate;
        this.status = status;
        this.topic = topic;
    }

    // --- Getters and Setters ---

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getStudentId() {
        return studentId;
    }

    public void setStudentId(Integer studentId) {
        this.studentId = studentId;
    }

    public Integer getBatchId() {
        return batchId;
    }

    public void setBatchId(Integer batchId) {
        this.batchId = batchId;
    }

    public LocalDate getAttendanceDate() {
        return attendanceDate;
    }

    public void setAttendanceDate(LocalDate attendanceDate) {
        this.attendanceDate = attendanceDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getApprovedOnline() {
        return approvedOnline;
    }

    public void setApprovedOnline(Boolean approvedOnline) {
        this.approvedOnline = approvedOnline;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public Integer getLateMinutes() {
        return lateMinutes;
    }

    public void setLateMinutes(Integer lateMinutes) {
        this.lateMinutes = lateMinutes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
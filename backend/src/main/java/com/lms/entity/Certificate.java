package com.lms.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "certificates")
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User student;

    @Column(name = "course_name", nullable = false)
    private String courseName;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "visible_from")
    private java.time.LocalDateTime visibleFrom;

    // Default constructor
    public Certificate() {
    }

    public Certificate(User student, String courseName, String fileName, String filePath, LocalDate issueDate, java.time.LocalDateTime visibleFrom) {
        this.student = student;
        this.courseName = courseName;
        this.fileName = fileName;
        this.filePath = filePath;
        this.issueDate = issueDate;
        this.visibleFrom = visibleFrom;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public java.time.LocalDateTime getVisibleFrom() {
        return visibleFrom;
    }

    public void setVisibleFrom(java.time.LocalDateTime visibleFrom) {
        this.visibleFrom = visibleFrom;
    }
}

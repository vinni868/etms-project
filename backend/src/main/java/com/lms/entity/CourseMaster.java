package com.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import jakarta.persistence.*;

@Entity
@Table(name = "course_master")
public class CourseMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_name")
    private String courseName;

    @Column(unique = true, length = 10)
    private String shortcut;

    private String duration;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String syllabusFileName;

    private String syllabusFilePath;

    @Column(name = "course_code", unique = true, length = 50)
    private String courseCode;

    @Column(length = 100)
    private String category;

    @Column(nullable = false)
    private String status = "ACTIVE";

    // ================= GETTERS & SETTERS =================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public String getShortcut() { return shortcut; }
    public void setShortcut(String shortcut) { this.shortcut = shortcut; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSyllabusFileName() { return syllabusFileName; }
    public void setSyllabusFileName(String syllabusFileName) { this.syllabusFileName = syllabusFileName; }

    public String getSyllabusFilePath() { return syllabusFilePath; }
    public void setSyllabusFilePath(String syllabusFilePath) { this.syllabusFilePath = syllabusFilePath; }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
package com.lms.entity;


import jakarta.persistence.*;
import java.util.Set;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String courseName;
    
    @Column(length = 1000)
    private String description;
    
    private String duration;
    private String status;
    private String syllabusFileName;

    @ManyToMany
    @JoinTable(
      name = "student_courses", 
      joinColumns = @JoinColumn(name = "course_id"), 
      inverseJoinColumns = @JoinColumn(name = "student_id"))
    @JsonIgnoreProperties("courses") // Prevents infinite recursion in JSON
    private Set<User> students;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSyllabusFileName() { return syllabusFileName; }
    public void setSyllabusFileName(String syllabusFileName) { this.syllabusFileName = syllabusFileName; }
    public Set<User> getStudents() { return students; }
    public void setStudents(Set<User> students) { this.students = students; }
}
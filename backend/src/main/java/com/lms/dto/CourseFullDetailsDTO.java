package com.lms.dto;

import java.util.List;

public class CourseFullDetailsDTO {

    private Long id;
    private String courseName;
    private String duration;
    private String description;
    private String courseCode;
    private String category;
    private List<BatchDetailsDTO> batches;

    public CourseFullDetailsDTO(Long id,
                                String courseName,
                                String duration,
                                String description,
                                String courseCode,
                                String category,
                                List<BatchDetailsDTO> batches) {
        this.id = id;
        this.courseName = courseName;
        this.duration = duration;
        this.description = description;
        this.courseCode = courseCode;
        this.category = category;
        this.batches = batches;
    }

    public Long getId() { return id; }
    public String getCourseName() { return courseName; }
    public String getDuration() { return duration; }
    public String getDescription() { return description; }
    public String getCourseCode() { return courseCode; }
    public String getCategory() { return category; }
    public List<BatchDetailsDTO> getBatches() { return batches; }
}


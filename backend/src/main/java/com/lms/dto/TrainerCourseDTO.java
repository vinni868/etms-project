package com.lms.dto;

public class TrainerCourseDTO {

    private Integer courseId;
    private String courseName;
    private String duration;
    private Integer totalBatches;

    public TrainerCourseDTO(Integer courseId, String courseName, String duration, Integer totalBatches) {
        this.courseId = courseId;
        this.courseName = courseName;
        this.duration = duration;
        this.totalBatches = totalBatches;
    }

    public Integer getCourseId() { return courseId; }
    public String getCourseName() { return courseName; }
    public String getDuration() { return duration; }
    public Integer getTotalBatches() { return totalBatches; }
}
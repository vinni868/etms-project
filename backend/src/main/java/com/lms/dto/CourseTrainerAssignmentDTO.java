package com.lms.dto;

import java.util.List;

public class CourseTrainerAssignmentDTO {

    private Integer courseId;
    private String courseName;
    private List<TrainerDTO> trainers;

    public CourseTrainerAssignmentDTO(Integer courseId, String courseName, List<TrainerDTO> trainers) {
        this.courseId = courseId;
        this.courseName = courseName;
        this.trainers = trainers;
    }

    public Integer getCourseId() {
        return courseId;
    }

    public String getCourseName() {
        return courseName;
    }

    public List<TrainerDTO> getTrainers() {
        return trainers;
    }
}
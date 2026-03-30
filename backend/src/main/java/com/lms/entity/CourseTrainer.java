package com.lms.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "course_trainer")
public class CourseTrainer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private CourseMaster course;

    @ManyToOne
    @JoinColumn(name = "trainer_id")
    private User trainer;

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public CourseMaster getCourse() {
        return course;
    }

    public void setCourse(CourseMaster course) {
        this.course = course;
    }

    public User getTrainer() {
        return trainer;
    }

    public void setTrainer(User trainer) {
        this.trainer = trainer;
    }
}
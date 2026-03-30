package com.lms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lms.entity.StudentCourse;

public interface StudentCourseRepository extends JpaRepository<StudentCourse, Long> {

    Optional<StudentCourse> findByStudent_IdAndCourse_Id(Long studentId, Long courseId);

    List<StudentCourse> findByStudent_Id(Long studentId);

}
package com.lms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.lms.entity.CourseTrainer;
import com.lms.entity.User;

@Repository
public interface CourseTrainerRepository extends JpaRepository<CourseTrainer, Long> {

    // ✅ Get all trainers for a course
    @Query("SELECT ct.trainer FROM CourseTrainer ct WHERE ct.course.id = :courseId")
    List<User> findTrainersByCourseId(Long courseId);

    // ✅ Check if assignment already exists
    boolean existsByCourse_IdAndTrainer_Id(Long courseId, Long trainerId);

    // ✅ Get assignments by course
    List<CourseTrainer> findByCourse_Id(Long courseId);

    // ✅ Delete assignment (FIXED)
    @Modifying
    @Transactional
    void deleteByCourse_IdAndTrainer_Id(Long courseId, Long trainerId);
}
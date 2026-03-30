package com.lms.service;

import java.util.List;

import com.lms.dto.TrainerBatchDTO;
import com.lms.dto.TrainerCourseDTO;
import com.lms.dto.TrainerProfileDTO;
import com.lms.dto.TrainerStudentDTO;

public interface TrainerService {

    // ================= PROFILE =================
    TrainerProfileDTO getProfile(String email);

    void updateProfile(String email, TrainerProfileDTO dto);

    // ================= COURSES =================
    List<TrainerCourseDTO> getTrainerCourses(Integer trainerId);

    // ================= BATCHES =================
    List<TrainerBatchDTO> getBatchesByCourse(Integer trainerId, Integer courseId);

    // ================= STUDENTS =================
    List<TrainerStudentDTO> getStudentsByBatch(Integer batchId);

    List<TrainerStudentDTO> getAllStudentsUnderTrainer(Integer trainerId);
}
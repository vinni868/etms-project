package com.lms.repository;

import com.lms.entity.StudentBatches;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentBatchesRepository extends JpaRepository<StudentBatches, Long> {

    // Find by student and batch
    Optional<StudentBatches> findByStudent_IdAndBatch_Id(Long studentId, Long batchId);

    // Delete by student and batch
    void deleteByStudent_IdAndBatch_Id(Long studentId, Long batchId);

    // Find all batches for a student
    List<StudentBatches> findByStudent_Id(Long studentId);

    // Find first batch for a student (for update logic)
    Optional<StudentBatches> findFirstByStudent_Id(Long studentId);

    // Find all students for a batch
    List<StudentBatches> findByBatch_Id(Long batchId);

    // Find ongoing batches for a student
    List<StudentBatches> findByStudent_IdAndBatch_Status(Long studentId, String status);
    
}
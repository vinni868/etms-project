package com.lms.repository;

import com.lms.entity.TaskAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, Long> {
    List<TaskAssignment> findByStudent_Id(Long studentId);
    List<TaskAssignment> findByTask_Id(Long taskId);
    Optional<TaskAssignment> findByTask_IdAndStudent_Id(Long taskId, Long studentId);
    
    // For Student Materials Board
    List<TaskAssignment> findByStudent_IdAndTask_BatchId(Long studentId, Long batchId);
}

package com.lms.repository;

import com.lms.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByBatchId(Long batchId);
    List<Task> findByTrainerId(Long trainerId);
}

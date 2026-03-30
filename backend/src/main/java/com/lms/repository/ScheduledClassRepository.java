package com.lms.repository;

import com.lms.entity.ScheduledClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduledClassRepository extends JpaRepository<ScheduledClass, Long> {

    List<ScheduledClass> findByBatchIdAndClassDate(Long batchId, LocalDate classDate);

    Optional<ScheduledClass> findByBatchIdAndClassDateAndTrainerIdAndStatus(
            Long batchId,
            LocalDate classDate,
            Long trainerId,
            String status
    );

    List<ScheduledClass> findByBatchId(Long batchId);

    List<ScheduledClass> findByBatchIdAndClassDateBetween(Long batchId, LocalDate fromDate, LocalDate toDate);
}
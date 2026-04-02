package com.lms.repository;

import com.lms.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<LeaveRequest> findByStatusOrderByCreatedAtDesc(String status);
    List<LeaveRequest> findByBatchIdAndStatusOrderByCreatedAtDesc(Long batchId, String status);
    List<LeaveRequest> findAllByOrderByCreatedAtDesc();
    List<LeaveRequest> findByFromDateLessThanEqualAndToDateGreaterThanEqual(java.time.LocalDate date1, java.time.LocalDate date2);
    long countByStatus(String status);
}

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
    long countByStatus(String status);
}

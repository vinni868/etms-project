package com.lms.repository;

import com.lms.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByAssignedToOrderByCreatedAtDesc(Long assignedTo);
    List<Lead> findByStatusOrderByCreatedAtDesc(String status);
    List<Lead> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
    long countByAssignedTo(Long assignedTo);
}

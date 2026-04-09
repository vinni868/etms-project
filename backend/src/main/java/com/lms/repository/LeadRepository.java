package com.lms.repository;

import com.lms.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    // Marketer: leads they created
    List<Lead> findByAssignedToOrderByCreatedAtDesc(Long assignedTo);

    // Counselor: leads assigned to them for conversion
    List<Lead> findByAssignedCounselorIdOrderByCreatedAtDesc(Long counselorId);
    List<Lead> findByAssignedCounselorIdAndNextFollowupDate(Long counselorId, LocalDate date);
    List<Lead> findByAssignedCounselorIdAndStatus(Long counselorId, String status);
    long countByAssignedCounselorId(Long counselorId);
    long countByAssignedCounselorIdAndStatus(Long counselorId, String status);

    // Admin / general
    List<Lead> findByStatusOrderByCreatedAtDesc(String status);
    List<Lead> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
    long countByAssignedTo(Long assignedTo);

    // Campaign
    List<Lead> findByCampaignIdOrderByCreatedAtDesc(Long campaignId);
    long countByCampaignId(Long campaignId);

    // Stats
    @Query("SELECT l.source, COUNT(l) FROM Lead l GROUP BY l.source")
    List<Object[]> countBySource();

    @Query("SELECT l.status, COUNT(l) FROM Lead l WHERE l.assignedCounselorId = :counselorId GROUP BY l.status")
    List<Object[]> countByStatusForCounselor(Long counselorId);
}

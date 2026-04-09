package com.lms.repository;

import com.lms.entity.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    List<Campaign> findByCreatedByOrderByCreatedAtDesc(Long createdBy);
    List<Campaign> findByStatusOrderByCreatedAtDesc(String status);
    List<Campaign> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
}

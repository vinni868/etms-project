package com.lms.repository;

import com.lms.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findAllByOrderByCreatedAtDesc();
    List<Announcement> findByBatchIdOrderByCreatedAtDesc(Long batchId);

    @Query("SELECT a FROM Announcement a WHERE (a.expiresAt IS NULL OR a.expiresAt > CURRENT_TIMESTAMP) ORDER BY a.createdAt DESC")
    List<Announcement> findActiveAnnouncements();
}

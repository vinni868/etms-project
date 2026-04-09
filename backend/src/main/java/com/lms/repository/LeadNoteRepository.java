package com.lms.repository;

import com.lms.entity.LeadNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LeadNoteRepository extends JpaRepository<LeadNote, Long> {
    List<LeadNote> findByLeadIdOrderByCreatedAtDesc(Long leadId);
    long countByCounselorIdAndCreatedAtAfter(Long counselorId, java.time.LocalDateTime after);
}

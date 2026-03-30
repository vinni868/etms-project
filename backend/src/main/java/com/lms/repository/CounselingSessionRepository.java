package com.lms.repository;

import com.lms.entity.CounselingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CounselingSessionRepository extends JpaRepository<CounselingSession, Long> {
    List<CounselingSession> findByCounselorIdOrderByScheduledAtAsc(Long counselorId);
    List<CounselingSession> findByStudentIdOrderByScheduledAtDesc(Long studentId);
    List<CounselingSession> findAllByOrderByScheduledAtDesc();
    long countByStatus(String status);
    long countByCounselorIdAndStatus(Long counselorId, String status);
}

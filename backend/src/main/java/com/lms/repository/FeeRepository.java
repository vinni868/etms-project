package com.lms.repository;

import com.lms.entity.Fee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface FeeRepository extends JpaRepository<Fee, Long> {
    List<Fee> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<Fee> findByBatchIdOrderByCreatedAtDesc(Long batchId);
    List<Fee> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT SUM(f.paidAmount) FROM Fee f WHERE f.status IN ('PAID','PARTIAL')")
    BigDecimal getTotalCollected();

    @Query("SELECT SUM(f.dueAmount) FROM Fee f WHERE f.status IN ('PENDING','PARTIAL','OVERDUE')")
    BigDecimal getTotalPending();
}

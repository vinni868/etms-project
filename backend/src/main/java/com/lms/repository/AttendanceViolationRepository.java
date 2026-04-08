package com.lms.repository;

import com.lms.entity.AttendanceViolation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceViolationRepository extends JpaRepository<AttendanceViolation, Long> {

    List<AttendanceViolation> findByViolationDateBetweenOrderByViolationDateDesc(LocalDate start, LocalDate end);

    List<AttendanceViolation> findByUserIdAndViolationDate(Long userId, LocalDate date);

    // Prevent duplicate violations for same user+date+type
    @Query("SELECT COUNT(v) FROM AttendanceViolation v WHERE v.userId = :userId AND v.violationDate = :date AND v.violationType = :type")
    long countByUserIdAndViolationDateAndType(
            @Param("userId") Long userId,
            @Param("date") LocalDate date,
            @Param("type") String type
    );
}

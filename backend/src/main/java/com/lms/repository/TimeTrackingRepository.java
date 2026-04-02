package com.lms.repository;

import com.lms.entity.TimeTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TimeTrackingRepository extends JpaRepository<TimeTracking, Long> {

    // All sessions for a user on a specific date, newest first
    List<TimeTracking> findByUserIdAndDateOrderByLoginTimeDesc(Long userId, LocalDate date);

    // All sessions for a user, newest first
    List<TimeTracking> findByUserIdOrderByLoginTimeDesc(Long userId);

    // Find the latest open session (no logout) for today
    @Query("SELECT t FROM TimeTracking t WHERE t.userId = :userId AND t.date = :date AND t.logoutTime IS NULL ORDER BY t.loginTime DESC")
    List<TimeTracking> findOpenSessionsForToday(@Param("userId") Long userId, @Param("date") LocalDate date);

    // All sessions for all users, newest first
    List<TimeTracking> findByOrderByLoginTimeDesc();

    // All open sessions (no logout) for a specific date — used by midnight scheduler
    @Query("SELECT t FROM TimeTracking t WHERE t.date = :date AND t.logoutTime IS NULL")
    List<TimeTracking> findAllOpenSessionsForDate(@Param("date") LocalDate date);
}

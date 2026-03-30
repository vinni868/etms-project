package com.lms.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.lms.entity.TrainerMarkedAttendance;
import com.lms.dto.AttendanceHistoryDTO;

@Repository
public interface AttendanceRepository extends JpaRepository<TrainerMarkedAttendance, Integer> {

    // Attendance history with student name and formatted ID
    @Query(value = "SELECT DISTINCT " +
                   "  a.attendance_date AS attendanceDate, " +
                   "  u.name AS studentName, " +
                   "  u.portal_id AS formattedId, " +
                   "  u.id AS studentId, " +
                   "  a.topic AS topic, " +
                   "  a.status AS status, " +
                   "  a.late_minutes AS lateMinutes " +
                   "FROM trainer_marked_attendance a " +
                   "JOIN users u ON a.student_id = u.id " +
                   "WHERE a.batch_id = :batchId " +
                   "AND a.attendance_date BETWEEN :fromDate AND :toDate " +
                   "ORDER BY a.attendance_date DESC", 
           nativeQuery = true)
    List<AttendanceHistoryDTO> findAttendanceHistory(
            @Param("batchId") Integer batchId, 
            @Param("fromDate") LocalDate fromDate, 
            @Param("toDate") LocalDate toDate
    );

    // Existing attendance for marking, with Latest Approved leave/online priority and late minutes
    @Query(value = "SELECT DISTINCT " +
                   "  sb.student_id AS studentId, " +
                   "  u.name AS studentName, " +
                   "  u.email AS studentEmail, " +
                   "  u.portal_id AS formattedId, " +
                   "  a.id AS id, " +
                   "  a.late_minutes AS lateMinutes, " +
                   "  COALESCE(a.status, " +
                   "    (SELECT lr.request_type FROM leave_requests lr " +
                   "     WHERE lr.user_id = u.id AND lr.status = 'APPROVED' " +
                   "     AND :date BETWEEN lr.from_date AND lr.to_date " +
                   "     ORDER BY lr.id DESC LIMIT 1), " +
                   "    'UNMARKED') AS status, " +
                   "  a.topic AS topic, " +
                   "  a.created_at AS createdAt, " +
                   "  CASE " +
                   "    WHEN (a.approved_online = 1 OR " +
                   "      (SELECT lr.request_type FROM leave_requests lr " +
                   "       WHERE lr.user_id = u.id AND lr.status = 'APPROVED' " +
                   "       AND :date BETWEEN lr.from_date AND lr.to_date " +
                   "       ORDER BY lr.id DESC LIMIT 1) = 'ONLINE') THEN 1 " +
                   "    ELSE 0 " +
                   "  END AS approvedOnline, " +
                   "  COALESCE((SELECT sc.course_mode FROM student_course sc WHERE sc.student_id = u.id ORDER BY sc.id DESC LIMIT 1), 'OFFLINE') AS courseMode " +
                   "FROM student_batches sb " +
                   "JOIN users u ON sb.student_id = u.id " +
                   "LEFT JOIN trainer_marked_attendance a ON u.id = a.student_id " +
                   "  AND a.batch_id = sb.batch_id AND a.attendance_date = :date " +
                   "WHERE sb.batch_id = :batchId AND sb.status = 'ACTIVE'", 
           nativeQuery = true)
    List<Map<String, Object>> findExistingAttendanceWithDetails(
            @Param("batchId") Integer batchId, 
            @Param("date") LocalDate date
    );

    List<TrainerMarkedAttendance> findByStudentId(Integer studentId);
    
    boolean existsByStudentIdAndBatchIdAndAttendanceDate(Integer studentId, Integer batchId, LocalDate date);
    List<TrainerMarkedAttendance> findByStudentIdAndBatchId(Integer studentId, Integer batchId);
    List<TrainerMarkedAttendance> findByBatchId(Integer batchId);
    List<TrainerMarkedAttendance> findByBatchIdAndAttendanceDate(Integer batchId, LocalDate date);
    List<TrainerMarkedAttendance> findByBatchIdAndAttendanceDateBetween(Integer batchId, LocalDate fromDate, LocalDate toDate);
    
}
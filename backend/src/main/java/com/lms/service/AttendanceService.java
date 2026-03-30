package com.lms.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.lms.dto.AttendanceHistoryDTO;
import com.lms.entity.TrainerMarkedAttendance;

public interface AttendanceService {
    
    /**
     * Saves or Updates a list of attendance records to the database.
     * If an ID is present in the object, JPA will perform an UPDATE.
     * If the ID is null, JPA will perform an INSERT.
     */
    void saveBulkAttendance(List<TrainerMarkedAttendance> attendanceList);

    /**
     * Retrieves historical attendance records for a specific batch and date range.
     * Used primarily by Trainers/Admins for reporting.
     */
    List<AttendanceHistoryDTO> getAttendanceHistory(Integer batchId, LocalDate from, LocalDate to);

    /**
     * Checks if attendance has already been marked for a specific batch and date.
     * Returns a Map containing student details (Name, Email) from the users table.
     * Used to populate the 'Edit' mode in the trainer frontend.
     */
    List<Map<String, Object>> getExistingAttendance(Integer batchId, LocalDate date);

    /**
     * Retrieves all attendance records for a specific student across all batches.
     * Used by the Student Dashboard to show personal attendance history.
     */
    List<TrainerMarkedAttendance> getAttendanceByStudentId(Integer studentId);
    
    List<TrainerMarkedAttendance> getAttendanceByStudentAndBatch(
            Integer studentId,
            Integer batchId
    );
    
}
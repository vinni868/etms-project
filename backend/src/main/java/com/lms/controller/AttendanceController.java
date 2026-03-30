package com.lms.controller;

import com.lms.dto.AttendanceHistoryDTO;
import com.lms.entity.TrainerMarkedAttendance;
import com.lms.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    /**
     * Handles bulk saving and updating.
     * If records in the list have an 'id', JPA updates them; otherwise, it inserts.
     */
    @PostMapping("/bulk")
    public ResponseEntity<?> markAttendance(@RequestBody List<TrainerMarkedAttendance> attendanceList) {
        try {
            attendanceService.saveBulkAttendance(attendanceList);
            return ResponseEntity.ok("Attendance processed successfully!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Save failed: " + e.getMessage());
        }
    }

    /**
     * FIXED: Changed return type to List<Map<String, Object>>
     * This ensures the frontend receives 'studentName' and 'studentEmail' 
     * fetched from the SQL JOIN in the repository.
  */
    @GetMapping("/check")
    public ResponseEntity<List<Map<String, Object>>> checkAttendance(
            @RequestParam Integer batchId, 
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            List<Map<String, Object>> existing = attendanceService.getExistingAttendance(batchId, date);
            return ResponseEntity.ok(existing);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    
    @GetMapping("/history/{batchId}")
    public ResponseEntity<List<AttendanceHistoryDTO>> getHistory(
            @PathVariable Integer batchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        try {
            List<AttendanceHistoryDTO> history = attendanceService.getAttendanceHistory(batchId, from, to);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
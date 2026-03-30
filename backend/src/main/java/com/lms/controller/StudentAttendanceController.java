package com.lms.controller;

import com.lms.entity.TrainerMarkedAttendance;
import com.lms.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student/attendance")
public class StudentAttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    // FETCH ATTENDANCE BY STUDENT + BATCH
    @GetMapping("/{studentId}/{batchId}")
    public ResponseEntity<?> getStudentAttendance(
            @PathVariable Integer studentId,
            @PathVariable Integer batchId) {

        try {

            List<TrainerMarkedAttendance> records =
                    attendanceService.getAttendanceByStudentAndBatch(studentId, batchId);

            return ResponseEntity.ok(records);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("Error: " + e.getMessage());
        }
    }

    // SUMMARY BY STUDENT + BATCH
    @GetMapping("/summary/{studentId}/{batchId}")
    public ResponseEntity<?> getAttendanceSummary(
            @PathVariable Integer studentId,
            @PathVariable Integer batchId) {

        try {

            List<TrainerMarkedAttendance> records =
                    attendanceService.getAttendanceByStudentAndBatch(studentId, batchId);

            long total = records.size();

            long present = records.stream()
                    .filter(r -> "PRESENT".equalsIgnoreCase(r.getStatus()))
                    .count();

            long absent = records.stream()
                    .filter(r -> "ABSENT".equalsIgnoreCase(r.getStatus()))
                    .count();

            double percentage =
                    total > 0 ? ((double) present / total) * 100 : 0.0;

            return ResponseEntity.ok(Map.of(
                    "totalClasses", total,
                    "presentCount", present,
                    "absentCount", absent,
                    "attendancePercentage",
                    Math.round(percentage * 10.0) / 10.0
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
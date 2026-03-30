package com.lms.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import com.lms.dto.TrainerBatchDTO;
import com.lms.dto.TrainerCourseDTO;
import com.lms.dto.TrainerProfileDTO;
import com.lms.dto.TrainerStudentDTO;

import com.lms.service.TrainerService;

@RestController
@RequestMapping("/api/teacher")

public class TrainerController {

    @Autowired
    private TrainerService trainerService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // =====================================================
    // TRAINER PROFILE
    // =====================================================
    @GetMapping("/profile/{email}")
    public TrainerProfileDTO getProfile(@PathVariable String email) {
        return trainerService.getProfile(email);
    }

    @PutMapping("/profile/{email}")
    public String updateProfile(@PathVariable String email,
                                @RequestBody TrainerProfileDTO dto) {
        trainerService.updateProfile(email, dto);
        return "Profile Updated Successfully";
    }

    // =======================
    // TRAINER COURSES
    // =======================
    @GetMapping("/courses/{trainerId}")
    public List<TrainerCourseDTO> getCourses(@PathVariable Integer trainerId) {
        return trainerService.getTrainerCourses(trainerId);
    }

    @GetMapping("/courses/{trainerId}/{courseId}/batches")
    public List<TrainerBatchDTO> getBatches(
            @PathVariable Integer trainerId,
            @PathVariable Integer courseId) {
        return trainerService.getBatchesByCourse(trainerId, courseId);
    }

    @GetMapping("/batches/{batchId}/students")
    public List<TrainerStudentDTO> getStudents(@PathVariable Integer batchId) {
        return trainerService.getStudentsByBatch(batchId);
    }

    @GetMapping("/students/{trainerId}")
    public List<TrainerStudentDTO> getAllStudents(@PathVariable Integer trainerId) {
        return trainerService.getAllStudentsUnderTrainer(trainerId);
    }

    // =========================
    // DASHBOARD STATS
    // =========================
    @GetMapping("/dashboard/{trainerId}")
    public Map<String, Object> getDashboard(@PathVariable int trainerId) {
        Map<String, Object> data = new HashMap<>();

        Integer totalCourses = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM batches WHERE trainer_id = ?",
                Integer.class, trainerId);

        Integer totalBatches = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM batches WHERE trainer_id = ?",
                Integer.class, trainerId);

        Integer totalStudents = jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT sb.student_id) " +
                        "FROM student_batches sb " +
                        "JOIN batches b ON sb.batch_id = b.id " +
                        "WHERE b.trainer_id = ? AND sb.status = 'ACTIVE'",
                Integer.class, trainerId);

        Integer todayClasses = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM scheduled_classes " +
                        "WHERE trainer_id = ? " +
                        "AND status = 'ACTIVE' " +
                        "AND CURDATE() BETWEEN class_date AND end_date",
                Integer.class, trainerId);

        data.put("totalCourses", totalCourses);
        data.put("totalBatches", totalBatches);
        data.put("totalStudents", totalStudents);
        data.put("todayClasses", todayClasses);

        return data;
    }

    // =========================
    // TRAINER SCHEDULE
    // =========================
    @GetMapping("/schedule/{trainerId}")
    public Map<String, Object> getSchedule(
            @PathVariable int trainerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        int offset = page * size;

        List<Map<String, Object>> data = jdbcTemplate.queryForList(
                "SELECT sc.id, " +
                        "DATE_ADD(sc.class_date, INTERVAL seq.n DAY) AS class_date, " +
                        "sc.start_time, sc.end_time, " +
                        "b.batch_name " +
                        "FROM scheduled_classes sc " +
                        "JOIN ( " +
                        " SELECT a.N + b.N * 10 + c.N * 100 AS n " +
                        " FROM (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a " +
                        " CROSS JOIN (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b " +
                        " CROSS JOIN (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) c " +
                        ") seq " +
                        "JOIN batches b ON sc.batch_id = b.id " +
                        "WHERE sc.trainer_id = ? " +
                        "AND sc.status = 'ACTIVE' " +
                        "AND DATE_ADD(sc.class_date, INTERVAL seq.n DAY) <= sc.end_date " +
                        "AND DATE_ADD(sc.class_date, INTERVAL seq.n DAY) >= CURDATE() " +
                        "ORDER BY class_date ASC, sc.start_time ASC " +
                        "LIMIT ? OFFSET ?",
                trainerId, size, offset
        );

        Integer total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM ( " +
                        "SELECT DATE_ADD(sc.class_date, INTERVAL seq.n DAY) AS class_date " +
                        "FROM scheduled_classes sc " +
                        "JOIN ( " +
                        " SELECT a.N + b.N * 10 + c.N * 100 AS n " +
                        " FROM (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a " +
                        " CROSS JOIN (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b " +
                        " CROSS JOIN (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) c " +
                        ") seq " +
                        "WHERE sc.trainer_id = ? " +
                        "AND sc.status = 'ACTIVE' " +
                        "AND DATE_ADD(sc.class_date, INTERVAL seq.n DAY) <= sc.end_date " +
                        "AND DATE_ADD(sc.class_date, INTERVAL seq.n DAY) >= CURDATE() " +
                        ") x",
                Integer.class,
                trainerId
        );

        Map<String, Object> response = new HashMap<>();
        response.put("content", data);
        response.put("total", total);
        response.put("page", page);
        response.put("size", size);

        return response;
    }

    // =========================
    // ACTIVE BATCHES (fixed: include meeting_link)
    // =========================
    @GetMapping("/active-batches/{trainerId}")
    public List<Map<String, Object>> getActiveBatches(@PathVariable int trainerId) {

        return jdbcTemplate.queryForList(
            "SELECT id AS batchId, batch_name AS batchName, meeting_link AS meetingLink " +
            "FROM batches " +
            "WHERE trainer_id = ? " +
            "AND status = 'ONGOING' " +
            "ORDER BY batch_name",
            trainerId
        );
    }
}
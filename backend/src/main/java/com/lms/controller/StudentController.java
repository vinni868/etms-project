package com.lms.controller;

import java.time.LocalDate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import com.lms.entity.*;
import com.lms.repository.*;



@RestController
@RequestMapping("/api/student")
public class StudentController {

    @Autowired
    private StudentBatchesRepository studentBatchRepository;

    @Autowired
    private StudentCourseRepository studentCourseRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CertificateRepository certificateRepository;

    // ----------------- COMMON METHOD -----------------
    private Long getLoggedInStudentId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof UserDetails) {
            String email = ((UserDetails) principal).getUsername();
            System.out.println("AUTH USER: " + SecurityContextHolder.getContext().getAuthentication());

            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"))
                    .getId();
        }

        throw new RuntimeException("User not authenticated");
    }
    // ----------------- STUDENT ATTENDANCE -----------------
    @GetMapping("/attendance/details/{studentId}")
    public ResponseEntity<?> getStudentAttendance(
            @PathVariable Long studentId,
            @RequestParam Long batchId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        try {
            String sql = "SELECT id, student_id, batch_id, attendance_date, status, topic " +
                         "FROM trainer_marked_attendance " +
                         "WHERE student_id = ? AND batch_id = ?";
            List<Object> params = new ArrayList<>();
            params.add(studentId);
            params.add(batchId);
            if (from != null && !from.isEmpty()) {
                sql += " AND attendance_date >= ?";
                params.add(java.sql.Date.valueOf(from));
            }
            if (to != null && !to.isEmpty()) {
                sql += " AND attendance_date <= ?";
                params.add(java.sql.Date.valueOf(to));
            }
            sql += " ORDER BY attendance_date DESC";
            List<Map<String, Object>> records = jdbcTemplate.queryForList(sql, params.toArray());
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ----------------- DOWNLOAD ATTENDANCE CSV -----------------
    @GetMapping("/attendance/download/{studentId}")
    public ResponseEntity<?> downloadAttendanceReport(
            @PathVariable Long studentId,
            @RequestParam Long batchId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        try {
            String sql = "SELECT attendance_date, topic, status FROM trainer_marked_attendance " +
                         "WHERE student_id = ? AND batch_id = ?";
            List<Object> params = new ArrayList<>();
            params.add(studentId);
            params.add(batchId);
            if (from != null && !from.isEmpty()) {
                sql += " AND attendance_date >= ?";
                params.add(java.sql.Date.valueOf(from));
            }
            if (to != null && !to.isEmpty()) {
                sql += " AND attendance_date <= ?";
                params.add(java.sql.Date.valueOf(to));
            }
            sql += " ORDER BY attendance_date DESC";
            List<Map<String, Object>> records = jdbcTemplate.queryForList(sql, params.toArray());
            StringBuilder csv = new StringBuilder();
            csv.append("Date,Topic,Status\n");
            for (Map<String, Object> r : records) {
                csv.append(r.get("attendance_date")).append(",");
                csv.append(r.get("topic") != null ? r.get("topic") : "").append(",");
                csv.append(r.get("status")).append("\n");
            }
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"attendance.csv\"")
                    .body(csv.toString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ----------------- STUDENT DASHBOARD -----------------
    @GetMapping("/dashboard")
    public ResponseEntity<?> getStudentDashboard() {
        try {
            Long studentId = getLoggedInStudentId();
            Map<String, Object> dashboard = new HashMap<>();
            int totalCourses = (int) studentCourseRepository.findAll()
                    .stream()
                    .filter(sc -> sc.getStudent().getId().equals(studentId))
                    .count();
            dashboard.put("totalCourses", totalCourses);
            String presentLeaveSql =
                    "SELECT COUNT(*) FROM trainer_marked_attendance " +
                    "WHERE student_id = ? AND UPPER(status) IN ('PRESENT', 'LEAVE')";
            Integer presentLeaveCount =
                    jdbcTemplate.queryForObject(presentLeaveSql, Integer.class, studentId);

            	if (presentLeaveCount == null) presentLeaveCount = 0;
            String totalSql =
                    "SELECT COUNT(*) FROM trainer_marked_attendance WHERE student_id = ?";
            Integer totalClasses =
                    jdbcTemplate.queryForObject(totalSql, Integer.class, studentId);
            if (totalClasses == null) totalClasses = 0;
            int attendancePercent = 0;
            if (totalClasses != null && totalClasses > 0) {
                attendancePercent = (presentLeaveCount * 100) / totalClasses;
            }
            dashboard.put("attendance", attendancePercent);
            dashboard.put("pendingAssignments", 0);
            dashboard.put("progress", attendancePercent);
            
            User user = userRepository.findById(studentId)
                    .orElse(null);
            if (user != null) {
                dashboard.put("studentId", user.getStudentId());
            }

            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ----------------- MY COURSES -----------------
    @GetMapping("/my-courses")
    public ResponseEntity<?> getMyCourses( ) {
        try {
            Long studentId = getLoggedInStudentId();
            List<Map<String, Object>> courseList =
                    studentCourseRepository.findByStudent_Id(studentId)
                    .stream()
                    .map(sc -> {
                        Map<String, Object> map = new HashMap<>();
                        CourseMaster course = sc.getCourse();
                        map.put("id", course.getId());
                        map.put("courseName", course.getCourseName());
                        map.put("description", course.getDescription());
                        map.put("duration", course.getDuration());
                        map.put("syllabusFileName", course.getSyllabusFileName());
                        map.put("courseMode", sc.getCourseMode());
                        return map;
                    }).collect(Collectors.toList());
            return ResponseEntity.ok(courseList);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    // ----------------- DOWNLOAD SYLLABUS -----------------
    @GetMapping("/courses/download/{courseId}")
    public ResponseEntity<?> downloadSyllabus(@PathVariable Long courseId, @RequestParam(defaultValue = "download") String mode) {
        try {
            String sql =
                "SELECT syllabus_file_name, syllabus_file_path " +
                "FROM course_master WHERE id = ?";
            Map<String, Object> fileData = jdbcTemplate.queryForMap(sql, courseId);
            String fileName = (String) fileData.get("syllabus_file_name");
            String filePath = (String) fileData.get("syllabus_file_path");

            if (filePath == null || filePath.isEmpty()) {
                return ResponseEntity.status(404).body("Syllabus not found");
            }

            // Cloudinary URL Redirect
            if (filePath.startsWith("http")) {
                return ResponseEntity.status(302)
                        .header("Location", filePath)
                        .build();
            }

            // Legacy Local File Check
            java.io.File file = new java.io.File(filePath);
            if (!file.exists()) {
                return ResponseEntity.status(404).body("File not found on server. Please contact admin.");
            }

            org.springframework.core.io.Resource resource =
                    new org.springframework.core.io.FileSystemResource(file);

            String contentDisposition = mode.equalsIgnoreCase("view") ? "inline" : "attachment; filename=\"" + fileName + "\"";

            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", contentDisposition)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to download syllabus: " + e.getMessage());
        }
    }

    // ----------------- MY BATCHES -----------------
    @GetMapping("/my-batches")
    public ResponseEntity<?> getMyBatches( ) {
        try {
            Long studentId = getLoggedInStudentId();
            List<Map<String, Object>> batches = studentBatchRepository
                .findByStudent_IdAndBatch_Status(studentId, "ONGOING")
                .stream()
                .map(sb -> {
                    Map<String, Object> map = new HashMap<>();
                    Batches batch = sb.getBatch();
                    map.put("batchId", batch.getId());
                    map.put("batchName", batch.getBatchName());
                    map.put("meetingLink", batch.getMeetingLink());
                    return map;
                })
                .collect(Collectors.toList());
            return ResponseEntity.ok(batches);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================================
    // BATCH CLASSES — FIXED
    //
    // PROBLEM (from screenshot):
    //   Old query used: class_date <= TODAY AND end_date >= TODAY
    //   This is WRONG. class_date is the EXACT session date (e.g. 11 Mar, 12 Mar).
    //   end_date is the batch/course period end, NOT the session end.
    //   So sessions from 11 Mar and 12 Mar were matching because their
    //   end_date (e.g. 30 Apr) was still >= today (14 Mar), making them
    //   falsely appear as "Today".
    //
    // FIX:
    //   TODAY    → class_date = TODAY exactly (strict equality)
    //   UPCOMING → class_date > TODAY, ORDER BY class_date ASC LIMIT 1
    //              (only the very next scheduled session)
    // ==========================================================
    @GetMapping("/batch-classes")
    public ResponseEntity<?> getBatchClasses(@RequestParam Long batchId) {
        try {
            LocalDate today = LocalDate.now();
            String todayStr = today.toString(); // e.g. "2026-03-14"

            // ── TODAY: sessions scheduled exactly on today's date ──
            String todaySql =
                "SELECT id, class_date, end_date, start_time, end_time, status " +
                "FROM scheduled_classes " +
                "WHERE batch_id = ? " +
                "  AND status = 'ACTIVE' " +
                "  AND class_date = ? " +          // exact match — not a range
                "ORDER BY start_time ASC";

            List<Map<String, Object>> todayClasses =
                jdbcTemplate.queryForList(todaySql, batchId, todayStr);

            // ── UPCOMING: only the very next session after today ──
            String upcomingSql =
                "SELECT id, class_date, end_date, start_time, end_time, status " +
                "FROM scheduled_classes " +
                "WHERE batch_id = ? " +
                "  AND status = 'ACTIVE' " +
                "  AND class_date > ? " +          // strictly future
                "ORDER BY class_date ASC, start_time ASC " +
                "LIMIT 1";

            List<Map<String, Object>> upcomingClasses =
                jdbcTemplate.queryForList(upcomingSql, batchId, todayStr);

            // ── Merge results with is_today flag ──
            List<Map<String, Object>> result = new ArrayList<>();
            for (Map<String, Object> cls : todayClasses) {
                result.add(normalizeClassRow(cls, true));
            }
            for (Map<String, Object> cls : upcomingClasses) {
                result.add(normalizeClassRow(cls, false));
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Converts java.sql.Date / java.sql.Time objects to plain strings
     * and attaches the is_today flag for the frontend to use directly.
     */
    private Map<String, Object> normalizeClassRow(Map<String, Object> row, boolean isToday) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id",         row.get("id"));
        map.put("class_date", row.get("class_date") != null ? row.get("class_date").toString() : null);
        map.put("end_date",   row.get("end_date")   != null ? row.get("end_date").toString()   : null);
        map.put("start_time", row.get("start_time") != null ? row.get("start_time").toString() : null);
        map.put("end_time",   row.get("end_time")   != null ? row.get("end_time").toString()   : null);
        map.put("status",     row.get("status"));
        map.put("is_today",   isToday);
        return map;
    }
 // ----------------- STUDENT PROFILE -----------------
    @GetMapping("/profile")
    public ResponseEntity<?> getStudentProfile() {
        try {
            Long studentId = getLoggedInStudentId();

            User user = userRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("name", user.getName());
            profile.put("email", user.getEmail());
            profile.put("phone", user.getPhone());
            profile.put("studentId", user.getStudentId());
            profile.put("role", user.getRole().getRoleName());

            return ResponseEntity.ok(profile);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ----------------- STUDENT RESULTS -----------------
    @GetMapping("/results")
    public ResponseEntity<?> getResults() {
        try {
            Long studentId = getLoggedInStudentId();
            // Try assignment_submissions first
            try {
                String sql = 
                    "SELECT a.title, asub.score, asub.total_marks, asub.percentage, asub.submitted_at " +
                    "FROM assignment_submissions asub " +
                    "JOIN assignments a ON asub.assignment_id = a.id " +
                    "WHERE asub.student_id = ? " +
                    "ORDER BY asub.submitted_at DESC";
                return ResponseEntity.ok(jdbcTemplate.queryForList(sql, studentId));
            } catch (Exception e) {
                // Fallback to task_assignments if table missing or empty
                String sql = 
                    "SELECT t.title, ta.status, ta.grade as score, 100 as total_marks, ta.submitted_at " +
                    "FROM task_assignments ta " +
                    "JOIN tasks t ON ta.task_id = t.id " +
                    "WHERE ta.student_id = ? " +
                    "ORDER BY ta.submitted_at DESC";
                return ResponseEntity.ok(jdbcTemplate.queryForList(sql, studentId));
            }
        } catch (Exception e) {
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    // ----------------- STUDENT PERFORMANCE -----------------
    @GetMapping("/performance")
    public ResponseEntity<?> getPerformance() {
        try {
            Long studentId = getLoggedInStudentId();
            Map<String, Object> perf = new HashMap<>();
            
            // Attendance Avg
            String attSql = "SELECT COUNT(*) as total, SUM(CASE WHEN UPPER(status) IN ('PRESENT', 'LEAVE') THEN 1 ELSE 0 END) as present " +
                           "FROM trainer_marked_attendance WHERE student_id = ?";
            Map<String, Object> att = jdbcTemplate.queryForMap(attSql, studentId);
            long totalAtt = ((Number) att.get("total")).longValue();
            long presentAtt = ((Number) att.get("present")).longValue();
            int attendancePct = totalAtt > 0 ? (int)((presentAtt * 100) / totalAtt) : 0;
            perf.put("attendancePercentage", attendancePct);
            
            // Task Completion
            String taskSql = "SELECT COUNT(*) as total, SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed " +
                            "FROM task_assignments WHERE student_id = ?";
            Map<String, Object> task = jdbcTemplate.queryForMap(taskSql, studentId);
            long totalTasks = ((Number) task.get("total")).longValue();
            long completedTasks = ((Number) task.get("completed")).longValue();
            int taskPct = totalTasks > 0 ? (int)((completedTasks * 100) / totalTasks) : 0;
            perf.put("taskCompletionRate", taskPct);
            
            // Overall
            int overall = (attendancePct + taskPct) / 2;
            perf.put("overallProgress", overall);
            
            return ResponseEntity.ok(perf);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("overallProgress", 0));
        }
    }

    // ----------------- STUDENT CERTIFICATE -----------------
    @GetMapping("/certificates")
    public ResponseEntity<?> getMyCertificates() {
        try {
            Long studentId = getLoggedInStudentId();
            System.out.println("DEBUG: Student fetching their certificates: " + studentId);
            List<Certificate> certs = certificateRepository.findByStudent_IdOrderByIssueDateDesc(studentId);
            
            List<Map<String, Object>> response = new java.util.ArrayList<>();
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            for(Certificate c : certs) {
                if (c.getVisibleFrom() != null && c.getVisibleFrom().isAfter(now)) {
                    continue; // Skip certificates not yet visible to the student
                }
                
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", c.getId());
                map.put("courseName", c.getCourseName());
                map.put("fileName", c.getFileName());
                map.put("issueDate", c.getIssueDate() != null ? c.getIssueDate().toString() : "");
                response.add(map);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("ERROR in getMyCertificates: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/certificates/download/{certId}")
    public ResponseEntity<?> downloadCertificate(@PathVariable Long certId, @RequestParam(defaultValue = "view") String mode) {
        try {
            Long studentId = getLoggedInStudentId();
            Certificate cert = certificateRepository.findById(certId).orElseThrow(() -> new RuntimeException("Certificate not found"));

            if (!cert.getStudent().getId().equals(studentId)) {
                return ResponseEntity.status(403).body("Unauthorized access to this certificate");
            }

            String path = cert.getFilePath();
            
            // Cloudinary URL Redirect
            if (path != null && path.startsWith("http")) {
                return ResponseEntity.status(302)
                        .header("Location", path)
                        .build();
            }

            byte[] fileBytes = cert.getFileData();

            // Fallback: legacy local file/data
            if (fileBytes == null || fileBytes.length == 0) {
                if (path != null) {
                    java.io.File file = new java.io.File(path);
                    if (file.exists()) {
                        fileBytes = java.nio.file.Files.readAllBytes(file.toPath());
                    }
                }
                if (fileBytes == null || fileBytes.length == 0) {
                    return ResponseEntity.status(404).body("Certificate file not available. Please contact admin to re-upload.");
                }
            }

            String contentDisposition = mode.equalsIgnoreCase("download")
                    ? "attachment; filename=\"" + cert.getFileName() + "\""
                    : "inline; filename=\"" + cert.getFileName() + "\"";

            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", contentDisposition)
                    .body(fileBytes);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to retrieve certificate: " + e.getMessage());
        }
    }
}
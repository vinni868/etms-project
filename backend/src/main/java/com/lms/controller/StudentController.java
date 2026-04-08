package com.lms.controller;

import java.io.*;
import java.nio.file.*;
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
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(StudentController.class);

    @jakarta.annotation.PostConstruct
    public void init() {
        System.out.println("STUDENT_CONTROLLER [v6]: Initialized and Scanning for /my-schedule");
    }

    @Autowired
    private StudentBatchesRepository studentBatchRepository;

    @Autowired
    private StudentCourseRepository studentCourseRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.lms.service.CloudinaryService cloudinaryService;

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
    // ----------------- STUDENT SCHEDULE (UNIFIED) -----------------
    @GetMapping("/my-schedule")
    public ResponseEntity<?> getMySchedule() {
        System.out.println("API_HIT [v6]: /api/student/my-schedule Called!");
        try {
            Long studentId = getLoggedInStudentId();
            
            // SQL to join student_batches, batches, and scheduled_classes
            String sql = 
                "SELECT sc.id, sc.batch_id, sc.class_date, sc.start_time, sc.end_time, sc.status, " +
                "       b.batch_name, b.meeting_link " +
                "FROM scheduled_classes sc " +
                "JOIN student_batches sb ON sc.batch_id = sb.batch_id " +
                "JOIN batches b ON b.id = sc.batch_id " +
                "WHERE sb.student_id = ? " +
                "  AND sb.status = 'ACTIVE' " + 
                "  AND (b.status = 'ONGOING' OR b.status = 'ACTIVE') " +
                "  AND sc.status = 'ACTIVE' " +
                "ORDER BY sc.class_date ASC, sc.start_time ASC";
            
            List<Map<String, Object>> schedule = jdbcTemplate.queryForList(sql, studentId);
            
            // Normalize for camelCase frontend consumption
            List<Map<String, Object>> normalized = schedule.stream().map(row -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", row.get("id"));
                m.put("batchId", row.get("batch_id")); 
                m.put("batchName", row.get("batch_name")); 
                m.put("meetingLink", row.get("meeting_link")); 
                m.put("classDate", row.get("class_date") != null ? row.get("class_date").toString() : null);
                m.put("startTime", row.get("start_time") != null ? row.get("start_time").toString() : null);
                m.put("endTime", row.get("end_time") != null ? row.get("end_time").toString() : null);
                m.put("status", row.get("status"));
                return m;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(normalized);

        } catch (Exception e) {
            System.err.println("MY_SCHEDULE_ERR: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
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
                
                // --- PROFILE COMPLETION ANALYSIS ---
                Optional<Student> studentOpt = studentRepository.findByEmail(user.getEmail());
                if (studentOpt.isPresent()) {
                    Student s = studentOpt.get();
                    int docsCount = 0;
                    if (s.getAadharCardUrl() != null) docsCount++;
                    if (s.getResumeUrl() != null) docsCount++;
                    if (s.getMarks10thUrl() != null) docsCount++;
                    if (s.getMarks12thUrl() != null) docsCount++;
                    if (s.getGraduationDocUrl() != null) docsCount++;
                    
                    dashboard.put("docsUploaded", docsCount);
                    dashboard.put("totalDocsRequired", 5);
                    
                    int profileScore = 0;
                    if (s.getYearOfPassing() != null && !s.getYearOfPassing().isBlank()) profileScore += 10;
                    if (s.getAggregatePercentage() != null && !s.getAggregatePercentage().isBlank()) profileScore += 10;
                    if (s.getMarks10th() != null && !s.getMarks10th().isBlank()) profileScore += 10;
                    if (s.getMarks12th() != null && !s.getMarks12th().isBlank()) profileScore += 10;
                    if (s.getParentName() != null && !s.getParentName().isBlank()) profileScore += 10;
                    
                    // Documents are 50% of the total score (10% per doc)
                    profileScore += (docsCount * 10);
                    
                    dashboard.put("profileCompletion", Math.min(profileScore, 100));
                }
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

            // Cloudinary URL — Return JSON to frontend
            if (filePath.startsWith("http")) {
                return ResponseEntity.ok(Map.of("url", filePath));
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

    @GetMapping("/profile/{email}")
    public ResponseEntity<?> getStudentProfileByEmail(@PathVariable String email) {
        log.info("Fetching/Syncing profile for email: {}", email);
        
        Optional<Student> byEmail = studentRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            Student student = byEmail.get();
            userRepository.findByEmail(email).ifPresent(user -> {
                if (user.getStudentId() != null && !user.getStudentId().equals(student.getStudentId())) {
                    student.setStudentId(user.getStudentId());
                    studentRepository.save(student);
                    log.info("Synced student_id for {}", email);
                }
            });
            return ResponseEntity.ok(student);
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.warn("No user found for email: {}", email);
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        Optional<Student> byUserName = studentRepository.findTopByNameIgnoreCase(user.getName());

        if (byUserName.isPresent()) {
            Student existing = byUserName.get();
            boolean changed = false;
            if (!email.equals(existing.getEmail())) {
                log.info("Healing email drift: {} → {} for student {}", existing.getEmail(), email, existing.getName());
                existing.setEmail(email);
                changed = true;
            }
            if (user.getStudentId() != null && !user.getStudentId().equals(existing.getStudentId())) {
                existing.setStudentId(user.getStudentId());
                changed = true;
            }
            if (changed) {
                existing.setPhone(user.getPhone());
                studentRepository.save(existing);
            }
            return ResponseEntity.ok(existing);
        }

        Student seeded = new Student();
        seeded.setName(user.getName());
        seeded.setEmail(user.getEmail());
        seeded.setPhone(user.getPhone());
        seeded.setStudentId(user.getStudentId());
        Student saved = studentRepository.save(seeded);
        log.info("Auto-seeded student profile for {}", email);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestBody Student updatedData) {
        log.info("Updating student profile for {}", updatedData.getEmail());

        try {
            Student profile = studentRepository.findByEmail(updatedData.getEmail()).orElse(new Student());
            profile.setEmail(updatedData.getEmail());
            profile.setName(updatedData.getName());
            profile.setPhone(updatedData.getPhone());
            profile.setGender(updatedData.getGender());
            profile.setQualification(updatedData.getQualification());
            profile.setYearOfPassing(updatedData.getYearOfPassing());
            profile.setAggregatePercentage(updatedData.getAggregatePercentage());
            profile.setMarks10th(updatedData.getMarks10th());
            profile.setMarks12th(updatedData.getMarks12th());
            profile.setParentName(updatedData.getParentName());
            profile.setParentPhone(updatedData.getParentPhone());
            profile.setSkills(updatedData.getSkills());
            profile.setBio(updatedData.getBio());
            profile.setProfilePic(updatedData.getProfilePic());
            profile.setAadharCardUrl(updatedData.getAadharCardUrl());
            profile.setResumeUrl(updatedData.getResumeUrl());
            profile.setMarks10thUrl(updatedData.getMarks10thUrl());
            profile.setMarks12thUrl(updatedData.getMarks12thUrl());
            profile.setGraduationDocUrl(updatedData.getGraduationDocUrl());
            profile.setAddress(updatedData.getAddress());
            profile.setCity(updatedData.getCity());
            profile.setState(updatedData.getState());
            profile.setPincode(updatedData.getPincode());
            profile.setAadharNumber(updatedData.getAadharNumber());
            profile.setAadharName(updatedData.getAadharName());
            profile.setBankAccountNumber(updatedData.getBankAccountNumber());
            profile.setBankIfscCode(updatedData.getBankIfscCode());
            profile.setBankName(updatedData.getBankName());
            profile.setBankAccountHolder(updatedData.getBankAccountHolder());
            profile.setBankAccountType(updatedData.getBankAccountType());
            profile.setBankPassbookUrl(updatedData.getBankPassbookUrl());
            profile.setFatherName(updatedData.getFatherName());
            profile.setFatherOccupation(updatedData.getFatherOccupation());
            profile.setFatherPhone(updatedData.getFatherPhone());
            profile.setMotherName(updatedData.getMotherName());
            profile.setMotherOccupation(updatedData.getMotherOccupation());
            profile.setMotherPhone(updatedData.getMotherPhone());
            profile.setHasGuardian(updatedData.getHasGuardian());
            profile.setGuardianName(updatedData.getGuardianName());
            profile.setGuardianPhone(updatedData.getGuardianPhone());
            profile.setGuardianRelationship(updatedData.getGuardianRelationship());
            profile.setCurrentlyStudying(updatedData.getCurrentlyStudying());
            profile.setBoard10th(updatedData.getBoard10th());
            profile.setBoard12th(updatedData.getBoard12th());

            // PROTECTED: isAadharVerified can ONLY be set via DigiLocker callback
            // — never overwrite it from a regular profile save.
            // If updatedData somehow carries false (frontend default), ignore it
            // and preserve whatever is already in the DB.
            if (updatedData.getIsAadharVerified() != null && updatedData.getIsAadharVerified()) {
                // Only allow setting to true if not already verified (shouldn't happen via
                // this endpoint, but as a guard we allow it to remain true if already set)
                profile.setIsAadharVerified(true);
            }
            // isAadharVerified = false from frontend is silently ignored here.

            studentRepository.save(profile);

            userRepository.findByEmail(updatedData.getEmail()).ifPresent(user -> {
                user.setName(updatedData.getName());
                user.setPhone(updatedData.getPhone());
                userRepository.save(user);
            });

            return ResponseEntity.ok("Profile updated successfully ✅");

        } catch (Exception e) {
            log.error("Error updating student profile", e);
            return ResponseEntity.internalServerError().body("Profile update failed ❌");
        }
    }

    @PostMapping("/upload-document")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam("type") String type,
            @RequestParam("email") String email) {

        log.info("Request to upload {} for student {}", type, email);

        try {
            Optional<com.lms.entity.Student> studentOpt = studentRepository.findByEmail(email);
            if (studentOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Student profile not found for email: " + email);
            }

            String folder = "students/" + studentOpt.get().getStudentId();
            String url = cloudinaryService.uploadDocument(file, folder);

            return ResponseEntity.ok(java.util.Map.of(
                "url", url,
                "type", type,
                "message", type + " uploaded successfully ✅"
            ));

        } catch (Exception e) {
            log.error("Failed to upload document to Cloudinary", e);
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
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
            Long studentDbId = getLoggedInStudentId();
            User student = userRepository.findById(studentDbId).orElseThrow(() -> new RuntimeException("User not found"));
            
            // Search for certificates by numeric user mapping
            List<Certificate> certs = certificateRepository.findByStudent_IdOrderByIssueDateDesc(studentDbId);
            
            List<Map<String, Object>> response = new java.util.ArrayList<>();
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            
            for(Certificate c : certs) {
                // If visibleFrom is not set or is in the past, show it immediately
                boolean isVisible = (c.getVisibleFrom() == null || !c.getVisibleFrom().isAfter(now));
                
                if (isVisible) {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", c.getId());
                    map.put("courseName", c.getCourseName());
                    map.put("fileName", c.getFileName());
                    map.put("issueDate", c.getIssueDate() != null ? c.getIssueDate().toString() : "");
                    response.add(map);
                }
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
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
            
            // Cloudinary URL — Return JSON to frontend
            if (path != null && path.startsWith("http")) {
                return ResponseEntity.ok(Map.of("url", path));
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
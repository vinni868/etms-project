package com.lms.controller;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.lms.service.AdminService;
import com.lms.service.UserService;
import com.lms.service.IdGeneratorService;
import com.lms.service.NotificationService;
import com.lms.service.CloudinaryService;

import com.lms.dto.*;
import com.lms.entity.*;
import com.lms.enums.Status;
import com.lms.repository.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
	@Autowired
	private AttendanceRepository attendanceRepository;

	
    @Autowired
    private AdminService adminService;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseTrainerRepository courseTrainerRepository;
    
    @Autowired
    private ScheduledClassRepository scheduledClassRepository;
    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private IdGeneratorService idGeneratorService;

    @Autowired
    private AdminProfileRepository adminProfileRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private CertificateRepository certificateRepository;

    @Autowired
    private StudentCourseRepository studentCourseRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    // ================= DASHBOARD =================
    @GetMapping("/dashboard")
    public DashboardResponse getDashboard() {
        return adminService.getDashboardData();
    }

    @PostMapping("/course")
    public ResponseEntity<?> createCourse(
            @RequestParam("courseName") String courseName,
            @RequestParam("duration") String duration,
            @RequestParam("description") String description,
            @RequestParam(value = "shortcut", required = false) String shortcut,
            @RequestParam(value = "courseCode", required = false) String courseCode,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "file", required = false) MultipartFile file,
            org.springframework.security.core.Authentication auth
    ) {
        System.out.println("COURSE_DEBUG: createCourse request by: " + (auth != null ? auth.getName() : "Anon"));
        try {

            CourseMaster course = new CourseMaster();
            course.setCourseName(courseName);
            course.setDuration(duration);
            course.setDescription(description);
            course.setCourseCode(courseCode);
            course.setCategory(category);
            if (shortcut != null) course.setShortcut(shortcut.toUpperCase());
            course.setStatus("ACTIVE");

            // ===== CLOUDINARY FILE UPLOAD =====
            if (file != null && !file.isEmpty()) {
                String url = cloudinaryService.uploadDocument(file, "syllabus");
                course.setSyllabusFileName(file.getOriginalFilename());
                course.setSyllabusFilePath(url);   // stores Cloudinary CDN URL
            }

            courseRepository.save(course);

            return ResponseEntity.ok("Course Created Successfully");

        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            System.err.println("COURSE_ERR: Integrity violation (duplicate?): " + e.getMessage());
            String msg = e.getMostSpecificCause().getMessage().toLowerCase();
            if (msg.contains("shortcut")) return ResponseEntity.badRequest().body("Error: Shortcut already exists.");
            if (msg.contains("course_code") || msg.contains("course_master.course_code")) return ResponseEntity.badRequest().body("Error: Course Code already exists.");
            return ResponseEntity.badRequest().body("Error: Duplicate entry found.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/courses/{courseId}/syllabus")
    public ResponseEntity<?> getSyllabus(@PathVariable Long courseId, @RequestParam(defaultValue = "download") String mode) {
        try {
            CourseMaster course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Course not found"));

            String filePath = course.getSyllabusFilePath();
            if (filePath == null || filePath.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "No syllabus uploaded for this course."));
            }

            // If stored as Cloudinary URL — return JSON to frontend
            if (filePath.startsWith("http")) {
                return ResponseEntity.ok(Map.of("url", filePath));
            }
            // Fallback: legacy local file (won't exist on Render — return 404)
            return ResponseEntity.status(404).body(Map.of("error", "Syllabus file not available. Please re-upload."));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    @GetMapping("/course-full-details/{courseId}")
    public ResponseEntity<?> getCourseFullDetails(@PathVariable Long courseId) {

        try {

            CourseMaster course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Course not found"));

            Map<String, Object> response = new HashMap<>();

            response.put("id", course.getId());
            response.put("courseName", course.getCourseName());
            response.put("shortcut", course.getShortcut());
            response.put("description", course.getDescription());
            response.put("duration", course.getDuration());
            response.put("syllabusFileName", course.getSyllabusFileName());

            // ✅ FIXED STUDENT DATA
            List<Map<String, Object>> students = adminService.getStudentCourseMappings()
                    .stream()
                    .filter(m -> Long.valueOf(m.get("courseId").toString()).equals(courseId))
                    .map(m -> {

                        Long studentId = Long.valueOf(m.get("studentId").toString());

                        User student = userRepository.findById(studentId).orElse(null);

                        Map<String, Object> map = new HashMap<>();
                        map.put("mappingId", m.get("mappingId"));
                        map.put("studentId", studentId);
                        map.put("studentName", m.get("studentName"));
                        map.put("studentEmail", m.get("studentEmail"));
                        map.put("feePaid", m.get("feePaid"));
                        map.put("feePending", m.get("feePending"));
                        map.put("courseMode", m.get("courseMode"));

                        // ✅ ADD THESE (VERY IMPORTANT)
                        map.put("phone", student != null ? student.getPhone() : "");
                        map.put("status", m.get("studentCourseStatus") != null ? m.get("studentCourseStatus") : "ACTIVE");
                        map.put("formattedId", student != null ? student.getStudentId() : String.valueOf(studentId));

                        return map;

                    })
                    .collect(Collectors.toList());

            response.put("students", students);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping("/courses")
    public List<CourseMaster> getAllCourses() {
        return courseRepository.findAll()
                .stream()
                .filter(course -> "ACTIVE".equals(course.getStatus()))
                .toList();
    }

    // ================= USERS =================
    @GetMapping("/students")
    public List<User> getAllStudents() {
        return userRepository.findByRole_RoleName("STUDENT");
    }

    @GetMapping("/trainers")
    public List<User> getAllActiveTrainers() {
        return userRepository.findByRole_RoleNameAndStatusNot("TRAINER", Status.INACTIVE);
    }

    @GetMapping("/all-users")
    public List<User> getAllUsers() {
        // ✅ ADMINS SHOULD NOT SEE OTHER ADMINS OR SUPERADMINS IN THEIR MANAGEMENT REGISTRY
        return userRepository.findByRole_RoleNameNotIn(java.util.List.of("SUPERADMIN", "ADMIN"));
    }

    @GetMapping("/users/pending")
    public List<User> getPendingUsers() {
        // ✅ ADMINS CAN SEE ALL PENDING (EXCEPT SUPERADMIN) BUT CAN ONLY APPROVE STUDENTS
        return userRepository.findByApprovalStatus(com.lms.enums.ApprovalStatus.PENDING)
                .stream()
                .filter(u -> !"SUPERADMIN".equals(u.getRole().getRoleName()))
                .toList();
    }

    @PatchMapping("/users/approve/{id}")
    public ResponseEntity<?> approveUser(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        
        // ✅ SERVER-SIDE PROTECTION: ADM IS FOR STUDENTS ONLY
        if (!user.getRole().getRoleName().equals("STUDENT")) {
            return ResponseEntity.status(403).body(Map.of("message", "Security Alert: Admin is only authorized to approve Student accounts. Please contact Super Admin for other roles."));
        }

        user.setApprovalStatus(com.lms.enums.ApprovalStatus.APPROVED);
        user.setStatus(Status.ACTIVE);
        
        String generatedId = payload != null ? payload.get("generatedId") : null;
        if (generatedId != null && !generatedId.trim().isEmpty()) {
            user.setPortalId(generatedId.trim());
            user.setStudentId(generatedId.trim());
        } else {
            String roleName = user.getRole().getRoleName();
            user.setPortalId(idGeneratorService.generateId(roleName));
            user.setStudentId(user.getPortalId());
        }
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User approved successfully", "newId", user.getPortalId()));
    }

    @PatchMapping("/users/reject/{id}")
    public ResponseEntity<?> rejectUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        // ✅ ADMINS ONLY REJECT STUDENTS
        if (!"STUDENT".equals(user.getRole().getRoleName())) {
            return ResponseEntity.status(403).body(Map.of("message", "Security Alert: Admin is only authorized to reject Student accounts."));
        }
        user.setApprovalStatus(com.lms.enums.ApprovalStatus.REJECTED);
        user.setStatus(Status.INACTIVE);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User rejected successfully"));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        
        // 🔒 SECURITY GUARD: Admin can ONLY activate/deactivate STUDENTS.
        // Staff lifecycle (Trainer, Marketer, Counselor, Admin) is reserved for Super Admin.
        if (!"STUDENT".equals(user.getRole().getRoleName())) {
            return ResponseEntity.status(403).body(Map.of(
                "message", "Access Denied: Admins are only authorized to manage Student account lifecycles. " +
                           "Staff accounts (Trainers, Counselors, Marketers, Admins) must be managed by a Super Admin."
            ));
        }

        // 🚨 CRITICAL: Prevent Admins from "activating" a PENDING non-student role
        if (user.getApprovalStatus() == com.lms.enums.ApprovalStatus.PENDING 
            && !"STUDENT".equals(user.getRole().getRoleName())) {
            return ResponseEntity.status(403).body(Map.of("message", "Wait for Super Admin approval before activating staff accounts."));
        }
        
        if (user.getStatus() == Status.ACTIVE) {
            user.setStatus(Status.INACTIVE);
            user.setInactivationDate(java.time.LocalDate.now());
        } else {
            user.setStatus(Status.ACTIVE);
            user.setApprovalStatus(com.lms.enums.ApprovalStatus.APPROVED); // 🔥 ALLOW LOGIN ON ACTIVATION
            user.setInactivationDate(null); // Clear date on re-activation
        }
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User status updated successfully", "newStatus", user.getStatus()));
    }


    // ================= BATCH =================
    @PostMapping("/create-batch")
    public ResponseEntity<?> createBatch(@RequestBody Map<String, Object> payload) {

        try {

            Batches batch = new Batches();

            batch.setBatchName(payload.get("batchName").toString());
            batch.setStatus("ONGOING");
            batch.setMeetingLink(payload.get("meetingLink") != null ? payload.get("meetingLink").toString() : "");

            // ✅ MANUAL OR AUTO-GENERATED BATCH ID
            if (payload.get("batchId") != null && !payload.get("batchId").toString().trim().isEmpty()) {
                batch.setBatchId(payload.get("batchId").toString().trim());
            } else {
                batch.setBatchId(idGeneratorService.generateId("BATCH"));
            }

            Long trainerId = Long.valueOf(payload.get("trainerId").toString());

            User trainer = userRepository.findById(trainerId)
                    .orElseThrow(() -> new RuntimeException("Trainer not found"));

            batch.setTrainer(trainer);

            if (payload.get("maxStudents") != null && !payload.get("maxStudents").toString().trim().isEmpty()) {
                batch.setMaxStudents(Integer.parseInt(payload.get("maxStudents").toString().trim()));
            } else {
                batch.setMaxStudents(50); // Default Fallback
            }

            batch.setStartDate(LocalDate.parse(payload.get("startDate").toString()));
            batch.setEndDate(LocalDate.parse(payload.get("endDate").toString()));

            batchRepository.save(batch);

            return ResponseEntity.ok("Batch created successfully");

        } catch (Exception e) {

            return ResponseEntity.badRequest().body(e.getMessage());

        }
    }

    @GetMapping("/get-next-batch-id")
    public ResponseEntity<?> getNextBatchId() {
        return ResponseEntity.ok(Map.of("nextId", idGeneratorService.generateId("BATCH")));
    }
    @GetMapping("/batches")
    public List<Batches> getAllBatches() {
        return batchRepository.findAll();
    }

 

    // ================= ASSIGNMENTS =================
    @GetMapping("/batch-assignments")
    public List<Map<String, Object>> getBatchAssignments() {

        return batchRepository.findAll().stream().map(batch -> {

            Map<String, Object> map = new HashMap<>();
            map.put("batchId", batch.getId());
            map.put("batchName", batch.getBatchName());
           

            if (batch.getTrainer() != null) {
                map.put("trainerName", batch.getTrainer().getName());
                map.put("trainerEmail", batch.getTrainer().getEmail());
            } else {
                map.put("trainerName", "Not Assigned");
                map.put("trainerEmail", "-");
            }

            return map;

        }).collect(Collectors.toList());
    }

    @GetMapping("/all-assignments")
    public List<Map<String, Object>> getAllAssignments() {

        return courseTrainerRepository.findAll().stream().map(ct -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", ct.getId());
            map.put("courseName", ct.getCourse().getCourseName());
            map.put("trainerName", ct.getTrainer().getName());
            map.put("trainerEmail", ct.getTrainer().getEmail());
            return map;
        }).collect(Collectors.toList());
    }


   
    	//================= SCHEDULED CLASSES (UPDATED) =================
    @GetMapping("/schedule-classes")
    public List<Map<String, Object>> getAllScheduledClasses() {

     return scheduledClassRepository.findAll().stream().map(schedule -> {

         Map<String, Object> map = new HashMap<>();

         map.put("id", schedule.getId());

         map.put("startDate", schedule.getClassDate());

         /* FIXED */
         map.put("endDate", schedule.getEndDate());

         map.put("startTime", schedule.getStartTime());
         map.put("endTime", schedule.getEndTime());

         map.put("status", schedule.getStatus());

         Batches batch = batchRepository.findById(schedule.getBatchId()).orElse(null);
         User trainer = userRepository.findById(schedule.getTrainerId()).orElse(null);

         map.put("batch", Map.of(
                 "id", batch != null ? batch.getId() : 0,
                 "batch_name", batch != null ? batch.getBatchName() : "N/A"
         ));

         map.put("trainer", Map.of(
                 "id", trainer != null ? trainer.getId() : 0,
                 "trainer_name", trainer != null ? trainer.getName() : "N/A"
         ));

         return map;

     }).collect(Collectors.toList());
    }
 // ================= ASSIGN TRAINER TO BATCH =================
    @PostMapping("/assign-trainer-batch")
    public ResponseEntity<?> assignTrainerToBatch(@RequestBody Map<String, Long> payload) {
        try {

            Long batchId = payload.get("batchId");
            Long trainerId = payload.get("trainerId");

            Batches batch = batchRepository.findById(batchId)
                    .orElseThrow(() -> new RuntimeException("Batch not found"));

            User trainer = userRepository.findById(trainerId)
                    .orElseThrow(() -> new RuntimeException("Trainer not found"));

            batch.setTrainer(trainer);
            batchRepository.save(batch);

            return ResponseEntity.ok("Trainer assigned successfully");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // Removed rejectUser and deactivateUser from Admin as per SuperAdmin-only approval policy.
    // These actions are now restricted to SuperAdmin portal.
 // ================= BATCH CRUD OPERATIONS =================


    @PutMapping("/schedule-classes/{id}")
    public ResponseEntity<?> updateSchedule(@PathVariable Long id,
                                            @RequestBody Map<String, Object> payload) {

        try {

            ScheduledClass schedule = scheduledClassRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Schedule not found"));

            Long batchId = Long.parseLong(payload.get("batchId").toString());

            LocalDate startDate = LocalDate.parse(payload.get("startDate").toString());
            LocalDate endDate = LocalDate.parse(payload.get("endDate").toString());

            LocalTime startTime = LocalTime.parse(payload.get("startTime").toString());
            LocalTime endTime = LocalTime.parse(payload.get("endTime").toString());

            // ✅ Check conflict using batchId only
            List<ScheduledClass> existingSchedules =
                    scheduledClassRepository.findByBatchId(batchId);

            for (ScheduledClass existing : existingSchedules) {

                if (existing.getId().equals(id)) continue;

                boolean dateOverlap =
                        !(endDate.isBefore(existing.getClassDate())
                        || startDate.isAfter(existing.getEndDate()));

                boolean timeOverlap =
                        !(endTime.isBefore(existing.getStartTime())
                        || startTime.isAfter(existing.getEndTime()));

                if (dateOverlap && timeOverlap) {

                    return ResponseEntity.badRequest()
                            .body("Schedule conflict: Class already exists for this batch.");

                }
            }

            schedule.setBatchId(batchId);

            if (payload.get("trainerId") != null) {
                schedule.setTrainerId(Long.parseLong(payload.get("trainerId").toString()));
            }

            schedule.setClassDate(startDate);
            schedule.setEndDate(endDate);
            schedule.setStartTime(startTime);
            schedule.setEndTime(endTime);

            String newStatus = payload.get("status").toString().toUpperCase();
            schedule.setStatus(newStatus);

            scheduledClassRepository.save(schedule);

            return ResponseEntity.ok("Schedule updated successfully");

        } catch (Exception e) {

            return ResponseEntity.badRequest().body(e.getMessage());

        }
    }
 // 3. TOGGLE STATUS (PATCH)
 @PatchMapping("/batches/{id}/status")
 public ResponseEntity<?> updateBatchStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
     try {
         Batches batch = batchRepository.findById(id)
                 .orElseThrow(() -> new RuntimeException("Batch not found"));
         
         batch.setStatus(payload.get("status"));
         batchRepository.save(batch);
         return ResponseEntity.ok("Status updated");
     } catch (Exception e) {
         return ResponseEntity.badRequest().body(e.getMessage());
     }
 }
//================= BATCH CRUD OPERATIONS =================
 @PutMapping("/batches/{id}")
 public ResponseEntity<?> updateBatch(@PathVariable Long id,
                                      @RequestBody Map<String, Object> payload) {

     try {

         Batches batch = batchRepository.findById(id)
                 .orElseThrow(() -> new RuntimeException("Batch not found"));

         batch.setBatchName(payload.get("batchName").toString());

         String statusInput = payload.get("status").toString().toUpperCase();
         batch.setStatus(statusInput);

         batch.setStartDate(LocalDate.parse(payload.get("startDate").toString()));
         batch.setEndDate(LocalDate.parse(payload.get("endDate").toString()));

         if (payload.get("maxStudents") != null && !payload.get("maxStudents").toString().trim().isEmpty()) {
             batch.setMaxStudents(Integer.parseInt(payload.get("maxStudents").toString().trim()));
         }

         Long trainerId = Long.valueOf(payload.get("trainerId").toString());

         User trainer = userRepository.findById(trainerId)
                 .orElseThrow(() -> new RuntimeException("Trainer not found"));
         batch.setMeetingLink(payload.get("meetingLink") != null ? payload.get("meetingLink").toString() : "");

         batch.setTrainer(trainer);

         batchRepository.save(batch);

         return ResponseEntity.ok("Batch updated successfully");

     } catch (Exception e) {

         return ResponseEntity.badRequest().body("Error: " + e.getMessage());

     }
 }
//2. SOFT DELETE BATCH (Mark as INACTIVE)
@DeleteMapping("/batches/{id}")
public ResponseEntity<?> softDeleteBatch(@PathVariable Long id) {
  try {
      Batches batch = batchRepository.findById(id)
              .orElseThrow(() -> new RuntimeException("Batch not found"));
      
      // Ensure INACTIVE is added to your MySQL ENUM list
      batch.setStatus("INACTIVE"); 
      batchRepository.save(batch);
      return ResponseEntity.ok("Batch marked as Inactive");
  } catch (Exception e) {
      return ResponseEntity.badRequest().body("Error: " + e.getMessage());
  }
}



//================= SOFT DELETE SCHEDULED CLASS (Mark as INACTIVE) =================
@DeleteMapping("/schedule-classes/{id}")
public ResponseEntity<?> deleteSchedule(@PathVariable Long id) {
 try {
     ScheduledClass schedule = scheduledClassRepository.findById(id)
             .orElseThrow(() -> new RuntimeException("Schedule not found"));

     // Soft Delete Logic: Change status to INACTIVE instead of removing from DB
     schedule.setStatus("INACTIVE");
     
     scheduledClassRepository.save(schedule);
     return ResponseEntity.ok("Schedule marked as Inactive successfully");
 } catch (Exception e) {
     return ResponseEntity.badRequest().body("Error updating status: " + e.getMessage());
 }
}
@PostMapping("/create-trainer")
public ResponseEntity<?> createTrainer(@RequestBody Map<String, String> payload) {
    try {

        String email = payload.get("email");

        // ✅ CHECK DUPLICATE EMAIL
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "Email already exists"));
        }

        User trainer = new User();
        String plainPass = payload.get("password");
        trainer.setName(payload.get("name"));
        trainer.setEmail(email);
        
        String phone = payload.get("phone");
        if (phone == null || !phone.matches("^\\d{10}$")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Valid 10-digit phone number is required"));
        }
        trainer.setPhone(phone);
        trainer.setPassword(passwordEncoder.encode(plainPass)); // hashed
        trainer.setPlainPassword(plainPass);
        trainer.setStatus(Status.ACTIVE); // Auto-approved if created by Admin
        trainer.setApprovalStatus(com.lms.enums.ApprovalStatus.APPROVED);
        
        // ✅ MANUAL OR AUTO-GENERATED ID
        String trainerId = payload.get("studentId");
        if (trainerId == null || trainerId.trim().isEmpty()) {
            trainerId = idGeneratorService.generateId("TRAINER");
        }
        trainer.setStudentId(trainerId.trim());   // backward compat
        trainer.setPortalId(trainerId.trim());    // new universal ID

        RoleMaster role = roleRepository.findByRoleName("TRAINER");

        if (role == null) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "TRAINER role missing in DB"));
        }

        trainer.setRole(role);

        userRepository.save(trainer);
        notificationService.createNotification("New trainer profile created: " + trainer.getName(), "USER_CREATION", "ADMIN");

        return ResponseEntity.ok(Map.of("message", "Trainer created and approved successfully!"));

    } catch (Exception e) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", e.getMessage()));
    }
}



@PutMapping("/reset-trainer-password/{id}")
public ResponseEntity<?> resetTrainerPassword(
        @PathVariable Long id,
        @RequestBody Map<String, String> payload) {

    try {
        User trainer = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trainer not found"));
        String plainPass = payload.get("password");
        trainer.setPassword(passwordEncoder.encode(plainPass));
        trainer.setPlainPassword(plainPass);
        userRepository.save(trainer);

        // Simulated SMS trigger
        System.out.println("Send SMS to: " + trainer.getPhone());
        System.out.println("New Password: " + payload.get("password"));

        return ResponseEntity.ok("Password updated and sent to trainer phone.");
    } catch (Exception e) {
        return ResponseEntity.badRequest().body("Error: " + e.getMessage());
    }
}
    // Removed inactivateTrainer from Admin as per SuperAdmin-only approval policy.
@GetMapping("/all-trainers")
public List<User> getAllTrainers() {
    return userRepository.findByRole_RoleName("TRAINER");
}
@PutMapping("/update-trainer/{id}")
public ResponseEntity<?> updateTrainer(@PathVariable Long id,
                                       @RequestBody User updatedTrainer) {

    User trainer = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Trainer not found"));

    trainer.setName(updatedTrainer.getName());
    trainer.setEmail(updatedTrainer.getEmail());
    
    String phone = updatedTrainer.getPhone();
    if (phone == null || !phone.matches("^\\d{10}$")) {
        return ResponseEntity.badRequest().body(Map.of("message", "Valid 10-digit phone number is required"));
    }
    trainer.setPhone(phone);
    
    if (updatedTrainer.getPassword() != null && !updatedTrainer.getPassword().isEmpty()) {
         trainer.setPassword(passwordEncoder.encode(updatedTrainer.getPassword()));
         trainer.setPlainPassword(updatedTrainer.getPassword());
    }

    userRepository.save(trainer);

    return ResponseEntity.ok(Map.of("message", "Trainer updated successfully"));
}

    // ----- GENERIC ADMIN USER CREATION (SUBJECT TO SUPERADMIN APPROVAL) -----
    @PostMapping("/users/create")
    public ResponseEntity<?> createGenericUser(@RequestBody Map<String, String> payload) {
        String roleName = payload.get("roleName");
        if (roleName == null || roleName.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Role is required."));
        }

        roleName = roleName.toUpperCase();
        if (roleName.equals("SUPERADMIN") || roleName.equals("ADMIN")) {
            return ResponseEntity.status(403).body(Map.of("message", "Admins cannot create " + roleName + " accounts."));
        }

        RoleMaster role = roleRepository.findByRoleName(roleName);
        if (role == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role definition."));
        }

        String email = payload.get("email");
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered."));
        }

        User user = new User();
        user.setName(payload.get("name"));
        user.setEmail(email);
        
        String phone = payload.get("phone");
        if (phone == null || !phone.matches("^\\d{10}$")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Valid 10-digit phone number is required"));
        }
        user.setPhone(phone);
        
        String plainPass = payload.get("password");
        user.setPassword(passwordEncoder.encode(plainPass));
        user.setPlainPassword(plainPass);
        
        // Auto-approved if created by Admin
        user.setStatus(Status.ACTIVE);
        user.setApprovalStatus(com.lms.enums.ApprovalStatus.APPROVED);
        user.setRole(role);

        // ✅ MANUAL OR AUTO-GENERATED ID
        try {
            String customId = payload.get("studentId");
            String assignedId = null;
            
            if (customId != null && !customId.trim().isEmpty()) {
                assignedId = customId.trim();
            } else {
                String shortcut = null;
                if (roleName.equals("STUDENT") && payload.get("courseId") != null) {
                    try {
                        Long cId = Long.valueOf(payload.get("courseId").toString());
                        shortcut = courseRepository.findById(cId).map(CourseMaster::getShortcut).orElse(null);
                    } catch (Exception e) {}
                }
                assignedId = idGeneratorService.generateId(roleName, shortcut);
            }

            user.setPortalId(assignedId);
            user.setStudentId(assignedId);
        } catch (Exception e) {
            // Robust Fallback
            String sid = idGeneratorService.generateId(roleName);
            user.setPortalId(sid);
            user.setStudentId(sid);
        }

        userRepository.save(user);
        notificationService.createNotification("New student profile created: " + user.getName(), "USER_CREATION", "ADMIN");

        return ResponseEntity.ok(Map.of(
            "message", "User " + user.getName() + " created and approved successfully!"
        ));
    }

// Removed toggleTrainerStatus from Admin as per SuperAdmin-only approval policy.
@PutMapping("/courses/{id}")
public ResponseEntity<?> updateCourse(
        @PathVariable Long id,
        @RequestParam("courseName") String courseName,
        @RequestParam("duration") String duration,
        @RequestParam("description") String description,
        @RequestParam(value = "shortcut", required = false) String shortcut,
        @RequestParam(value = "courseCode", required = false) String courseCode,
        @RequestParam(value = "category", required = false) String category,
        @RequestParam(value = "file", required = false) MultipartFile file
) {

    try {

        CourseMaster course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        course.setCourseName(courseName);
        course.setDuration(duration);
        course.setDescription(description);
        course.setCourseCode(courseCode);
        course.setCategory(category);
        if (shortcut != null) course.setShortcut(shortcut.toUpperCase());

        // ===== CLOUDINARY FILE UPLOAD =====
        if (file != null && !file.isEmpty()) {
            String url = cloudinaryService.uploadDocument(file, "syllabus");
            course.setSyllabusFileName(file.getOriginalFilename());
            course.setSyllabusFilePath(url);
        }

        courseRepository.save(course);

        return ResponseEntity.ok("Course updated successfully");

        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            System.err.println("COURSE_ERR: Update integrity violation: " + e.getMessage());
            String msg = e.getMostSpecificCause().getMessage().toLowerCase();
            if (msg.contains("shortcut")) return ResponseEntity.badRequest().body("Error: Shortcut already exists.");
            if (msg.contains("course_code") || msg.contains("course_master.course_code")) return ResponseEntity.badRequest().body("Error: Course Code already exists.");
            return ResponseEntity.badRequest().body("Error: Duplicate entry or constraint violation.");
        } catch (Exception e) {
            System.err.println("COURSE_ERR: Update failure: " + e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
}


//================= SOFT DELETE COURSE =================
@DeleteMapping("/courses/{id}")
public ResponseEntity<?> softDeleteCourse(@PathVariable Long id) {
 try {
     CourseMaster course = courseRepository.findById(id)
             .orElseThrow(() -> new RuntimeException("Course not found"));

     course.setStatus("INACTIVE");
     courseRepository.save(course);

     return ResponseEntity.ok("Course marked as INACTIVE");

 } catch (Exception e) {
     return ResponseEntity.badRequest().body(e.getMessage());
 }
}
//================= REACTIVATE COURSE =================
@PutMapping("/courses/reactivate/{id}")
public ResponseEntity<?> reactivateCourse(@PathVariable Long id) {
 try {
     CourseMaster course = courseRepository.findById(id)
             .orElseThrow(() -> new RuntimeException("Course not found"));

     course.setStatus("ACTIVE");
     courseRepository.save(course);

     return ResponseEntity.ok("Course reactivated successfully");

 } catch (Exception e) {
     return ResponseEntity.badRequest().body(e.getMessage());
 }
}
@GetMapping("/courses/inactive")
public List<CourseMaster> getInactiveCourses() {
    return courseRepository.findAll()
            .stream()
            .filter(course -> "INACTIVE".equals(course.getStatus()))
            .toList();
}


@GetMapping("/student-course-mappings")
public List<Map<String, Object>> getStudentCourseMappings() {
    return adminService.getStudentCourseMappings();
}



@GetMapping("/student-batch-mappings")
public List<Map<String, Object>> getStudentBatchMappings() {
    return adminService.getStudentBatchMappings();
}

    @PostMapping("/enrolments")
    public ResponseEntity<?> enrolStudent(@RequestBody Map<String, Object> payload) {
        try {
            Long studentId = Long.valueOf(payload.get("studentId").toString());

            // Course mapping – optional if only adding to batch
            String courseIdStr = payload.get("courseId") != null ? payload.get("courseId").toString() : null;
            if (courseIdStr != null && !courseIdStr.isBlank() && !courseIdStr.equals("null")) {
                Long courseId = Long.valueOf(courseIdStr);
                Double feePaid = payload.get("feePaid") != null && !payload.get("feePaid").toString().isBlank() ? Double.valueOf(payload.get("feePaid").toString()) : null;
                Double feePending = payload.get("feePending") != null && !payload.get("feePending").toString().isBlank() ? Double.valueOf(payload.get("feePending").toString()) : null;
                String courseMode = payload.get("courseMode") != null ? payload.get("courseMode").toString() : null;
                adminService.mapStudentToCourse(studentId, courseId, feePaid, feePending, courseMode);
            }

            // Batch mapping – also optional
            String batchIdStr = payload.get("batchId") != null ? payload.get("batchId").toString() : null;
            if (batchIdStr != null && !batchIdStr.isBlank() && !batchIdStr.equals("null")) {
                adminService.mapStudentToBatch(studentId, Long.valueOf(batchIdStr));
            }

            return ResponseEntity.ok(Map.of("message", "Enrolment processed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


@PutMapping("/student-course-mappings/{mappingId}/toggle-status")
public ResponseEntity<?> toggleStudentCourseStatus(@PathVariable Long mappingId) {
    try {
        StudentCourse mapping = studentCourseRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        if ("ACTIVE".equalsIgnoreCase(mapping.getStatus())) {
            mapping.setStatus("INACTIVE");
        } else {
            mapping.setStatus("ACTIVE");
        }
        studentCourseRepository.save(mapping);
        return ResponseEntity.ok("Status toggled to " + mapping.getStatus());
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@PutMapping("/student-course-mappings/{mappingId}/fees")
public ResponseEntity<?> updateStudentCourseFees(@PathVariable Long mappingId, @RequestBody Map<String, Object> payload) {
    try {
        StudentCourse mapping = studentCourseRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        if(payload.get("feePaid") != null) mapping.setFeePaid(Double.valueOf(payload.get("feePaid").toString()));
        if(payload.get("feePending") != null) mapping.setFeePending(Double.valueOf(payload.get("feePending").toString()));
        
        studentCourseRepository.save(mapping);
        return ResponseEntity.ok("Fees updated successfully");
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@PostMapping("/student-batch-mappings")
public ResponseEntity<?> mapStudentToBatch(
        @RequestParam Long studentId,
        @RequestParam Long batchId) {

    try {
        adminService.mapStudentToBatch(studentId, batchId);
        return ResponseEntity.ok("Mapped successfully");
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@DeleteMapping("/student-batch-mappings")
public ResponseEntity<?> deleteStudentBatchMapping(@RequestParam Long mappingId) {
    try {
        adminService.removeStudentFromBatch(mappingId);
        return ResponseEntity.ok("Assignment removed successfully");
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@Autowired
private com.lms.repository.StudentBatchesRepository studentBatchesRepository;

@PutMapping("/student-batch-mappings/{mappingId}/toggle-status")
public ResponseEntity<?> toggleStudentBatchStatus(@PathVariable Long mappingId) {
    try {
        com.lms.entity.StudentBatches mapping = studentBatchesRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        if (mapping.getStatus() == com.lms.entity.StudentBatches.Status.ACTIVE) {
            mapping.setStatus(com.lms.entity.StudentBatches.Status.REMOVED);
        } else {
            mapping.setStatus(com.lms.entity.StudentBatches.Status.ACTIVE);
        }
        studentBatchesRepository.save(mapping);
        return ResponseEntity.ok("Status toggled to " + mapping.getStatus());
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}


@PutMapping("/students/{id}/contact")
public ResponseEntity<?> updateStudentContact(
        @PathVariable Long id,
        @RequestBody Map<String, String> payload) {
    try {
        User student = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        String newEmail = payload.get("email");
        String newPhone = payload.get("phone");

        if (newEmail != null && !newEmail.equals(student.getEmail())) {
            if (userRepository.findByEmail(newEmail).isPresent()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Email already in use by another account"));
            }
            student.setEmail(newEmail.trim());
        }

        if (newPhone != null) {
            if (!newPhone.trim().matches("^\\d{10}$")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Valid 10-digit phone number is required"));
            }
            student.setPhone(newPhone.trim());
        }

        userRepository.save(student);

        // ✅ RETURN UPDATED DATA
        return ResponseEntity.ok(Map.of(
                "message", "Contact updated successfully",
                "studentId", student.getId(),
                "studentEmail", student.getEmail(),
                "phone", student.getPhone()
        ));

    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}

//================= ATTENDANCE MARKING =================

//1. Fetch Students by Batch for Marking
@GetMapping("/attendance/students/{batchId}")
public ResponseEntity<?> getStudentsByBatch(@PathVariable Long batchId) {
 try {
     Batches batch = batchRepository.findById(batchId)
             .orElseThrow(() -> new RuntimeException("Batch not found"));

     // Assuming StudentBatch entity connects students to batches
     List<Map<String, Object>> students = batch.getStudentBatches().stream()
             .map(sb -> {
                 Map<String, Object> map = new HashMap<>();
                 map.put("studentId", sb.getStudent().getId());
                 map.put("studentName", sb.getStudent().getName());
                 return map;
             }).collect(Collectors.toList());

     return ResponseEntity.ok(students);
 } catch (Exception e) {
     return ResponseEntity.badRequest().body("Error: " + e.getMessage());
 }
}


@GetMapping("/courses/details")
public List<Map<String, Object>> getAllCoursesDetails() {

    List<Map<String, Object>> studentMappings = adminService.getStudentCourseMappings();

    return courseRepository.findAll().stream().map(course -> {

        Map<String, Object> courseMap = new HashMap<>();

        courseMap.put("id", course.getId());
        courseMap.put("courseName", course.getCourseName());
        courseMap.put("description", course.getDescription());
        courseMap.put("duration", course.getDuration());
        courseMap.put("syllabusFileName", course.getSyllabusFileName());

        // ✅ Fetch students mapped to this course
        List<Map<String, Object>> students =
                studentMappings.stream()
                        .filter(m -> Long.valueOf(m.get("courseId").toString())
                                .equals(course.getId()))
                        .collect(Collectors.toList());

        courseMap.put("students", students);

        return courseMap;

    }).collect(Collectors.toList());
}
@PostMapping("/schedule-classes")
public ResponseEntity<?> scheduleClass(@RequestBody Map<String, String> payload) {

    try {

        Long batchId = Long.parseLong(payload.get("batchId"));
        Long trainerId = Long.parseLong(payload.get("trainerId"));

        Batches batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        // ✅ Allow only ACTIVE batches
        if (!"ONGOING".equalsIgnoreCase(batch.getStatus())) {
            return ResponseEntity.badRequest().body("Classes can only be scheduled for ACTIVE batches");
        }

        LocalDate startDate = LocalDate.parse(payload.get("startDate"));
        LocalDate endDate = LocalDate.parse(payload.get("endDate"));

        LocalTime startTime = LocalTime.parse(payload.get("startTime"));
        LocalTime endTime = LocalTime.parse(payload.get("endTime"));

        List<ScheduledClass> existingSchedules =
                scheduledClassRepository.findByBatchId(batchId);

        for (ScheduledClass existing : existingSchedules) {

            boolean dateOverlap =
                    !(endDate.isBefore(existing.getClassDate())
                            || startDate.isAfter(existing.getEndDate()));

            boolean timeOverlap =
                    !(endTime.isBefore(existing.getStartTime())
                            || startTime.isAfter(existing.getEndTime()));

            if (dateOverlap && timeOverlap) {

                return ResponseEntity.badRequest()
                        .body("Schedule conflict: Class already exists for this batch.");

            }
        }

        ScheduledClass schedule = new ScheduledClass();

        schedule.setBatchId(batchId);
        schedule.setTrainerId(trainerId);
        schedule.setClassDate(startDate);
        schedule.setEndDate(endDate);
        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setStatus("ACTIVE");

        scheduledClassRepository.save(schedule);

        return ResponseEntity.ok("Class scheduled successfully");

    } catch (Exception e) {

        return ResponseEntity.badRequest().body(e.getMessage());

    }
}


// 3. GET STUDENTS OF A BATCH (FOR INITIAL DISPLAY)
@GetMapping("/attendance/batch/{batchId}/students")
public ResponseEntity<?> getBatchStudents(@PathVariable Long batchId) {
    try {
        // Get all students mapped to this batch
        List<StudentBatches> studentBatches = studentBatchesRepository.findByBatch_Id(batchId);
        
        List<Map<String, Object>> students = studentBatches.stream().map(sb -> {
            Map<String, Object> map = new HashMap<>();
            map.put("studentId", sb.getStudent().getId());
            map.put("studentName", sb.getStudent().getName());
            map.put("studentEmail", sb.getStudent().getEmail());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(students);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body("Error: " + e.getMessage());
    }
}

// 4. DOWNLOAD ATTENDANCE REPORT (CSV)
@GetMapping("/attendance/download/{batchId}")
public ResponseEntity<?> downloadAdminAttendanceReport(
        @PathVariable Integer batchId,
        @RequestParam(required = false) String fromDate,
        @RequestParam(required = false) String toDate) {

    try {
        Batches batch = batchRepository.findById(Long.valueOf(batchId))
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        List<TrainerMarkedAttendance> attendanceList;

        if (fromDate != null && toDate != null) {
            LocalDate from = LocalDate.parse(fromDate);
            LocalDate to = LocalDate.parse(toDate);
            attendanceList = attendanceRepository.findByBatchIdAndAttendanceDateBetween(batchId, from, to);
        } else {
            attendanceList = attendanceRepository.findByBatchId(batchId);
        }

        // Generate CSV content
        StringBuilder csv = new StringBuilder();
        csv.append("Student Name,Email,Date,Status,Topic,Created At\n");

        for (TrainerMarkedAttendance attendance : attendanceList) {
            User student = userRepository.findById(Long.valueOf(attendance.getStudentId())).orElse(null);
            
            if (student != null) {
                csv.append(student.getName()).append(",");
                csv.append(student.getEmail()).append(",");
            } else {
                csv.append("Unknown,N/A,");
            }
            
            csv.append(attendance.getAttendanceDate()).append(",");
            csv.append(attendance.getStatus()).append(",");
            csv.append(attendance.getTopic() != null ? attendance.getTopic() : "N/A").append(",");
            csv.append(attendance.getCreatedAt()).append("\n");
        }

        String filename = batch.getBatchName() + "_Attendance_Report.csv";

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .header("Content-Type", "text/csv")
                .body(csv.toString());

    } catch (Exception e) {
        return ResponseEntity.badRequest().body("Error: " + e.getMessage());
    }
}
//================= ADMIN ATTENDANCE =================




@GetMapping("/attendance/batch/{batchId}")
public ResponseEntity<?> getAdminAttendanceByBatch(
        @PathVariable Long batchId,
        @RequestParam(required = false) String date,
        @RequestParam(required = false) String fromDate,
        @RequestParam(required = false) String toDate) {

    try {

        List<TrainerMarkedAttendance> attendanceList;

        if (date != null && !date.isEmpty()) {

            LocalDate targetDate = LocalDate.parse(date);

            attendanceList = attendanceRepository
                    .findByBatchIdAndAttendanceDate(batchId.intValue(), targetDate);

        } else if (fromDate != null && toDate != null
                && !fromDate.isEmpty() && !toDate.isEmpty()) {

            LocalDate from = LocalDate.parse(fromDate);
            LocalDate to = LocalDate.parse(toDate);

            attendanceList = attendanceRepository
                    .findByBatchIdAndAttendanceDateBetween(batchId.intValue(), from, to);

        } else {

            attendanceList = attendanceRepository
                    .findByBatchId(batchId.intValue());
        }

        List<Map<String, Object>> response = new ArrayList<>();

        for (TrainerMarkedAttendance attendance : attendanceList) {

            Map<String, Object> map = new HashMap<>();

            map.put("id", attendance.getId());
            map.put("studentId", attendance.getStudentId());
            map.put("batchId", attendance.getBatchId());
            map.put("date", attendance.getAttendanceDate());
            map.put("status", attendance.getStatus());
            map.put("topic", attendance.getTopic());
            map.put("lateMinutes", attendance.getLateMinutes());
            map.put("approvedOnline", attendance.getApprovedOnline());
            map.put("createdAt", attendance.getCreatedAt());

            // Fetch student details
            User student = userRepository
                    .findById(Long.valueOf(attendance.getStudentId()))
                    .orElse(null);

            if (student != null) {
                map.put("studentName", student.getName());
                map.put("studentEmail", student.getEmail());
                map.put("formattedId", student.getStudentId());
            } else {
                map.put("studentName", "Unknown");
                map.put("studentEmail", "N/A");
                map.put("formattedId", String.valueOf(attendance.getStudentId()));
            }

            response.add(map);
        }

        return ResponseEntity.ok(response);

    } catch (Exception e) {

        return ResponseEntity.badRequest()
                .body("Error fetching attendance: " + e.getMessage());
    }
}
@PutMapping("/attendance/update")
public ResponseEntity<?> updateAdminAttendance(
        @RequestBody List<Map<String, Object>> updates) {

    try {

        for (Map<String, Object> update : updates) {

            Integer id = update.get("id") != null
                    ? Integer.valueOf(update.get("id").toString())
                    : null;

            String status = update.get("status").toString();

            TrainerMarkedAttendance attendance;

            // UPDATE EXISTING RECORD
            if (id != null) {

                attendance = attendanceRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Attendance record not found"));

                attendance.setStatus(status);

            } else {

                attendance = new TrainerMarkedAttendance();

                attendance.setStudentId(
                        Integer.valueOf(update.get("studentId").toString())
                );

                attendance.setBatchId(
                        Integer.valueOf(update.get("batchId").toString())
                );

                attendance.setAttendanceDate(
                        LocalDate.parse(update.get("date").toString())
                );

                attendance.setStatus(status);

                attendance.setTopic(
                        update.get("topic") != null
                                ? update.get("topic").toString()
                                : ""
                );

                attendance.setCreatedAt(LocalDate.now().atStartOfDay());
            }

            attendanceRepository.save(attendance);
        }

        return ResponseEntity.ok("Attendance updated successfully");

    } catch (Exception e) {

        return ResponseEntity.badRequest()
                .body("Update failed: " + e.getMessage());
    }
}
////================= UPDATE STUDENT CONTACT (email + phone) =================
//@PutMapping("/students/{id}/contact")
//public ResponseEntity<?> updateStudentContact(
//     @PathVariable Long id,
//     @RequestBody Map<String, String> payload) {
// try {
//     User student = userRepository.findById(id)
//             .orElseThrow(() -> new RuntimeException("Student not found"));
//
//     String newEmail = payload.get("email");
//     String newPhone = payload.get("phone");
//
//     // If email changed, check it's not taken by another user
//     if (newEmail != null && !newEmail.equals(student.getEmail())) {
//         if (userRepository.findByEmail(newEmail).isPresent()) {
//             return ResponseEntity.badRequest()
//                     .body(Map.of("message", "Email already in use by another account"));
//         }
//         student.setEmail(newEmail.trim());
//     }
//
//     if (newPhone != null) {
//         student.setPhone(newPhone.trim());
//     }
//
//     userRepository.save(student);
//
//     return ResponseEntity.ok(Map.of("message", "Contact updated successfully"));
//
// } catch (Exception e) {
//     return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
// }
//}
//
//@PutMapping("/students/{id}/toggle-status")
//public ResponseEntity<?> toggleStudentStatus(@PathVariable Long id) {
//    try {
//        User student = userRepository.findById(id)
//                .orElseThrow(() -> new RuntimeException("Student not found"));
// 
//        if (student.getStatus() == Status.ACTIVE) {
//            student.setStatus(Status.INACTIVE);
//        } else {
//            student.setStatus(Status.ACTIVE);
//        }
// 
//        userRepository.save(student);
// 
//        return ResponseEntity.ok(Map.of(
//                "message", "Student status updated successfully",
//                "newStatus", student.getStatus().name()
//        ));
// 
//    } catch (Exception e) {
//        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
//    }
//}
// Removed toggleStudentStatus from Admin as per SuperAdmin-only approval policy.

    // ================= CERTIFICATES (ADMIN ISSUANCE) =================
    @PostMapping("/certificates/upload")
    public ResponseEntity<?> uploadCertificate(
            @RequestParam("studentId") Long studentId,
            @RequestParam("courseName") String courseName,
            @RequestParam("issueDate") String issueDateStr,
            @RequestParam("visibleFrom") String visibleFromStr,
            @RequestParam("file") MultipartFile file) {
        try {
            User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));

            if (file == null || file.isEmpty()) {
                throw new RuntimeException("No file provided");
            }

            java.time.LocalDateTime visibleFrom = null;
            if (visibleFromStr != null && !visibleFromStr.isEmpty()) {
                visibleFrom = java.time.LocalDateTime.parse(visibleFromStr);
            }

            // Upload to Cloudinary — store CDN URL instead of BLOB
            String cloudinaryUrl = cloudinaryService.uploadDocument(file, "certificates");
            Certificate cert = new Certificate(student, courseName, file.getOriginalFilename(), cloudinaryUrl, LocalDate.parse(issueDateStr), visibleFrom);
            certificateRepository.save(cert);

            return ResponseEntity.ok(Map.of("message", "Certificate issued successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/certificates/{studentId}")
    public ResponseEntity<?> getStudentCertificates(@PathVariable Long studentId) {
        try {
            System.out.println("DEBUG: Fetching certificates for studentId: " + studentId);
            List<Certificate> certs = certificateRepository.findByStudent_IdOrderByIssueDateDesc(studentId);
            
            // Map to simple HashMap to guarantee 100% safe Jackson serialization
            List<Map<String, Object>> response = new java.util.ArrayList<>();
            for(Certificate c : certs) {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", c.getId());
                map.put("courseName", c.getCourseName());
                map.put("fileName", c.getFileName());
                map.put("issueDate", c.getIssueDate() != null ? c.getIssueDate().toString() : "");
                map.put("visibleFrom", c.getVisibleFrom() != null ? c.getVisibleFrom().toString() : "");
                response.add(map);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("ERROR in getStudentCertificates: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/certificates/{certId}")
    public ResponseEntity<?> deleteCertificate(@PathVariable Long certId) {
        try {
            Certificate cert = certificateRepository.findById(certId).orElseThrow(() -> new RuntimeException("Certificate not found"));
            // Delete from Cloudinary (non-fatal if already deleted)
            cloudinaryService.deleteByUrl(cert.getFilePath(), "raw");
            certificateRepository.delete(cert);
            return ResponseEntity.ok(Map.of("message", "Certificate revoked successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ================= STUDENT PROFILE & MODE UPDATE =================

    @PutMapping("/students/{id}")
    public ResponseEntity<?> updateStudentProfile(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            User student = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            if (payload.containsKey("name")) student.setName(String.valueOf(payload.get("name")));
            if (payload.containsKey("email")) student.setEmail(String.valueOf(payload.get("email")));
            if (payload.containsKey("phone")) student.setPhone(String.valueOf(payload.get("phone")));
            if (payload.containsKey("status")) {
                try {
                    String statusStr = String.valueOf(payload.get("status")).toUpperCase();
                    student.setStatus(com.lms.enums.Status.valueOf(statusStr));
                } catch (Exception e) {}
            }
            if (payload.containsKey("studentId")) {
                String newId = String.valueOf(payload.get("studentId")).trim();
                if (!newId.isEmpty()) {
                    student.setStudentId(newId);
                    student.setPortalId(newId);
                }
            }

            userRepository.save(student);
            return ResponseEntity.ok(Map.of("message", "Student profile updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/student-course-mappings/{mappingId}/mode")
    public ResponseEntity<?> updateCourseMode(@PathVariable Long mappingId, @RequestBody Map<String, Object> payload) {
        try {
            StudentCourse mapping = studentCourseRepository.findById(mappingId)
                    .orElseThrow(() -> new RuntimeException("Course mapping not found"));

            if (payload.containsKey("courseMode")) {
                mapping.setCourseMode(String.valueOf(payload.get("courseMode")).toUpperCase());
            }

            studentCourseRepository.save(mapping);
            return ResponseEntity.ok(Map.of("message", "Course mode updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // =====================================================================
    // ADMIN PROFILE – Migrated for robust matching
    // =====================================================================
    @GetMapping("/profile/{email:.+}")
    public ResponseEntity<AdminProfile> getAdminProfile(@PathVariable("email") String email) {
        try {
            System.out.println("DEBUG: Fetching admin profile for: " + email);
            
            Optional<AdminProfile> profileOpt = adminProfileRepository.findByEmail(email);
            if (profileOpt.isPresent()) {
                AdminProfile profile = profileOpt.get();
                userRepository.findByEmail(email).ifPresent(user -> {
                    if (user.getPortalId() != null && !user.getPortalId().equals(profile.getStudentId())) {
                        profile.setStudentId(user.getPortalId());
                        adminProfileRepository.save(profile);
                    }
                });
                return ResponseEntity.ok(profile);
            }

            return userRepository.findByEmail(email).map(user -> {
                AdminProfile seeded = new AdminProfile();
                seeded.setName(user.getName());
                seeded.setEmail(user.getEmail());
                seeded.setPhone(user.getPhone());
                seeded.setStudentId(user.getPortalId());
                return ResponseEntity.ok(adminProfileRepository.save(seeded));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            System.err.println("CRITICAL_ERR: Admin Profile module failed for " + email);
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/update-profile")
    public ResponseEntity<?> updateAdminProfile(@RequestBody AdminProfile profileData) {
        try {
            AdminProfile existing = adminProfileRepository.findByEmail(profileData.getEmail())
                    .orElse(new AdminProfile());

            if (existing.getId() == null) {
                existing.setEmail(profileData.getEmail());
            }

            existing.setName(profileData.getName());
            existing.setPhone(profileData.getPhone());
            existing.setGender(profileData.getGender());
            existing.setBio(profileData.getBio());
            existing.setProfilePic(profileData.getProfilePic());
            existing.setAddress(profileData.getAddress());
            existing.setCity(profileData.getCity());
            existing.setState(profileData.getState());
            existing.setPincode(profileData.getPincode());
            existing.setAdminTitle(profileData.getAdminTitle());
            existing.setEmergencyContact(profileData.getEmergencyContact());

            adminProfileRepository.save(existing);

            userRepository.findByEmail(profileData.getEmail()).ifPresent(user -> {
                user.setName(profileData.getName());
                user.setPhone(profileData.getPhone());
                userRepository.save(user);
            });

            return ResponseEntity.ok("Profile updated successfully ✅");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Profile update failed ❌");
        }
    }
}
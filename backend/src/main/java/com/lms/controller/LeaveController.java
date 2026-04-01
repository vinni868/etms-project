package com.lms.controller;

import java.io.*;
import com.lms.service.CloudinaryService;
import com.lms.entity.LeaveRequest;
import com.lms.entity.User;
import com.lms.repository.LeaveRequestRepository;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.lms.service.NotificationService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.*;

import com.lms.repository.ScheduledClassRepository;
import com.lms.repository.AttendanceRepository;
import com.lms.entity.ScheduledClass;
import com.lms.entity.TrainerMarkedAttendance;

@RestController
public class LeaveController {

    @Autowired
    private LeaveRequestRepository leaveRepo;
    
    @Autowired
    private UserRepository userRepo;
    
    @Autowired
    private ScheduledClassRepository classRepo;
    
    @Autowired
    private AttendanceRepository attendanceRepo;
    
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.lms.service.CloudinaryService cloudinaryService;

    /** POST /api/leave/request — student/staff submits leave */
    @PostMapping(value = "/api/leave/request", consumes = {"multipart/form-data"})
    public ResponseEntity<?> requestLeave(
            @RequestParam("fromDate") String fromDate,
            @RequestParam("toDate") String toDate,
            @RequestParam("reason") String reason,
            @RequestParam(value = "requestType", defaultValue = "LEAVE") String requestType,
            @RequestParam(value = "courses", required = false) String courses,
            @RequestParam(value = "batches", required = false) String batches,
            @RequestParam(value = "courseMode", required = false) String courseMode,
            @RequestParam(value = "leaveCategory", required = false) String leaveCategory,
            @RequestParam(value = "file", required = false) org.springframework.web.multipart.MultipartFile file,
            Authentication auth) {
        User user = getUser(auth);
        LeaveRequest req = new LeaveRequest();
        req.setUserId(user.getId());
        req.setFromDate(LocalDate.parse(fromDate));
        req.setToDate(LocalDate.parse(toDate));
        req.setReason(reason);
        req.setRequestType(requestType);
        if (leaveCategory != null) req.setLeaveCategory(leaveCategory);
        if (courses != null) req.setCourses(courses);
        if (batches != null) req.setBatches(batches);
        if (courseMode != null) req.setCourseMode(courseMode);

        // File upload to Cloudinary
        if (file != null && !file.isEmpty()) {
            try {
                String url = cloudinaryService.uploadDocument(file, "leaves");
                req.setDocumentFileName(file.getOriginalFilename());
                req.setDocumentFilePath(url);  // stores Cloudinary CDN URL
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("message", "File upload failed: " + e.getMessage()));
            }
        }

        leaveRepo.save(req);
        notificationService.createNotification(
            "New leave request from " + user.getName() + " for " + req.getFromDate() + " to " + req.getToDate(),
            "LEAVE",
            "ADMIN",
            req.getId()
        );
        return ResponseEntity.ok(Map.of("status", "success", "message", "Leave request submitted successfully."));
    }



    /** GET /api/leave/my-requests — my requests */
    @GetMapping("/api/leave/my-requests")
    public ResponseEntity<?> myRequests(Authentication auth) {
        User user = getUser(auth);
        return ResponseEntity.ok(enrichLeaves(leaveRepo.findByUserIdOrderByCreatedAtDesc(user.getId())));
    }

    /** GET /api/admin/leave — all requests */
    @GetMapping("/api/admin/leave")
    public ResponseEntity<?> adminGetAll(@RequestParam(required = false) String status, Authentication auth) {
        User currentUser = getUser(auth);
        String roleName = currentUser.getRole().getRoleName();

        List<LeaveRequest> list;
        if (status != null) {
            list = leaveRepo.findByStatusOrderByCreatedAtDesc(status);
        } else {
            list = leaveRepo.findAllByOrderByCreatedAtDesc();
        }

        // FILTER: ADMIN sees only STUDENT leaves. SUPERADMIN sees everyone's leaves (including Student/Staff).
        List<Map<String, Object>> enriched = enrichLeaves(list);
        if ("ADMIN".equalsIgnoreCase(roleName)) {
            enriched = enriched.stream()
                    .filter(e -> "STUDENT".equalsIgnoreCase((String) e.get("userRole")))
                    .toList();
        } else if (!"SUPERADMIN".equalsIgnoreCase(roleName)) {
            // Safety: non-admins/superadmins shouldn't access this
            return ResponseEntity.status(403).body(Map.of("message", "Unauthorized access."));
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("requests", enriched);
        // Counts should also be filtered for Admin? Or global?
        // Usually counts on top reflect the list below.
        if ("ADMIN".equalsIgnoreCase(roleName)) {
             // For Admin, count only student requests
             resp.put("pendingCount", enriched.stream().filter(e -> "PENDING".equalsIgnoreCase((String)e.get("status"))).count());
             resp.put("approvedCount", enriched.stream().filter(e -> "APPROVED".equalsIgnoreCase((String)e.get("status"))).count());
             resp.put("rejectedCount", enriched.stream().filter(e -> "REJECTED".equalsIgnoreCase((String)e.get("status"))).count());
             resp.put("conditionalCount", enriched.stream().filter(e -> "CONDITIONAL".equalsIgnoreCase((String)e.get("status"))).count());
        } else {
             resp.put("pendingCount",  leaveRepo.countByStatus("PENDING"));
             resp.put("approvedCount", leaveRepo.countByStatus("APPROVED"));
             resp.put("rejectedCount", leaveRepo.countByStatus("REJECTED"));
             resp.put("conditionalCount", leaveRepo.countByStatus("CONDITIONAL"));
        }
        return ResponseEntity.ok(resp);
    }

    /** PUT /api/admin/leave/{id}/approve */
    @PutMapping("/api/admin/leave/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        return updateStatus(id, "APPROVED", body.get("note"), auth);
    }

    /** PUT /api/admin/leave/{id}/reject */
    @PutMapping("/api/admin/leave/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        return updateStatus(id, "REJECTED", body.get("note"), auth);
    }

    /** PUT /api/admin/leave/{id}/conditional */
    @PutMapping("/api/admin/leave/{id}/conditional")
    public ResponseEntity<?> conditional(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        return updateStatus(id, "CONDITIONAL", body.get("note"), auth);
    }

    @GetMapping("/api/leave/document/{id}")
    public ResponseEntity<?> downloadDocument(@PathVariable Long id, Authentication auth) {
        try {
            User user = getUser(auth);
            LeaveRequest req = leaveRepo.findById(id).orElseThrow(() -> new RuntimeException("Request not found"));

            // SECURITY: Only allow owner or ADMIN/SUPERADMIN
            String roleName = user.getRole().getRoleName();
            boolean isAdmin = "ADMIN".equalsIgnoreCase(roleName) || "SUPERADMIN".equalsIgnoreCase(roleName);
            boolean isOwner = req.getUserId().equals(user.getId());

            if (!isAdmin && !isOwner) {
                return ResponseEntity.status(403).body(Map.of("message", "Unauthorized access to this document."));
            }

            String url = req.getDocumentFilePath();
            if (url == null || url.isBlank()) return ResponseEntity.notFound().build();

            // Cloudinary URL — redirect directly
            if (url.startsWith("http")) {
                return ResponseEntity.status(302)
                        .header("Location", url)
                        .build();
            }

            // Legacy local path — no longer available on Render
            return ResponseEntity.status(404).body(Map.of("message", "Document not available. Please re-upload."));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private ResponseEntity<?> updateStatus(Long id, String status, String note, Authentication auth) {
        User admin = getUser(auth);
        String adminRole = admin.getRole().getRoleName();
        LeaveRequest req = leaveRepo.findById(id).orElseThrow(() -> new RuntimeException("Leave request not found"));

        // Enforcement: Admin can only approve Student requests
        if ("ADMIN".equalsIgnoreCase(adminRole)) {
            User applicant = userRepo.findById(req.getUserId()).orElse(null);
            if (applicant == null || !"STUDENT".equalsIgnoreCase(applicant.getRole().getRoleName())) {
                return ResponseEntity.status(403).body(Map.of("message", "Admins can only manage Student leave requests."));
            }
        } else if (!"SUPERADMIN".equalsIgnoreCase(adminRole)) {
            return ResponseEntity.status(403).body(Map.of("message", "Unauthorized."));
        }

        req.setStatus(status);
        req.setApprovedBy(admin.getId());
        req.setApprovalNote(note);
        leaveRepo.save(req);

        // Auto-sync logic if APPROVED
        if ("APPROVED".equalsIgnoreCase(status) && req.getBatches() != null) {
            try {
                // Parse batches, expected comma separated like "1,2,3" or JSON array "[1,2]"
                String bStr = req.getBatches().replaceAll("[\\[\\]\" ]", "");
                if(!bStr.isEmpty()) {
                    List<Long> batchIds = Arrays.stream(bStr.split(","))
                                                .map(String::trim)
                                                .filter(s -> !s.isEmpty())
                                                .map(Long::parseLong)
                                                .toList();

                    for(Long bId : batchIds) {
                        for (LocalDate d = req.getFromDate(); !d.isAfter(req.getToDate()); d = d.plusDays(1)) {
                            final LocalDate currentD = d;
                            // Search existing record for this student/batch/date
                            TrainerMarkedAttendance att = attendanceRepo.findByBatchIdAndAttendanceDate(bId.intValue(), currentD)
                                    .stream()
                                    .filter(a -> a.getStudentId().equals(req.getUserId().intValue()))
                                    .findFirst()
                                    .orElseGet(() -> {
                                        TrainerMarkedAttendance newAtt = new TrainerMarkedAttendance();
                                        newAtt.setBatchId(bId.intValue());
                                        newAtt.setStudentId(req.getUserId().intValue());
                                        newAtt.setAttendanceDate(currentD);
                                        newAtt.setStatus("UNMARKED"); // default for future dates
                                        return newAtt;
                                    });

                            if ("ONLINE".equalsIgnoreCase(req.getRequestType())) {
                                att.setApprovedOnline(true);
                                // ✅ LATEST WINS: If Online is approved latest, reset status to allow trainer marking
                                att.setStatus("UNMARKED"); 
                            } else {
                                att.setStatus("LEAVE");
                                // ✅ LATEST WINS: If Leave is approved latest, disable remote attendance marking
                                att.setApprovedOnline(false);
                            }
                            attendanceRepo.save(att);
                        }
                    }
                }
            } catch (Exception e) {
                System.out.println("Error auto-syncing attendance: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(Map.of("status", "success", "message", "Leave request " + status.toLowerCase() + "."));
    }

    /** DELETE /api/leave/request/{id} — User can delete within 5 hours */
    @DeleteMapping("/api/leave/request/{id}")
    public ResponseEntity<?> deleteRequest(@PathVariable Long id, Authentication auth) {
        User user = getUser(auth);
        LeaveRequest req = leaveRepo.findById(id).orElse(null);
        if (req == null) return ResponseEntity.notFound().build();

        // Must be the owner
        if (!req.getUserId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden: You can only delete your own requests."));
        }

        // Status check - only pending or mistakenly sent
        if (!"PENDING".equalsIgnoreCase(req.getStatus())) {
            return ResponseEntity.status(400).body(Map.of("message", "Cannot delete a request that has already been processed."));
        }

        // 5-hour rule
        long hoursPassed = Duration.between(req.getCreatedAt(), LocalDateTime.now()).toHours();
        if (hoursPassed >= 5) {
            return ResponseEntity.status(400).body(Map.of("message", "Deletion period has expired (5 hours limit)."));
        }

        leaveRepo.delete(req);
        return ResponseEntity.ok(Map.of("message", "Leave request deleted successfully."));
    }

    private List<Map<String, Object>> enrichLeaves(List<LeaveRequest> list) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (LeaveRequest r : list) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id",           r.getId());
            dto.put("userId",       r.getUserId());
            dto.put("batchId",      r.getBatchId());
            dto.put("courses",      r.getCourses());
            dto.put("batches",      r.getBatches());
            dto.put("courseMode",   r.getCourseMode());
            dto.put("requestType",  r.getRequestType());
            dto.put("leaveCategory", r.getLeaveCategory());
            dto.put("fromDate",     r.getFromDate());
            dto.put("toDate",       r.getToDate());
            dto.put("reason",       r.getReason());
            dto.put("status",       r.getStatus());
            dto.put("approvalNote", r.getApprovalNote());
            dto.put("createdAt",    r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);
            userRepo.findById(r.getUserId()).ifPresent(u -> {
                dto.put("userName",  u.getName());
                dto.put("userEmail", u.getEmail());
                dto.put("userRole",  u.getRole() != null ? u.getRole().getRoleName() : null);
            });
            dto.put("hasDocument", r.getDocumentFilePath() != null);
            dto.put("documentName", r.getDocumentFileName());
            result.add(dto);
        }
        return result;
    }

    private User getUser(Authentication auth) {
        return userRepo.findByEmail(auth.getName()).orElseThrow(() -> new RuntimeException("User not found"));
    }
}

package com.lms.controller;

import com.lms.entity.CounselingSession;
import com.lms.entity.User;
import com.lms.repository.CounselingSessionRepository;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequiredArgsConstructor
public class CounselingController {

    private final CounselingSessionRepository sessionRepo;
    private final UserRepository userRepo;

    // ─────────────── COUNSELOR ENDPOINTS ─────────────────────────────

    /** GET /api/counselor/sessions — all assigned sessions */
    @GetMapping("/api/counselor/sessions")
    public ResponseEntity<?> mySessions(Authentication auth) {
        User user = getUser(auth);
        List<CounselingSession> list = sessionRepo.findByCounselorIdOrderByScheduledAtAsc(user.getId());
        return ResponseEntity.ok(Map.of(
            "sessions", enrichSessions(list),
            "pendingCount", sessionRepo.countByCounselorIdAndStatus(user.getId(), "SCHEDULED"),
            "completedCount", sessionRepo.countByCounselorIdAndStatus(user.getId(), "COMPLETED")
        ));
    }

    /** PUT /api/counselor/sessions/{id} — update status, notes, meet link */
    @PutMapping("/api/counselor/sessions/{id}")
    public ResponseEntity<?> updateSession(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        CounselingSession s = sessionRepo.findById(id).orElseThrow(() -> new RuntimeException("Session not found"));
        if (body.containsKey("status")) s.setStatus(str(body, "status"));
        if (body.containsKey("meetingLink")) s.setMeetingLink(str(body, "meetingLink"));
        if (body.containsKey("notes")) s.setNotes(str(body, "notes"));
        if (body.containsKey("actionItems")) s.setActionItems(str(body, "actionItems"));
        if (body.containsKey("nextSessionAt")) {
            s.setNextSessionAt(LocalDateTime.parse(body.get("nextSessionAt").toString()));
        }
        if (body.containsKey("scheduledAt")) {
            s.setScheduledAt(LocalDateTime.parse(body.get("scheduledAt").toString()));
        }
        sessionRepo.save(s);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Session updated."));
    }

    // ─────────────── ADMIN ENDPOINTS ─────────────────────────────

    /** GET /api/admin/counseling — all sessions */
    @GetMapping("/api/admin/counseling")
    public ResponseEntity<?> allSessions() {
        return ResponseEntity.ok(enrichSessions(sessionRepo.findAllByOrderByScheduledAtDesc()));
    }

    /** POST /api/admin/counseling/assign — assign or schedule a session manually */
    @PostMapping("/api/admin/counseling/assign")
    public ResponseEntity<?> assignSession(@RequestBody Map<String, Object> body) {
        CounselingSession s = new CounselingSession();
        s.setStudentId(Long.parseLong(body.get("studentId").toString()));
        s.setCounselorId(Long.parseLong(body.get("counselorId").toString()));
        s.setType(str(body, "type"));
        if (body.get("scheduledAt") != null) {
            s.setScheduledAt(LocalDateTime.parse(body.get("scheduledAt").toString()));
        }
        s.setMeetingLink(str(body, "meetingLink"));
        s.setNotes(str(body, "notes"));
        sessionRepo.save(s);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Session scheduled."));
    }

    // ─────────────── STUDENT ENDPOINTS ─────────────────────────────

    /** GET /api/student/counseling — my sessions */
    @GetMapping("/api/student/counseling")
    public ResponseEntity<?> studentSessions(Authentication auth) {
        User user = getUser(auth);
        return ResponseEntity.ok(enrichSessions(sessionRepo.findByStudentIdOrderByScheduledAtDesc(user.getId())));
    }

    /** POST /api/student/counseling/book — student books a session */
    @PostMapping("/api/student/counseling/book")
    public ResponseEntity<?> bookSession(@RequestBody Map<String, Object> body, Authentication auth) {
        User user = getUser(auth);
        CounselingSession s = new CounselingSession();
        s.setStudentId(user.getId());
        // Auto-assign to first available counselor (or keep 0 to let admin assign)
        User counselor = userRepo.findByRole_RoleName("COUNSELOR").stream().findFirst().orElseThrow(() -> new RuntimeException("No counselor available."));
        s.setCounselorId(counselor.getId());
        s.setType(str(body, "type") != null ? str(body, "type") : "ROUTINE");
        s.setNotes(str(body, "notes"));
        s.setScheduledAt(LocalDateTime.parse(body.get("requestedDate").toString()));
        sessionRepo.save(s);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Counseling session requested."));
    }

    // ─────────────── HELPERS ─────────────────────────────

    private List<Map<String, Object>> enrichSessions(List<CounselingSession> list) {
        List<Map<String, Object>> res = new ArrayList<>();
        for (CounselingSession s : list) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", s.getId());
            dto.put("studentId", s.getStudentId());
            dto.put("counselorId", s.getCounselorId());
            dto.put("scheduledAt", s.getScheduledAt());
            dto.put("type", s.getType());
            dto.put("status", s.getStatus());
            dto.put("meetingLink", s.getMeetingLink());
            dto.put("notes", s.getNotes());
            dto.put("actionItems", s.getActionItems());
            dto.put("nextSessionAt", s.getNextSessionAt());
            
            userRepo.findById(s.getStudentId()).ifPresent(u -> {
                dto.put("studentName", u.getName());
                dto.put("studentEmail", u.getEmail());
            });
            userRepo.findById(s.getCounselorId()).ifPresent(c -> dto.put("counselorName", c.getName()));
            res.add(dto);
        }
        return res;
    }

    private User getUser(Authentication auth) {
        return userRepo.findByEmail(auth.getName()).orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String str(Map<String, Object> body, String key) {
        return body.get(key) != null ? body.get(key).toString() : null;
    }
}

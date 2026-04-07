package com.lms.controller;

import com.lms.entity.Announcement;
import com.lms.entity.User;
import com.lms.enums.Status;
import com.lms.repository.AnnouncementRepository;
import com.lms.repository.UserRepository;
import com.lms.repository.BatchRepository;
import com.lms.repository.StudentBatchesRepository;
import com.lms.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementRepository announcementRepo;
    private final UserRepository userRepo;
    private final StudentBatchesRepository studentBatchesRepo;
    private final BatchRepository batchRepo;
    private final NotificationService notificationService;

    /** GET /api/announcements — active announcements for the authenticated user */
    @GetMapping("/api/announcements")
    public ResponseEntity<?> getAnnouncements(Authentication auth) {
        User user = getUser(auth);
        List<Announcement> all = announcementRepo.findActiveAnnouncements();
        String role = user.getRole() != null ? user.getRole().getRoleName().toUpperCase() : "";

        // Fetch student's enrolled batch IDs
        List<Long> studentBatchIds = new ArrayList<>();
        if ("STUDENT".equals(role)) {
            studentBatchesRepo.findByStudent_Id(user.getId()).forEach(sb -> {
                if (sb.getBatch() != null) studentBatchIds.add(sb.getBatch().getId());
            });
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Announcement a : all) {
            boolean isTargeted = false;
            String tr = a.getTargetRoles() != null ? a.getTargetRoles() : "[]";

            // 1. Role / individual user targeting (strict quoted matching)
            if (tr.contains("\"ALL\"")
                    || tr.contains("\"ROLE_" + role + "\"")
                    || tr.contains("\"" + role + "\"")
                    || tr.contains("\"USER_" + user.getId() + "\"")) {
                isTargeted = true;
            }

            // 2. Legacy single-batchId targeting (backward compatibility)
            if (!isTargeted && "STUDENT".equals(role) && a.getBatchId() != null) {
                if (studentBatchIds.contains(a.getBatchId())) {
                    isTargeted = true;
                }
            }

            // 3. Multi-batch targeting via BATCH_X entries in targetRoles
            if (!isTargeted && "STUDENT".equals(role)) {
                for (Long bid : studentBatchIds) {
                    if (tr.contains("\"BATCH_" + bid + "\"")) {
                        isTargeted = true;
                        break;
                    }
                }
            }

            if (isTargeted) {
                result.add(toDto(a));
            }
        }
        return ResponseEntity.ok(result);
    }

    /** GET /api/admin/announcements — all announcements (admin view) */
    @GetMapping("/api/admin/announcements")
    public ResponseEntity<?> adminGetAll() {
        List<Announcement> all = announcementRepo.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Announcement a : all) result.add(toDto(a));
        return ResponseEntity.ok(result);
    }

    /** POST /api/admin/announcements — create and return recipient breakdown */
    @PostMapping("/api/admin/announcements")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, Authentication auth) {
        User user = getUser(auth);
        Announcement a = new Announcement();
        a.setTitle(str(body, "title"));
        a.setContent(str(body, "content"));
        a.setTargetRoles(body.get("targetRoles") != null ? body.get("targetRoles").toString() : null);
        a.setIsPopup(body.get("isPopup") != null && Boolean.parseBoolean(body.get("isPopup").toString()));
        // batchId kept for legacy; new multi-batch uses BATCH_X in targetRoles
        if (body.get("batchId") != null && !body.get("batchId").toString().isEmpty()) {
            try { a.setBatchId(Long.parseLong(body.get("batchId").toString())); } catch (NumberFormatException ignored) {}
        }
        if (body.get("link") != null && !body.get("link").toString().isEmpty()) {
            a.setLink(body.get("link").toString());
        }
        if (body.get("expiresAt") != null && !body.get("expiresAt").toString().isEmpty()) {
            try { a.setExpiresAt(LocalDateTime.parse(body.get("expiresAt").toString())); } catch (Exception ignored) {}
        }
        a.setCreatedBy(user.getId());
        announcementRepo.save(a);

        // Fire notifications to all targeted recipients
        fireAnnouncementNotifications(a);

        Map<String, Object> recipients = buildRecipientSummary(a.getTargetRoles());
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Announcement posted.",
                "id", a.getId(),
                "recipients", recipients
        ));
    }

    /** PUT /api/admin/announcements/{id} — update */
    @PutMapping("/api/admin/announcements/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Announcement a = announcementRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));
        if (body.containsKey("title"))       a.setTitle(str(body, "title"));
        if (body.containsKey("content"))     a.setContent(str(body, "content"));
        if (body.containsKey("targetRoles")) a.setTargetRoles(body.get("targetRoles").toString());
        if (body.containsKey("batchId")) {
            String bv = body.get("batchId") != null ? body.get("batchId").toString().trim() : "";
            a.setBatchId(bv.isEmpty() ? null : Long.parseLong(bv));
        }
        if (body.containsKey("link"))    a.setLink(body.get("link") != null ? body.get("link").toString() : null);
        if (body.containsKey("isPopup")) a.setIsPopup(Boolean.parseBoolean(body.get("isPopup").toString()));
        if (body.containsKey("expiresAt") && body.get("expiresAt") != null && !body.get("expiresAt").toString().isEmpty()) {
            try { a.setExpiresAt(LocalDateTime.parse(body.get("expiresAt").toString())); } catch (Exception ignored) {}
        }
        announcementRepo.save(a);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Updated."));
    }

    /** DELETE /api/admin/announcements/{id} */
    @DeleteMapping("/api/admin/announcements/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        announcementRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Deleted."));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Creates notification records for every recipient targeted by this announcement.
     * Role-wide targets → one notification per role.
     * BATCH_X targets   → one STUDENT notification (if not already created by role).
     * USER_X targets    → one per-user notification (only if not already covered by role).
     */
    private void fireAnnouncementNotifications(Announcement a) {
        String tr = a.getTargetRoles();
        if (tr == null || tr.isEmpty()) return;

        String notifMsg = "📢 New Announcement: " + a.getTitle();
        Long annId = a.getId();
        Set<String> notifiedRoles = new HashSet<>();

        // 1. ALL roles
        if (tr.contains("\"ALL\"")) {
            for (String r : new String[]{"STUDENT", "TRAINER", "COUNSELOR", "MARKETER", "ADMIN", "SUPERADMIN"}) {
                notificationService.createNotification(notifMsg, "ANNOUNCEMENT", r, annId);
            }
            return;
        }

        // 2. Specific roles
        String[][] roleMap = {
            {"ROLE_STUDENT",    "STUDENT"},
            {"ROLE_TRAINER",    "TRAINER"},
            {"ROLE_COUNSELOR",  "COUNSELOR"},
            {"ROLE_MARKETER",   "MARKETER"},
            {"ROLE_ADMIN",      "ADMIN"},
            {"ROLE_SUPERADMIN", "SUPERADMIN"}
        };
        for (String[] rm : roleMap) {
            if (tr.contains("\"" + rm[0] + "\"") || tr.contains("\"" + rm[1] + "\"")) {
                notificationService.createNotification(notifMsg, "ANNOUNCEMENT", rm[1], annId);
                notifiedRoles.add(rm[1]);
            }
        }

        // 3. Batch targets → student-role notification (if student not already notified)
        Pattern batchPat = Pattern.compile("\"BATCH_(\\d+)\"");
        if (batchPat.matcher(tr).find() && !notifiedRoles.contains("STUDENT")) {
            notificationService.createNotification(notifMsg, "ANNOUNCEMENT", "STUDENT", annId);
            notifiedRoles.add("STUDENT");
        }

        // 4. Individual USER_X → per-user notification (only if their role isn't already covered)
        Pattern userPat = Pattern.compile("\"USER_(\\d+)\"");
        Matcher userMatcher = userPat.matcher(tr);
        while (userMatcher.find()) {
            Long userId = Long.parseLong(userMatcher.group(1));
            userRepo.findById(userId).ifPresent(u -> {
                String userRole = u.getRole() != null ? u.getRole().getRoleName().toUpperCase() : "STUDENT";
                if (!notifiedRoles.contains(userRole)) {
                    notificationService.createNotificationForUser(notifMsg, "ANNOUNCEMENT", userRole, userId, annId);
                }
            });
        }
    }

    /** Builds a recipient count breakdown from a targetRoles JSON string. */
    private Map<String, Object> buildRecipientSummary(String targetRolesStr) {
        Map<String, Object> summary = new LinkedHashMap<>();
        if (targetRolesStr == null || targetRolesStr.isEmpty()) return summary;

        // ALL users
        if (targetRolesStr.contains("\"ALL\"")) {
            long total = userRepo.count();
            summary.put("ALL", total);
            summary.put("total", total);
            return summary;
        }

        long total = 0;

        // Role-based counts
        String[][] roleMap = {
            {"ROLE_STUDENT",    "STUDENT"},
            {"ROLE_TRAINER",    "TRAINER"},
            {"ROLE_COUNSELOR",  "COUNSELOR"},
            {"ROLE_MARKETER",   "MARKETER"},
            {"ROLE_ADMIN",      "ADMIN"},
            {"ROLE_SUPERADMIN", "SUPERADMIN"}
        };
        for (String[] rm : roleMap) {
            if (targetRolesStr.contains("\"" + rm[0] + "\"")
                    || targetRolesStr.contains("\"" + rm[1] + "\"")) {
                long count = userRepo.countByRole_RoleNameAndStatus(rm[1], Status.ACTIVE);
                summary.put(rm[1], count);
                total += count;
            }
        }

        // Batch-based counts (BATCH_X entries)
        Pattern batchPat = Pattern.compile("\"BATCH_(\\d+)\"");
        Matcher batchMatcher = batchPat.matcher(targetRolesStr);
        Map<String, Long> batchSummary = new LinkedHashMap<>();
        Set<Long> seenStudents = new HashSet<>();
        while (batchMatcher.find()) {
            Long batchId = Long.parseLong(batchMatcher.group(1));
            List<com.lms.entity.StudentBatches> sbs = studentBatchesRepo.findByBatch_Id(batchId);
            long batchCount = sbs.stream()
                    .filter(sb -> sb.getStudent() != null && seenStudents.add(sb.getStudent().getId()))
                    .count();
            batchRepo.findById(batchId).ifPresent(b ->
                    batchSummary.put(b.getBatchName() + " (" + b.getBatchId() + ")", batchCount));
            total += batchCount;
        }
        if (!batchSummary.isEmpty()) summary.put("batches", batchSummary);

        // Individual user counts
        Pattern userPat = Pattern.compile("\"USER_(\\d+)\"");
        Matcher userMatcher = userPat.matcher(targetRolesStr);
        long indivCount = 0;
        while (userMatcher.find()) indivCount++;
        if (indivCount > 0) {
            summary.put("individuals", indivCount);
            total += indivCount;
        }

        summary.put("total", total);
        return summary;
    }

    private Map<String, Object> toDto(Announcement a) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id",          a.getId());
        dto.put("title",       a.getTitle());
        dto.put("content",     a.getContent());
        dto.put("targetRoles", a.getTargetRoles());
        dto.put("batchId",     a.getBatchId());
        dto.put("link",        a.getLink());
        dto.put("isPopup",     a.getIsPopup());
        if (a.getBatchId() != null) {
            batchRepo.findById(a.getBatchId())
                    .ifPresent(b -> dto.put("batchName", b.getBatchName()));
        }
        dto.put("createdAt",   a.getCreatedAt());
        dto.put("expiresAt",   a.getExpiresAt());
        userRepo.findById(a.getCreatedBy() != null ? a.getCreatedBy() : 0L)
                .ifPresent(u -> dto.put("createdByName", u.getName()));
        return dto;
    }

    private User getUser(Authentication auth) {
        return userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String str(Map<String, Object> body, String key) {
        return body.get(key) != null ? body.get(key).toString() : null;
    }
}

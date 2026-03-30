package com.lms.controller;

import com.lms.entity.Announcement;
import com.lms.entity.User;
import com.lms.repository.AnnouncementRepository;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementRepository announcementRepo;
    private final UserRepository userRepo;

    /** GET /api/announcements — all active (for authenticated user) */
    @GetMapping("/api/announcements")
    public ResponseEntity<?> getAnnouncements(Authentication auth) {
        User user = getUser(auth);
        List<Announcement> all = announcementRepo.findActiveAnnouncements();
        String role = user.getRole() != null ? user.getRole().getRoleName().toUpperCase() : "";
        List<Map<String, Object>> result = new ArrayList<>();
        for (Announcement a : all) {
            if (a.getTargetRoles() == null) {
                result.add(toDto(a));
                continue;
            }
            
            String tr = a.getTargetRoles();
            if (tr.contains("\"ALL\"") || tr.contains("ALL")
                || tr.contains("\"ROLE_" + role + "\"")
                || tr.contains("\"USER_" + user.getId() + "\"")
                || tr.contains("\"" + role + "\"")) { // legacy fallback
                result.add(toDto(a));
            }
        }
        return ResponseEntity.ok(result);
    }

    /** GET /api/admin/announcements — all announcements */
    @GetMapping("/api/admin/announcements")
    public ResponseEntity<?> adminGetAll() {
        List<Announcement> all = announcementRepo.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Announcement a : all) result.add(toDto(a));
        return ResponseEntity.ok(result);
    }

    /** POST /api/admin/announcements — create */
    @PostMapping("/api/admin/announcements")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, Authentication auth) {
        User user = getUser(auth);
        Announcement a = new Announcement();
        a.setTitle(str(body, "title"));
        a.setContent(str(body, "content"));
        a.setTargetRoles(body.get("targetRoles") != null ? body.get("targetRoles").toString() : null);
        a.setIsPopup(body.get("isPopup") != null && Boolean.parseBoolean(body.get("isPopup").toString()));
        if (body.get("batchId") != null) a.setBatchId(Long.parseLong(body.get("batchId").toString()));
        if (body.get("expiresAt") != null) a.setExpiresAt(LocalDateTime.parse(body.get("expiresAt").toString()));
        a.setCreatedBy(user.getId());
        announcementRepo.save(a);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Announcement posted.", "id", a.getId()));
    }

    /** PUT /api/admin/announcements/{id} — update */
    @PutMapping("/api/admin/announcements/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Announcement a = announcementRepo.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        if (body.containsKey("title"))      a.setTitle(str(body, "title"));
        if (body.containsKey("content"))    a.setContent(str(body, "content"));
        if (body.containsKey("targetRoles")) a.setTargetRoles(body.get("targetRoles").toString());
        if (body.containsKey("isPopup"))    a.setIsPopup(Boolean.parseBoolean(body.get("isPopup").toString()));
        announcementRepo.save(a);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Updated."));
    }

    /** DELETE /api/admin/announcements/{id} */
    @DeleteMapping("/api/admin/announcements/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        announcementRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Deleted."));
    }

    private Map<String, Object> toDto(Announcement a) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id",          a.getId());
        dto.put("title",       a.getTitle());
        dto.put("content",     a.getContent());
        dto.put("targetRoles", a.getTargetRoles());
        dto.put("batchId",     a.getBatchId());
        dto.put("isPopup",     a.getIsPopup());
        dto.put("createdAt",   a.getCreatedAt());
        dto.put("expiresAt",   a.getExpiresAt());
        userRepo.findById(a.getCreatedBy() != null ? a.getCreatedBy() : 0L)
                .ifPresent(u -> dto.put("createdByName", u.getName()));
        return dto;
    }

    private User getUser(Authentication auth) {
        return userRepo.findByEmail(auth.getName()).orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String str(Map<String, Object> body, String key) {
        return body.get(key) != null ? body.get(key).toString() : null;
    }
}

package com.lms.controller;

import com.lms.entity.Lead;
import com.lms.entity.User;
import com.lms.repository.LeadRepository;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class LeadController {

    private final LeadRepository leadRepo;
    private final UserRepository userRepo;

    /** GET /api/marketer/leads — all leads (marketer sees everything to manage & assign) */
    @GetMapping("/api/marketer/leads")
    public ResponseEntity<?> allLeads(Authentication auth) {
        return ResponseEntity.ok(enrichLeads(leadRepo.findAllByOrderByCreatedAtDesc()));
    }

    /** GET /api/admin/leads — all leads (for super admin/admin) */
    @GetMapping("/api/admin/leads")
    public ResponseEntity<?> adminLeads() {
        return ResponseEntity.ok(enrichLeads(leadRepo.findAllByOrderByCreatedAtDesc()));
    }

    /** GET /api/marketer/stats — dashboard statistics */
    @GetMapping("/api/marketer/stats")
    public ResponseEntity<?> marketerStats(Authentication auth) {
        long total      = leadRepo.count();
        long newL       = leadRepo.countByStatus("NEW");
        long contacted  = leadRepo.countByStatus("CONTACTED");
        long interested = leadRepo.countByStatus("INTERESTED");
        long demoBooked = leadRepo.countByStatus("DEMO_BOOKED");
        long enrolled   = leadRepo.countByStatus("ENROLLED");
        long lost       = leadRepo.countByStatus("LOST");

        double convRate = total > 0 ? (enrolled * 100.0 / total) : 0;

        // Leads by source
        List<Object[]> sourceData = leadRepo.countBySource();
        Map<String, Long> bySource = new LinkedHashMap<>();
        for (Object[] row : sourceData) {
            bySource.put(row[0] != null ? row[0].toString() : "UNKNOWN", ((Number) row[1]).longValue());
        }

        // Counselors with their lead counts
        List<User> counselors = userRepo.findByRole_RoleName("COUNSELOR");
        List<Map<String, Object>> counselorStats = new ArrayList<>();
        for (User c : counselors) {
            Map<String, Object> cs = new LinkedHashMap<>();
            cs.put("id", c.getId());
            cs.put("name", c.getName());
            cs.put("totalAssigned", leadRepo.countByAssignedCounselorId(c.getId()));
            cs.put("enrolled", leadRepo.countByAssignedCounselorIdAndStatus(c.getId(), "ENROLLED"));
            counselorStats.add(cs);
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("totalLeads", total);
        res.put("newLeads", newL);
        res.put("contacted", contacted);
        res.put("interested", interested);
        res.put("demoBooked", demoBooked);
        res.put("enrolled", enrolled);
        res.put("lost", lost);
        res.put("conversionRate", Math.round(convRate * 10.0) / 10.0);
        res.put("bySource", bySource);
        res.put("counselorStats", counselorStats);
        return ResponseEntity.ok(res);
    }

    /** GET /api/marketer/counselors — list all counselors (for assignment dropdown) */
    @GetMapping("/api/marketer/counselors")
    public ResponseEntity<?> listCounselors() {
        List<User> counselors = userRepo.findByRole_RoleName("COUNSELOR");
        List<Map<String, Object>> result = counselors.stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            m.put("assignedCount", leadRepo.countByAssignedCounselorId(u.getId()));
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** POST /api/marketer/leads — create new lead */
    @PostMapping("/api/marketer/leads")
    public ResponseEntity<?> createLead(@RequestBody Map<String, Object> body, Authentication auth) {
        User user = getUser(auth);
        Lead lead = mapToLead(new Lead(), body);
        lead.setAssignedTo(user.getId());
        leadRepo.save(lead);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Lead added successfully.", "id", lead.getId()));
    }

    /** PUT /api/marketer/leads/{id} — update lead details */
    @PutMapping("/api/marketer/leads/{id}")
    public ResponseEntity<?> updateLead(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Lead lead = leadRepo.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
        mapToLead(lead, body);
        if (body.containsKey("status")) {
            String status = str(body, "status");
            lead.setStatus(status);
            if ("ENROLLED".equals(status) && lead.getConvertedAt() == null) {
                lead.setConvertedAt(LocalDateTime.now());
            }
        }
        leadRepo.save(lead);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Lead updated successfully."));
    }

    /** PUT /api/marketer/leads/{id}/assign — assign lead to a counselor */
    @PutMapping("/api/marketer/leads/{id}/assign")
    public ResponseEntity<?> assignToCounselor(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Lead lead = leadRepo.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
        Long counselorId = Long.parseLong(body.get("counselorId").toString());
        lead.setAssignedCounselorId(counselorId);
        leadRepo.save(lead);
        String counselorName = userRepo.findById(counselorId).map(User::getName).orElse("Counselor");
        return ResponseEntity.ok(Map.of("status", "success", "message", "Lead assigned to " + counselorName));
    }

    /** POST /api/marketer/leads/bulk-assign — bulk assign leads to a counselor */
    @PostMapping("/api/marketer/leads/bulk-assign")
    public ResponseEntity<?> bulkAssign(@RequestBody Map<String, Object> body) {
        Long counselorId = Long.parseLong(body.get("counselorId").toString());
        @SuppressWarnings("unchecked")
        List<Integer> leadIds = (List<Integer>) body.get("leadIds");
        int count = 0;
        for (Integer lid : leadIds) {
            leadRepo.findById(lid.longValue()).ifPresent(lead -> {
                lead.setAssignedCounselorId(counselorId);
                leadRepo.save(lead);
            });
            count++;
        }
        return ResponseEntity.ok(Map.of("status", "success", "message", count + " leads assigned."));
    }

    /** DELETE /api/admin/leads/{id} */
    @DeleteMapping("/api/admin/leads/{id}")
    public ResponseEntity<?> deleteLead(@PathVariable Long id) {
        leadRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    // ─────────────── HELPERS ─────────────────────────────

    private Lead mapToLead(Lead lead, Map<String, Object> body) {
        if (body.containsKey("name")) lead.setName(str(body, "name"));
        if (body.containsKey("email")) lead.setEmail(str(body, "email"));
        if (body.containsKey("phone")) lead.setPhone(str(body, "phone"));
        if (body.containsKey("whatsappNumber")) lead.setWhatsappNumber(str(body, "whatsappNumber"));
        if (body.containsKey("courseInterest")) lead.setCourseInterest(str(body, "courseInterest"));
        if (body.containsKey("source")) lead.setSource(str(body, "source"));
        if (body.containsKey("priority")) lead.setPriority(str(body, "priority"));
        if (body.containsKey("notes")) lead.setNotes(str(body, "notes"));
        if (body.containsKey("campaignId") && body.get("campaignId") != null) {
            lead.setCampaignId(Long.parseLong(body.get("campaignId").toString()));
        }
        if (body.containsKey("assignedCounselorId") && body.get("assignedCounselorId") != null) {
            lead.setAssignedCounselorId(Long.parseLong(body.get("assignedCounselorId").toString()));
        }
        if (body.containsKey("nextFollowupDate") && body.get("nextFollowupDate") != null) {
            lead.setNextFollowupDate(LocalDate.parse(body.get("nextFollowupDate").toString()));
        }
        return lead;
    }

    private List<Map<String, Object>> enrichLeads(List<Lead> leads) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Lead l : leads) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", l.getId());
            dto.put("name", l.getName());
            dto.put("email", l.getEmail());
            dto.put("phone", l.getPhone());
            dto.put("whatsappNumber", l.getWhatsappNumber() != null ? l.getWhatsappNumber() : l.getPhone());
            dto.put("courseInterest", l.getCourseInterest());
            dto.put("source", l.getSource());
            dto.put("status", l.getStatus());
            dto.put("priority", l.getPriority());
            dto.put("assignedTo", l.getAssignedTo());
            dto.put("assignedCounselorId", l.getAssignedCounselorId());
            dto.put("campaignId", l.getCampaignId());
            dto.put("nextFollowupDate", l.getNextFollowupDate());
            dto.put("lastContactedAt", l.getLastContactedAt());
            dto.put("demoScheduledAt", l.getDemoScheduledAt());
            dto.put("notes", l.getNotes());
            dto.put("createdAt", l.getCreatedAt());
            dto.put("convertedAt", l.getConvertedAt());
            if (l.getAssignedTo() != null) {
                userRepo.findById(l.getAssignedTo()).ifPresent(u -> dto.put("marketerName", u.getName()));
            }
            if (l.getAssignedCounselorId() != null) {
                userRepo.findById(l.getAssignedCounselorId()).ifPresent(u -> dto.put("counselorName", u.getName()));
            }
            result.add(dto);
        }
        return result;
    }

    private User getUser(Authentication auth) {
        return userRepo.findByEmail(auth.getName()).orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String str(Map<String, Object> body, String key) {
        return body.get(key) != null ? body.get(key).toString() : null;
    }
}

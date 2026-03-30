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

@RestController
@RequiredArgsConstructor
public class LeadController {

    private final LeadRepository leadRepo;
    private final UserRepository userRepo;

    /** GET /api/marketer/leads — all assigned leads */
    @GetMapping("/api/marketer/leads")
    public ResponseEntity<?> myLeads(Authentication auth) {
        User user = getUser(auth);
        return ResponseEntity.ok(enrichLeads(leadRepo.findByAssignedToOrderByCreatedAtDesc(user.getId())));
    }

    /** GET /api/admin/leads — all leads (for super admin/admin) */
    @GetMapping("/api/admin/leads")
    public ResponseEntity<?> allLeads() {
        return ResponseEntity.ok(enrichLeads(leadRepo.findAllByOrderByCreatedAtDesc()));
    }

    /** POST /api/marketer/leads — create new lead */
    @PostMapping("/api/marketer/leads")
    public ResponseEntity<?> createLead(@RequestBody Map<String, Object> body, Authentication auth) {
        User user = getUser(auth);
        Lead lead = new Lead();
        lead.setName(str(body, "name"));
        lead.setEmail(str(body, "email"));
        lead.setPhone(str(body, "phone"));
        lead.setCourseInterest(str(body, "courseInterest"));
        lead.setSource(str(body, "source"));
        lead.setNotes(str(body, "notes"));
        lead.setPriority(str(body, "priority") != null ? str(body, "priority") : "MEDIUM");
        lead.setAssignedTo(user.getId());
        if (body.get("nextFollowupDate") != null) {
            lead.setNextFollowupDate(LocalDate.parse(body.get("nextFollowupDate").toString()));
        }
        leadRepo.save(lead);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Lead added successfully.", "id", lead.getId()));
    }

    /** PUT /api/marketer/leads/{id} — update lead */
    @PutMapping("/api/marketer/leads/{id}")
    public ResponseEntity<?> updateLead(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Lead lead = leadRepo.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
        
        if (body.containsKey("name")) lead.setName(str(body, "name"));
        if (body.containsKey("email")) lead.setEmail(str(body, "email"));
        if (body.containsKey("phone")) lead.setPhone(str(body, "phone"));
        if (body.containsKey("courseInterest")) lead.setCourseInterest(str(body, "courseInterest"));
        if (body.containsKey("source")) lead.setSource(str(body, "source"));
        if (body.containsKey("notes")) lead.setNotes(str(body, "notes"));
        if (body.containsKey("priority")) lead.setPriority(str(body, "priority"));
        if (body.containsKey("nextFollowupDate")) {
            lead.setNextFollowupDate(LocalDate.parse(body.get("nextFollowupDate").toString()));
        }

        if (body.containsKey("status")) {
            String status = str(body, "status");
            lead.setStatus(status);
            if ("CONVERTED".equals(status) && lead.getConvertedAt() == null) {
                lead.setConvertedAt(LocalDateTime.now());
            }
        }
        
        leadRepo.save(lead);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Lead updated successfully."));
    }

    /** DELETE /api/admin/leads/{id} */
    @DeleteMapping("/api/admin/leads/{id}")
    public ResponseEntity<?> deleteLead(@PathVariable Long id) {
        leadRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    private List<Map<String, Object>> enrichLeads(List<Lead> leads) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Lead l : leads) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", l.getId());
            dto.put("name", l.getName());
            dto.put("email", l.getEmail());
            dto.put("phone", l.getPhone());
            dto.put("courseInterest", l.getCourseInterest());
            dto.put("source", l.getSource());
            dto.put("status", l.getStatus());
            dto.put("priority", l.getPriority());
            dto.put("assignedTo", l.getAssignedTo());
            dto.put("nextFollowupDate", l.getNextFollowupDate());
            dto.put("notes", l.getNotes());
            dto.put("createdAt", l.getCreatedAt());
            dto.put("convertedAt", l.getConvertedAt());
            
            if (l.getAssignedTo() != null) {
                userRepo.findById(l.getAssignedTo()).ifPresent(u -> dto.put("assignedToName", u.getName()));
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

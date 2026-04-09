package com.lms.controller;

import com.lms.entity.Lead;
import com.lms.entity.LeadNote;
import com.lms.entity.User;
import com.lms.repository.LeadNoteRepository;
import com.lms.repository.LeadRepository;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Counselor Lead Management Controller
 * Counselors call prospects, update pipeline status, log notes, schedule callbacks.
 * Marketer generates leads → assigns to counselor → counselor converts to enrollment.
 */
@RestController
@RequiredArgsConstructor
public class CounselingController {

    private final LeadRepository leadRepo;
    private final LeadNoteRepository noteRepo;
    private final UserRepository userRepo;

    // ─────────────── COUNSELOR DASHBOARD ─────────────────────────────

    /** GET /api/counselor/dashboard — stats summary for counselor */
    @GetMapping("/api/counselor/dashboard")
    public ResponseEntity<?> dashboard(Authentication auth) {
        User user = getUser(auth);
        Long cid = user.getId();

        long totalAssigned  = leadRepo.countByAssignedCounselorId(cid);
        long newLeads       = leadRepo.countByAssignedCounselorIdAndStatus(cid, "NEW");
        long contacted      = leadRepo.countByAssignedCounselorIdAndStatus(cid, "CONTACTED");
        long interested     = leadRepo.countByAssignedCounselorIdAndStatus(cid, "INTERESTED");
        long demoBooked     = leadRepo.countByAssignedCounselorIdAndStatus(cid, "DEMO_BOOKED");
        long enrolled       = leadRepo.countByAssignedCounselorIdAndStatus(cid, "ENROLLED");
        long lost           = leadRepo.countByAssignedCounselorIdAndStatus(cid, "LOST");

        List<Lead> todayFollowups = leadRepo.findByAssignedCounselorIdAndNextFollowupDate(cid, LocalDate.now());

        long callsToday = noteRepo.countByCounselorIdAndCreatedAtAfter(cid,
                LocalDate.now().atStartOfDay());

        double convRate = totalAssigned > 0 ? (enrolled * 100.0 / totalAssigned) : 0;

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("totalAssigned", totalAssigned);
        res.put("newLeads", newLeads);
        res.put("contacted", contacted);
        res.put("interested", interested);
        res.put("demoBooked", demoBooked);
        res.put("enrolled", enrolled);
        res.put("lost", lost);
        res.put("callsToday", callsToday);
        res.put("conversionRate", Math.round(convRate * 10.0) / 10.0);
        res.put("todayFollowups", enrichLeads(todayFollowups));
        return ResponseEntity.ok(res);
    }

    // ─────────────── COUNSELOR LEADS ─────────────────────────────

    /** GET /api/counselor/leads — all leads assigned to this counselor */
    @GetMapping("/api/counselor/leads")
    public ResponseEntity<?> myLeads(Authentication auth) {
        User user = getUser(auth);
        List<Lead> leads = leadRepo.findByAssignedCounselorIdOrderByCreatedAtDesc(user.getId());
        return ResponseEntity.ok(enrichLeads(leads));
    }

    /** GET /api/counselor/leads/today — today's follow-up leads */
    @GetMapping("/api/counselor/leads/today")
    public ResponseEntity<?> todayLeads(Authentication auth) {
        User user = getUser(auth);
        List<Lead> leads = leadRepo.findByAssignedCounselorIdAndNextFollowupDate(user.getId(), LocalDate.now());
        return ResponseEntity.ok(enrichLeads(leads));
    }

    /** PUT /api/counselor/leads/{id}/status — change pipeline status */
    @PutMapping("/api/counselor/leads/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Lead lead = leadRepo.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
        String status = str(body, "status");
        lead.setStatus(status);
        lead.setLastContactedAt(LocalDateTime.now());
        if ("ENROLLED".equals(status) && lead.getConvertedAt() == null) {
            lead.setConvertedAt(LocalDateTime.now());
        }
        if ("DEMO_BOOKED".equals(status) && body.get("demoScheduledAt") != null) {
            lead.setDemoScheduledAt(LocalDateTime.parse(body.get("demoScheduledAt").toString()));
        }
        leadRepo.save(lead);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Lead status updated to " + status));
    }

    /** PUT /api/counselor/leads/{id}/followup — set next follow-up date */
    @PutMapping("/api/counselor/leads/{id}/followup")
    public ResponseEntity<?> setFollowup(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Lead lead = leadRepo.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
        if (body.get("nextFollowupDate") != null) {
            lead.setNextFollowupDate(LocalDate.parse(body.get("nextFollowupDate").toString()));
        }
        if (body.get("callbackScheduledAt") != null) {
            lead.setCallbackScheduledAt(LocalDateTime.parse(body.get("callbackScheduledAt").toString()));
        }
        leadRepo.save(lead);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Follow-up scheduled."));
    }

    /** PUT /api/counselor/leads/{id} — general lead update (notes, priority, etc.) */
    @PutMapping("/api/counselor/leads/{id}")
    public ResponseEntity<?> updateLead(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Lead lead = leadRepo.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
        if (body.containsKey("notes")) lead.setNotes(str(body, "notes"));
        if (body.containsKey("priority")) lead.setPriority(str(body, "priority"));
        if (body.containsKey("nextFollowupDate") && body.get("nextFollowupDate") != null) {
            lead.setNextFollowupDate(LocalDate.parse(body.get("nextFollowupDate").toString()));
        }
        if (body.containsKey("whatsappNumber")) lead.setWhatsappNumber(str(body, "whatsappNumber"));
        leadRepo.save(lead);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Lead updated."));
    }

    // ─────────────── CALL NOTES ─────────────────────────────

    /** POST /api/counselor/leads/{id}/notes — log a call note */
    @PostMapping("/api/counselor/leads/{id}/notes")
    public ResponseEntity<?> addNote(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        User user = getUser(auth);
        Lead lead = leadRepo.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));

        LeadNote note = new LeadNote();
        note.setLeadId(id);
        note.setCounselorId(user.getId());
        note.setNoteText(str(body, "noteText"));
        note.setCallOutcome(str(body, "callOutcome"));
        if (body.get("callDurationMinutes") != null) {
            note.setCallDurationMinutes(Integer.parseInt(body.get("callDurationMinutes").toString()));
        }
        noteRepo.save(note);

        // Auto-update lead status & lastContacted
        lead.setLastContactedAt(LocalDateTime.now());
        if ("CONTACTED".equals(lead.getStatus()) || "NEW".equals(lead.getStatus())) {
            if (str(body, "callOutcome") != null && !"NO_ANSWER".equals(str(body, "callOutcome"))
                    && !"BUSY".equals(str(body, "callOutcome"))) {
                lead.setStatus("CONTACTED");
            }
        }
        leadRepo.save(lead);

        return ResponseEntity.ok(Map.of("status", "success", "message", "Note logged successfully."));
    }

    /** GET /api/counselor/leads/{id}/notes — get all notes for a lead */
    @GetMapping("/api/counselor/leads/{id}/notes")
    public ResponseEntity<?> getNotes(@PathVariable Long id) {
        List<LeadNote> notes = noteRepo.findByLeadIdOrderByCreatedAtDesc(id);
        List<Map<String, Object>> result = new ArrayList<>();
        for (LeadNote n : notes) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", n.getId());
            dto.put("noteText", n.getNoteText());
            dto.put("callOutcome", n.getCallOutcome());
            dto.put("callDurationMinutes", n.getCallDurationMinutes());
            dto.put("createdAt", n.getCreatedAt());
            userRepo.findById(n.getCounselorId()).ifPresent(u -> dto.put("counselorName", u.getName()));
            result.add(dto);
        }
        return ResponseEntity.ok(result);
    }

    // ─────────────── HELPERS ─────────────────────────────

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
            dto.put("nextFollowupDate", l.getNextFollowupDate());
            dto.put("lastContactedAt", l.getLastContactedAt());
            dto.put("demoScheduledAt", l.getDemoScheduledAt());
            dto.put("callbackScheduledAt", l.getCallbackScheduledAt());
            dto.put("notes", l.getNotes());
            dto.put("createdAt", l.getCreatedAt());
            dto.put("convertedAt", l.getConvertedAt());
            dto.put("campaignId", l.getCampaignId());
            if (l.getAssignedTo() != null) {
                userRepo.findById(l.getAssignedTo()).ifPresent(u -> dto.put("marketerName", u.getName()));
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

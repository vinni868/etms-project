package com.lms.controller;

import com.lms.entity.Campaign;
import com.lms.entity.User;
import com.lms.repository.CampaignRepository;
import com.lms.repository.LeadRepository;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignRepository campaignRepo;
    private final LeadRepository leadRepo;
    private final UserRepository userRepo;

    /** GET /api/marketer/campaigns — all campaigns */
    @GetMapping("/api/marketer/campaigns")
    public ResponseEntity<?> listCampaigns() {
        List<Campaign> campaigns = campaignRepo.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(enrichCampaigns(campaigns));
    }

    /** POST /api/marketer/campaigns — create campaign */
    @PostMapping("/api/marketer/campaigns")
    public ResponseEntity<?> createCampaign(@RequestBody Map<String, Object> body, Authentication auth) {
        User user = getUser(auth);
        Campaign c = mapToCampaign(new Campaign(), body);
        c.setCreatedBy(user.getId());
        campaignRepo.save(c);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Campaign created.", "id", c.getId()));
    }

    /** PUT /api/marketer/campaigns/{id} — update campaign */
    @PutMapping("/api/marketer/campaigns/{id}")
    public ResponseEntity<?> updateCampaign(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Campaign c = campaignRepo.findById(id).orElseThrow(() -> new RuntimeException("Campaign not found"));
        mapToCampaign(c, body);
        campaignRepo.save(c);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Campaign updated."));
    }

    /** DELETE /api/marketer/campaigns/{id} */
    @DeleteMapping("/api/marketer/campaigns/{id}")
    public ResponseEntity<?> deleteCampaign(@PathVariable Long id) {
        campaignRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    /** GET /api/marketer/campaigns/{id}/stats — stats for a specific campaign */
    @GetMapping("/api/marketer/campaigns/{id}/stats")
    public ResponseEntity<?> campaignStats(@PathVariable Long id) {
        Campaign c = campaignRepo.findById(id).orElseThrow(() -> new RuntimeException("Campaign not found"));
        long totalLeads = leadRepo.countByCampaignId(id);
        long enrolled   = leadRepo.countByAssignedCounselorIdAndStatus(null, "ENROLLED"); // approximation
        double convRate = totalLeads > 0 ? (enrolled * 100.0 / totalLeads) : 0;

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("campaign", enrichCampaign(c));
        res.put("totalLeads", totalLeads);
        res.put("conversionRate", Math.round(convRate * 10.0) / 10.0);
        return ResponseEntity.ok(res);
    }

    // ─── Helpers ─────────────────────────────────────────────────────

    private Campaign mapToCampaign(Campaign c, Map<String, Object> body) {
        if (body.containsKey("name")) c.setName(str(body, "name"));
        if (body.containsKey("description")) c.setDescription(str(body, "description"));
        if (body.containsKey("channel")) c.setChannel(str(body, "channel"));
        if (body.containsKey("status")) c.setStatus(str(body, "status"));
        if (body.containsKey("budgetInr") && body.get("budgetInr") != null) {
            c.setBudgetInr(Double.parseDouble(body.get("budgetInr").toString()));
        }
        if (body.containsKey("targetLeads") && body.get("targetLeads") != null) {
            c.setTargetLeads(Integer.parseInt(body.get("targetLeads").toString()));
        }
        if (body.containsKey("startDate") && body.get("startDate") != null) {
            c.setStartDate(LocalDate.parse(body.get("startDate").toString()));
        }
        if (body.containsKey("endDate") && body.get("endDate") != null) {
            c.setEndDate(LocalDate.parse(body.get("endDate").toString()));
        }
        return c;
    }

    private List<Map<String, Object>> enrichCampaigns(List<Campaign> campaigns) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Campaign c : campaigns) {
            result.add(enrichCampaign(c));
        }
        return result;
    }

    private Map<String, Object> enrichCampaign(Campaign c) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", c.getId());
        dto.put("name", c.getName());
        dto.put("description", c.getDescription());
        dto.put("channel", c.getChannel());
        dto.put("status", c.getStatus());
        dto.put("budgetInr", c.getBudgetInr());
        dto.put("targetLeads", c.getTargetLeads());
        dto.put("startDate", c.getStartDate());
        dto.put("endDate", c.getEndDate());
        dto.put("createdAt", c.getCreatedAt());
        dto.put("leadsCount", leadRepo.countByCampaignId(c.getId()));
        if (c.getCreatedBy() != null) {
            userRepo.findById(c.getCreatedBy()).ifPresent(u -> dto.put("createdByName", u.getName()));
        }
        return dto;
    }

    private User getUser(Authentication auth) {
        return userRepo.findByEmail(auth.getName()).orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String str(Map<String, Object> body, String key) {
        return body.get(key) != null ? body.get(key).toString() : null;
    }
}

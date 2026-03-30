package com.lms.controller;

import com.lms.entity.IdSequence;
import com.lms.repository.IdSequenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Year;
import java.util.List;
import java.util.Map;

/**
 * Admin-accessible controller for viewing and managing the ID sequences.
 * Allows admin to view current counters, reset them, and preview the next ID.
 * Secured under /api/admin/** -> requires ADMIN role.
 */
@RestController
@RequestMapping("/api/admin/id-sequences")
public class AdminIdManagementController {

    @Autowired
    private IdSequenceRepository idSequenceRepository;

    /** Get all current ID sequences */
    @GetMapping("/all")
    public ResponseEntity<List<IdSequence>> getAllSequences() {
        return ResponseEntity.ok(idSequenceRepository.findAll());
    }

    /** Preview what the next ID for a given portal will be (without incrementing) */
    @GetMapping("/preview/{portal}")
    public ResponseEntity<?> previewNextId(@PathVariable String portal) {
        return idSequenceRepository.findByPortal(portal.toUpperCase())
                .map(seq -> {
                    int nextSeq = seq.getCurrentSeq() + 1;
                    String nextId = String.format("%s-%d-%04d", seq.getPrefix(), seq.getYear(), nextSeq);
                    return ResponseEntity.ok(Map.of(
                            "portal", seq.getPortal(),
                            "prefix", seq.getPrefix(),
                            "currentSeq", seq.getCurrentSeq(),
                            "year", seq.getYear(),
                            "nextId", nextId
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Reset a sequence to a specific number */
    @PutMapping("/reset/{portal}")
    public ResponseEntity<?> resetSequence(@PathVariable String portal, @RequestBody Map<String, Object> payload) {
        return idSequenceRepository.findByPortal(portal.toUpperCase())
                .map(seq -> {
                    int newSeq = payload.containsKey("seq") ? Integer.parseInt(payload.get("seq").toString()) : 0;
                    seq.setCurrentSeq(newSeq);
                    // Optionally reset year too
                    if (payload.containsKey("year")) {
                        seq.setYear(Integer.parseInt(payload.get("year").toString()));
                    }
                    seq.setUpdatedAt(java.time.LocalDateTime.now());
                    idSequenceRepository.save(seq);
                    return ResponseEntity.ok(Map.of("message", "Sequence reset successfully", "portal", seq.getPortal(), "newSeq", newSeq));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Update the prefix for a portal */
    @PutMapping("/prefix/{portal}")
    public ResponseEntity<?> updatePrefix(@PathVariable String portal, @RequestBody Map<String, String> payload) {
        return idSequenceRepository.findByPortal(portal.toUpperCase())
                .map(seq -> {
                    String newPrefix = payload.getOrDefault("prefix", seq.getPrefix()).toUpperCase();
                    seq.setPrefix(newPrefix);
                    seq.setUpdatedAt(java.time.LocalDateTime.now());
                    idSequenceRepository.save(seq);
                    return ResponseEntity.ok(Map.of("message", "Prefix updated", "portal", seq.getPortal(), "prefix", newPrefix));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

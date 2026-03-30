package com.lms.controller;

import com.lms.entity.Consultation;
import com.lms.repository.ConsultationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {

    @Autowired
    private ConsultationRepository consultationRepository;

    @PostMapping("/book")
    public ResponseEntity<?> bookConsultation(@RequestBody Consultation consultation) {
        try {
            Consultation saved = consultationRepository.save(consultation);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Consultation booked successfully!");
            response.put("id", saved.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error booking consultation: " + e.getMessage());
        }
    }
}

package com.lms.controller;

import com.lms.entity.CourseMaterials;
import com.lms.repository.CourseMaterialsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/materials")
public class MaterialController {

    @Autowired
    private CourseMaterialsRepository materialsRepository;

    @GetMapping("/batch/{batchId}")
    public List<CourseMaterials> getMaterialsByBatch(@PathVariable Long batchId) {
        return materialsRepository.findByBatchId(batchId);
    }

    @PostMapping("/trainer/upload")
    public ResponseEntity<?> uploadMaterial(@RequestBody CourseMaterials material) {
        try {
            return ResponseEntity.ok(materialsRepository.save(material));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}

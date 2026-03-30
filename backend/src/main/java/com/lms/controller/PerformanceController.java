package com.lms.controller;

import com.lms.service.PerformanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/superadmin/performance")
public class PerformanceController {

    @Autowired
    private PerformanceService performanceService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(performanceService.getSystemPerformance());
    }

    @GetMapping("/ai-advice")
    public ResponseEntity<Map<String, String>> getAiAdvice() {
        return ResponseEntity.ok(Map.of("advice", performanceService.getAiStrategicAdvice()));
    }
}

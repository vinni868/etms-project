package com.lms.controller;

import com.lms.entity.AttendanceViolation;
import com.lms.repository.AttendanceViolationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/violations")
@RequiredArgsConstructor
@CrossOrigin
public class ViolationController {

    private final AttendanceViolationRepository violationRepo;

    /**
     * GET /api/violations/weekly?offset=0  → current week
     * GET /api/violations/weekly?offset=1  → previous week
     * GET /api/violations/weekly?offset=2  → 2 weeks ago
     */
    @GetMapping("/weekly")
    public Map<String, Object> getWeeklyViolations(@RequestParam(defaultValue = "0") int offset) {
        // Calculate week range (Monday to Sunday)
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(WeekFields.ISO.dayOfWeek(), 1).minusWeeks(offset);
        LocalDate weekEnd   = weekStart.plusDays(6);

        List<AttendanceViolation> all = violationRepo
                .findByViolationDateBetweenOrderByViolationDateDesc(weekStart, weekEnd);

        // Student violations: FORGOT_PUNCH_OUT, GEOFENCE_EXIT for students
        List<Map<String, Object>> studentViolations = all.stream()
                .filter(v -> "STUDENT".equalsIgnoreCase(v.getRole()))
                .map(this::toDto)
                .collect(Collectors.toList());

        // Staff violations: trainers + others (TRAINER_MARKED_ABSENT, GEOFENCE_EXIT, MIDNIGHT_AUTO_CLOSE)
        List<Map<String, Object>> staffViolations = all.stream()
                .filter(v -> !"STUDENT".equalsIgnoreCase(v.getRole()))
                .map(this::toDto)
                .collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("weekStart",        weekStart.toString());
        response.put("weekEnd",          weekEnd.toString());
        response.put("offset",           offset);
        response.put("studentViolations", studentViolations);
        response.put("staffViolations",  staffViolations);
        response.put("totalCount",       all.size());

        return response;
    }

    private Map<String, Object> toDto(AttendanceViolation v) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id",            v.getId());
        dto.put("userId",        v.getUserId());
        dto.put("userName",      v.getUserName());
        dto.put("role",          v.getRole());
        dto.put("portalId",      v.getPortalId());
        dto.put("violationDate", v.getViolationDate().toString());
        dto.put("violationType", v.getViolationType());
        dto.put("description",   v.getDescription());
        return dto;
    }
}

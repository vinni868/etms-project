package com.lms.controller;

import com.lms.dto.AdminRequest;
import com.lms.dto.DashboardResponse;
import com.lms.entity.User;
import com.lms.service.SuperAdminCreateAdminService;
import com.lms.service.SuperAdminService;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/superadmin")
public class SuperAdminController {

    @Autowired
    private SuperAdminCreateAdminService superAdminCreateAdminService;

    @Autowired
    private SuperAdminService superAdminService;

    // =====================================================
    // CREATE ADMIN
    // =====================================================
    @PostMapping("/admins")
    public ResponseEntity<?> createAdmin(@RequestBody AdminRequest request) {
        superAdminCreateAdminService.createAdmin(request);
        return ResponseEntity.ok(java.util.Map.of("message", "Admin created successfully"));
    }

    // =====================================================
    // GET ALL ADMINS
    // =====================================================
    @GetMapping("/admins")
    public ResponseEntity<?> getAllAdmins() {
        List<User> admins = superAdminCreateAdminService.getAllAdmins();
        return ResponseEntity.ok(admins);
    }

    // =====================================================
    // UPDATE ADMIN
    // =====================================================
    @PatchMapping("/admins/{id}")
    public ResponseEntity<?> updateAdmin(
            @PathVariable Long id,
            @RequestBody AdminRequest request) {
        superAdminCreateAdminService.updateAdmin(id, request);
        return ResponseEntity.ok(java.util.Map.of("message", "Admin updated successfully"));
    }

    // =====================================================
    // DELETE ADMIN
    // =====================================================
    @DeleteMapping("/admins/{id}")
    public ResponseEntity<?> deleteAdmin(@PathVariable Long id) {
        superAdminCreateAdminService.deleteAdmin(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Admin deleted successfully"));
    }

    // =====================================================
    // TOGGLE STATUS
    // =====================================================
    @PatchMapping("/admins/{id}/status")
    public ResponseEntity<?> toggleAdminStatus(@PathVariable Long id) {
        superAdminCreateAdminService.toggleAdminStatus(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Admin status toggled successfully"));
    }
}

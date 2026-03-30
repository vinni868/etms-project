package com.lms.controller;

import com.lms.entity.RoleMaster;
import com.lms.entity.User;
import com.lms.enums.Status;
import com.lms.repository.RoleRepository;
import com.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.lms.service.UserService;
import com.lms.service.IdGeneratorService;
import com.lms.dto.RegisterRequest;
import com.lms.repository.CourseRepository;
import com.lms.entity.CourseMaster;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/superadmin/users")
public class SuperAdminUserManagementController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserService userService;

    @Autowired
    private IdGeneratorService idGenerator;

    @Autowired
    private CourseRepository courseRepository;

    @GetMapping("/all")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/get-next-id")
    public ResponseEntity<?> getNextId(@RequestParam(required = false) String role,
                                     @RequestParam(required = false) Long courseId) {
        String roleName = (role == null || role.isEmpty()) ? "STUDENT" : role.toUpperCase();
        String shortcut = null;
        if (roleName.equals("STUDENT") && courseId != null) {
            shortcut = courseRepository.findById(courseId).map(CourseMaster::getShortcut).orElse(null);
        }
        return ResponseEntity.ok(Map.of("nextId", idGenerator.generateId(roleName, shortcut)));
    }

    @PostMapping("/create")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String roleName = payload.get("roleName");

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already exists"));
        }

        RoleMaster role = roleRepository.findByRoleName(roleName);
        if (role == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Role " + roleName + " not found"));
        }

        User user = new User();
        user.setName(payload.get("name"));
        user.setEmail(email);
        
        String phone = payload.get("phone");
        if (phone == null || !phone.matches("^\\d{10}$")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Valid 10-digit phone number is required"));
        }
        user.setPhone(phone);
        user.setPassword(passwordEncoder.encode(payload.get("password")));
        user.setPlainPassword(payload.get("password"));
        user.setStatus(Status.ACTIVE);
        user.setRole(role);

        // ✅ HANDLE MANUAL OR AUTO-GENERATED ID
        try {
            String customId = payload.get("studentId");
            String assignedId;
            if (customId != null && !customId.trim().isEmpty()) {
                assignedId = customId.trim();
            } else {
                String shortcut = null;
                if (roleName.equals("STUDENT") && payload.get("courseId") != null) {
                    try {
                        Long cId = Long.valueOf(payload.get("courseId").toString());
                        shortcut = courseRepository.findById(cId).map(CourseMaster::getShortcut).orElse(null);
                    } catch (Exception e) {}
                }
                assignedId = idGenerator.generateId(roleName, shortcut);
            }
            user.setPortalId(assignedId);
            user.setStudentId(assignedId);
        } catch (Exception e) {
            // Robust Fallback
            String sid = idGenerator.generateId(roleName);
            user.setPortalId(sid);
            user.setStudentId(sid);
        }

        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody RegisterRequest request) {
        try {
            User updated = userService.updateUser(id, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PatchMapping("/toggle-status/{id}")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            user.setStatus(user.getStatus() == Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Status updated to " + user.getStatus()));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** 
     * Permanently delete a user — Super Admin only.
     * Step 1: Set status to INACTIVE (suspends them immediately so JWT is invalidated on next request)
     * Step 2: Delete from DB
     */
    @PostMapping("/delete-permanently/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            try {
                // Step 1: Mark as INACTIVE first to immediately block the user from the app
                user.setStatus(Status.INACTIVE);
                userRepository.save(user);

                // Step 2: Permanently remove from database
                userRepository.deleteById(id);

                return ResponseEntity.ok(Map.of(
                    "message", "User suspended and permanently deleted",
                    "userId", id
                ));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "Delete failed: " + e.getMessage()
                ));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    /** 
     * Nuclear Reset: Cleans the database of all data except superadmin credentials and configuration tables.
     */
    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @PostMapping("/nuclear-reset")
    public ResponseEntity<?> nuclearReset() {
        try {
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0;");
            
            // Get all tables
            List<String> tables = jdbcTemplate.queryForList("SHOW TABLES", String.class);
            
            for(String table : tables) {
                if (!table.equalsIgnoreCase("role_master") && 
                    !table.equalsIgnoreCase("permission_master") && 
                    !table.equalsIgnoreCase("id_sequences") &&
                    !table.equalsIgnoreCase("users") && 
                    !table.equalsIgnoreCase("user_permissions")) {
                    jdbcTemplate.execute("TRUNCATE TABLE " + table + ";");
                }
            }
            
            // Delete all user_permissions for non-superadmin users
            jdbcTemplate.execute("DELETE FROM user_permissions WHERE user_id IN (SELECT id FROM users WHERE role_id != (SELECT id FROM role_master WHERE role_name = 'SUPERADMIN'))");
            
            // Delete all users except superadmin
            jdbcTemplate.execute("DELETE FROM users WHERE role_id != (SELECT id FROM role_master WHERE role_name = 'SUPERADMIN')");
            
            // Reset ID Sequences
            jdbcTemplate.execute("UPDATE id_sequences SET current_seq = 0;");
            
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1;");
            
            return ResponseEntity.ok(Map.of("message", "Database successfully cleaned! All tables truncated except SuperAdmin credentials."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to clean database: " + e.getMessage()));
        }
    }

    @PutMapping("/approve/{id}")
    public ResponseEntity<?> approveUser(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id " + id));
        
        user.setStatus(Status.ACTIVE);
        user.setApprovalStatus(com.lms.enums.ApprovalStatus.APPROVED); // 🔥 Sync with Admin logic

        // ✅ HANDLE MANUAL OR AUTO-GENERATED ID
        String customId = payload != null ? payload.get("generatedId") : null;
        if (customId != null && !customId.trim().isEmpty()) {
            user.setPortalId(customId.trim());
            user.setStudentId(customId.trim());
        } else {
            String roleName = user.getRole().getRoleName();
            user.setPortalId(idGenerator.generateId(roleName));
            user.setStudentId(user.getPortalId());
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of(
            "message", "User " + user.getName() + " has been approved successfully.",
            "status", "ACTIVE",
            "newId", user.getPortalId()
        ));
    }
}

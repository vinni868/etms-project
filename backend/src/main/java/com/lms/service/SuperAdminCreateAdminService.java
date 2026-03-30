package com.lms.service;

import com.lms.dto.AdminRequest;
import com.lms.entity.PermissionMaster;
import com.lms.entity.RoleMaster;
import com.lms.entity.User;
import com.lms.enums.Status;   // ✅ IMPORTANT
import com.lms.repository.PermissionRepository;
import com.lms.repository.RoleRepository;
import com.lms.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Service
public class SuperAdminCreateAdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ================= CREATE ADMIN =================
    public void createAdmin(AdminRequest request) {

        // ✅ Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // ✅ Fetch Role
        RoleMaster role = roleRepository.findByRoleName(request.getRole());

        if (role == null) {
            throw new RuntimeException("Role not found: " + request.getRole());
        }

        // ✅ Fetch Permissions
        List<PermissionMaster> permissionList =
                permissionRepository.findByPermissionNameIn(request.getPermissions());

        // ✅ Create User
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // Bcrypt hash
        user.setPlainPassword(request.getPassword()); // Visible for Superadmin

        user.setStatus(Status.valueOf(request.getStatus().toUpperCase()));
        user.setApprovalStatus(com.lms.enums.ApprovalStatus.APPROVED);
        user.setCreatedBy("superadmin");

        user.setRole(role);
        user.setPermissions(permissionList);

        userRepository.save(user);
    }

    // ================= GET ALL ADMINS =================
    public List<User> getAllAdmins() {
        return userRepository.findByRoleRoleNameIn(
                List.of("ADMIN", "SUB_ADMIN"));
    }

    // ================= UPDATE ADMIN =================
    public void updateAdmin(Long id, AdminRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        user.setName(request.getName());
        user.setEmail(request.getEmail());

        // ✅ FIXED STATUS ERROR HERE ALSO
        user.setStatus(Status.valueOf(request.getStatus().toUpperCase()));

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setPlainPassword(request.getPassword());
        }

        List<PermissionMaster> permissionList =
                permissionRepository.findByPermissionNameIn(request.getPermissions());

        user.setPermissions(permissionList);

        userRepository.save(user);
    }

    // ================= DELETE ADMIN =================
    public void deleteAdmin(Long id) {
        userRepository.deleteById(id);
    }

    // ================= TOGGLE STATUS =================
    public void toggleAdminStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        if (user.getStatus() == Status.ACTIVE) {
            user.setStatus(Status.INACTIVE);
        } else {
            user.setStatus(Status.ACTIVE);
        }
        userRepository.save(user);
    }
}

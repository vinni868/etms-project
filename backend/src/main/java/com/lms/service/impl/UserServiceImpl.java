package com.lms.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.lms.dto.RegisterRequest;
import com.lms.entity.RoleMaster;
import com.lms.entity.User;
import com.lms.enums.Status;
import com.lms.repository.RoleRepository;
import com.lms.repository.UserRepository;
import com.lms.service.IdGeneratorService;
import com.lms.service.UserService;
import com.lms.repository.CourseRepository;
import com.lms.entity.CourseMaster;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private IdGeneratorService idGenerator;

    @Autowired
    private CourseRepository courseRepository;

    @Override
    public User register(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());

        if (request.getPhone() == null || !request.getPhone().matches("^\\d{10}$")) {
            throw new RuntimeException("Valid 10-digit phone number is required.");
        }
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        String roleName = request.getRole() != null
                ? request.getRole().toUpperCase()
                : "STUDENT";

        RoleMaster role = roleRepository.findByRoleName(roleName);
 
        if (role == null) {
            // ✅ Auto-create role if missing
            role = new RoleMaster();
            role.setRoleName(roleName);
            role = roleRepository.save(role); 
        }

        user.setRole(role);
        
        // ✅ MANUAL OR AUTO-GENERATED ID
        String portalId = request.getStudentId();
        if (portalId == null || portalId.trim().isEmpty()) {
            String shortcut = null;
            if (roleName.equals("STUDENT") && request.getCourseId() != null) {
                shortcut = courseRepository.findById(request.getCourseId())
                        .map(CourseMaster::getShortcut).orElse(null);
            }
            portalId = idGenerator.generateId(roleName, shortcut);
        } else {
            portalId = portalId.trim();
        }
        
        user.setPortalId(portalId);
        user.setStudentId(portalId); // Sync old field for backward compatibility

        // 🔥 HIERARCHICAL APPROVAL LOGIC
        // Any self-signup or non-SuperAdmin creation defaults to PENDING
        user.setStatus(Status.PENDING);
        user.setApprovalStatus(com.lms.enums.ApprovalStatus.PENDING);
        user.setCreatedBy("self");

        User savedUser = userRepository.save(user);
        
        // Notify both Admin and SuperAdmin for self-registrations
        String msg = "New self-registered " + roleName + " (Awaiting Approval): " + user.getName();
        notificationService.createNotification(msg, "USER_CREATION", "ADMIN");
        notificationService.createNotification(msg, "USER_CREATION", "SUPERADMIN");

        return savedUser;
    }

    @Override
    public User login(String email, String password) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        if (user.getStatus() == Status.PENDING && user.getApprovalStatus() == com.lms.enums.ApprovalStatus.PENDING) {
            throw new RuntimeException("Your access is not approved yet. Please wait for an admin to verify your account.");
        }

        if (user.getStatus() == Status.REJECTED || user.getApprovalStatus() == com.lms.enums.ApprovalStatus.REJECTED) {
            throw new RuntimeException("Your account has been rejected");
        }

        if (user.getStatus() == Status.INACTIVE) {
            throw new RuntimeException("ACCOUNT_SUSPENDED: Your account has been suspended. Please contact your admin to reactivate your access.");
        }

        // Final check: Only ACTIVE users can pass
        if (user.getStatus() != Status.ACTIVE) {
             throw new RuntimeException("Account is not active (" + user.getStatus() + ")");
        }

        return user;
    }


    @Override
    public User createAdmin(RegisterRequest request) {

        RoleMaster adminRole = roleRepository.findByRoleName("ADMIN");

        if (adminRole == null) {
            throw new RuntimeException("ADMIN role not found in DB");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        
        if (request.getPhone() == null || !request.getPhone().matches("^\\d{10}$")) {
            throw new RuntimeException("Valid 10-digit phone number is required.");
        }
        user.setPhone(request.getPhone());

        // Storing encoded password
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        user.setRole(adminRole);
        user.setStatus(Status.ACTIVE);
        user.setApprovalStatus(com.lms.enums.ApprovalStatus.APPROVED);
        user.setCreatedBy("superadmin");
        
        // ✅ MANUAL OR AUTO-GENERATED ID
        String portalId = request.getStudentId();
        if (portalId == null || portalId.trim().isEmpty()) {
            portalId = idGenerator.generateId("ADMIN", null);
        } else {
            portalId = portalId.trim();
        }
        
        user.setPortalId(portalId);
        user.setStudentId(portalId);
 
        return userRepository.save(user);
    }

    @Override
    public String getNextStudentId() {
        return idGenerator.generateId("STUDENT"); // Redirect to new system
    }

    @Override
    public String getNextId(String role) {
        return idGenerator.generateId(role);
    }

    @Override
    @Transactional
    public User updateUser(Long id, RegisterRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhone() != null) {
            if (!request.getPhone().matches("^\\d{10}$")) {
                throw new RuntimeException("Valid 10-digit phone number is required.");
            }
            user.setPhone(request.getPhone());
        }
        
        if (request.getRole() != null) {
            RoleMaster role = roleRepository.findByRoleName(request.getRole().toUpperCase());
            if (role != null) user.setRole(role);
        }

        if (request.getStudentId() != null) {
            user.setPortalId(request.getStudentId());
            user.setStudentId(request.getStudentId());
        }

        return userRepository.save(user);
    }
}

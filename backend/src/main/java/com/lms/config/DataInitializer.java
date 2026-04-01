package com.lms.config;

import com.lms.entity.CourseMaster;
import com.lms.entity.PermissionMaster;
import com.lms.entity.RoleMaster;
import com.lms.repository.CourseRepository;
import com.lms.repository.PermissionRepository;
import com.lms.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private com.lms.repository.UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        
        // Seed Roles
        String[] roles = {"SUPERADMIN", "ADMIN", "TRAINER", "STUDENT", "MARKETER", "COUNSELOR"};
        for (String roleName : roles) {
            if (roleRepository.findByRoleName(roleName) == null) {
                RoleMaster role = new RoleMaster();
                role.setRoleName(roleName);
                roleRepository.save(role);
            }
        }

        // Seed Permissions
        String[] permissions = {"MANAGE_USERS", "MANAGE_COURSES", "MANAGE_BATCHES", "VIEW_REPORTS", "MANAGE_ATTENDANCE", "VIEW_STUDENTS"};
        for (String permName : permissions) {
            if (permissionRepository.findByPermissionName(permName) == null) {
                PermissionMaster perm = new PermissionMaster();
                perm.setPermissionName(permName);
                permissionRepository.save(perm);
            }
        }

        // Seed Courses
        String[] courses = {"Full Stack Java", "Full Stack Python", "MERN Stack", "Generative AI", "Cyber Security", "Data Analytics", "Digital Marketing"};
        for (String cName : courses) {
            if (courseRepository.findByCourseName(cName).isEmpty()) {
                CourseMaster course = new CourseMaster();
                course.setCourseName(cName);
                course.setStatus("ACTIVE");
                courseRepository.save(course);
            }
        }

        // Seed or Update SuperAdmin
        java.util.Optional<com.lms.entity.User> existingSA = userRepository.findByEmail("superadmin@appteknow.com");
        if (existingSA.isEmpty()) {
            com.lms.entity.User superAdmin = new com.lms.entity.User();
            superAdmin.setName("Super Admin");
            superAdmin.setEmail("superadmin@appteknow.com");
            superAdmin.setPassword(passwordEncoder.encode("admin123"));
            superAdmin.setPlainPassword("admin123");
            superAdmin.setStatus(com.lms.enums.Status.ACTIVE);
            
            RoleMaster saRole = roleRepository.findByRoleName("SUPERADMIN");
            if (saRole != null) {
                superAdmin.setRole(saRole);
                userRepository.save(superAdmin);
            }
        } else {
            // Force reset password and status for testing
            com.lms.entity.User sa = existingSA.get();
            sa.setPassword(passwordEncoder.encode("admin123"));
            sa.setPlainPassword("admin123");
            sa.setStatus(com.lms.enums.Status.ACTIVE);
            userRepository.save(sa);
        }
        
    }
}

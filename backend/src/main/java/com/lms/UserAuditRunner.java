package com.lms;

import com.lms.entity.User;
import com.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class UserAuditRunner implements CommandLineRunner {
    @Autowired private UserRepository userRepo;
    @Override
    public void run(String... args) {
        System.out.println("USER_AUDIT: Starting Audit...");
        userRepo.findAll().forEach(u -> {
            System.out.println("USER_AUDIT: User: " + u.getEmail() + " | Role: " + (u.getRole() != null ? u.getRole().getRoleName() : "NULL") + " | Status: " + u.getStatus());
        });
    }
}

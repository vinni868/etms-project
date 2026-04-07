package com.lms.controller;

import com.lms.entity.MarketerProfile;
import com.lms.entity.User;
import com.lms.repository.MarketerProfileRepository;
import com.lms.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/marketer")
@Slf4j
public class MarketerProfileController {

    @Autowired
    private MarketerProfileRepository marketerProfileRepository;

    @Autowired
    private UserRepository userRepository;

    // =====================================================================
    // GET PROFILE — email-drift healing + auto-seed
    // =====================================================================
    @GetMapping("/profile/{email:.+}")
    public ResponseEntity<MarketerProfile> getProfile(@PathVariable String email) {
        log.info("Fetching marketer profile for {}", email);

        // Step 1: Direct match
        Optional<MarketerProfile> byEmail = marketerProfileRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            MarketerProfile profile = byEmail.get();
            userRepository.findByEmail(email).ifPresent(user -> {
                if (user.getStudentId() != null && !user.getStudentId().equals(profile.getStudentId())) {
                    profile.setStudentId(user.getStudentId());
                    marketerProfileRepository.save(profile);
                    log.info("Synced marketer_id for {}", email);
                }
            });
            return ResponseEntity.ok(profile);
        }

        // Step 2: Look up user, then find marketer by name (email may have drifted)
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.warn("No user found for email: {}", email);
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        Optional<MarketerProfile> byName = marketerProfileRepository.findTopByNameIgnoreCase(user.getName());
        if (byName.isPresent()) {
            MarketerProfile existing = byName.get();
            boolean changed = false;
            if (!email.equals(existing.getEmail())) {
                log.info("Healing marketer email drift: {} → {} for {}",
                        existing.getEmail(), email, existing.getName());
                existing.setEmail(email);
                changed = true;
            }
            if (user.getStudentId() != null && !user.getStudentId().equals(existing.getStudentId())) {
                existing.setStudentId(user.getStudentId());
                changed = true;
            }
            if (changed) {
                existing.setPhone(user.getPhone());
                marketerProfileRepository.save(existing);
            }
            return ResponseEntity.ok(existing);
        }

        // Step 3: Seed new row
        MarketerProfile seeded = new MarketerProfile();
        seeded.setName(user.getName());
        seeded.setEmail(user.getEmail());
        seeded.setPhone(user.getPhone());
        seeded.setStudentId(user.getStudentId());
        MarketerProfile saved = marketerProfileRepository.save(seeded);
        log.info("Auto-seeded marketer profile for {}", email);
        return ResponseEntity.ok(saved);
    }

    // =====================================================================
    // UPDATE PROFILE — upsert + sync to users table
    // =====================================================================
    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestBody MarketerProfile updatedData) {
        log.info("Updating marketer profile for {}", updatedData.getEmail());

        try {
            MarketerProfile profile = marketerProfileRepository.findByEmail(updatedData.getEmail())
                    .orElse(new MarketerProfile());

            profile.setEmail(updatedData.getEmail());
            profile.setName(updatedData.getName());
            profile.setPhone(updatedData.getPhone());
            profile.setGender(updatedData.getGender());
            profile.setBio(updatedData.getBio());
            profile.setProfilePic(updatedData.getProfilePic());
            profile.setAddress(updatedData.getAddress());
            profile.setCity(updatedData.getCity());
            profile.setState(updatedData.getState());
            profile.setPincode(updatedData.getPincode());
            profile.setDepartment(updatedData.getDepartment());
            profile.setTargetRegion(updatedData.getTargetRegion());
            profile.setMonthlyTarget(updatedData.getMonthlyTarget());
            profile.setSkills(updatedData.getSkills());

            marketerProfileRepository.save(profile);

            userRepository.findByEmail(updatedData.getEmail()).ifPresent(user -> {
                user.setName(updatedData.getName());
                user.setPhone(updatedData.getPhone());
                userRepository.save(user);
            });

            return ResponseEntity.ok("Profile updated successfully ✅");

        } catch (Exception e) {
            log.error("Error updating marketer profile", e);
            return ResponseEntity.internalServerError().body("Profile update failed ❌");
        }
    }
}

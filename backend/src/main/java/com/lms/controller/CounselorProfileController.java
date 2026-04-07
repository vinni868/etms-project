package com.lms.controller;

import com.lms.entity.CounselorProfile;
import com.lms.entity.User;
import com.lms.repository.CounselorProfileRepository;
import com.lms.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/counselor")
@Slf4j
public class CounselorProfileController {

    @Autowired
    private CounselorProfileRepository counselorProfileRepository;

    @Autowired
    private UserRepository userRepository;

    // =====================================================================
    // GET PROFILE — email-drift healing + auto-seed
    // =====================================================================
    @GetMapping("/profile/{email:.+}")
    public ResponseEntity<CounselorProfile> getProfile(@PathVariable String email) {
        log.info("Fetching counselor profile for {}", email);

        // Step 1: Direct match
        Optional<CounselorProfile> byEmail = counselorProfileRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            CounselorProfile profile = byEmail.get();
            userRepository.findByEmail(email).ifPresent(user -> {
                if (user.getStudentId() != null && !user.getStudentId().equals(profile.getStudentId())) {
                    profile.setStudentId(user.getStudentId());
                    counselorProfileRepository.save(profile);
                    log.info("Synced counselor_id for {}", email);
                }
            });
            return ResponseEntity.ok(profile);
        }

        // Step 2: Look up user, then find counselor by name (email may have drifted)
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.warn("No user found for email: {}", email);
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        Optional<CounselorProfile> byName = counselorProfileRepository.findTopByNameIgnoreCase(user.getName());
        if (byName.isPresent()) {
            CounselorProfile existing = byName.get();
            boolean changed = false;
            if (!email.equals(existing.getEmail())) {
                log.info("Healing counselor email drift: {} → {} for {}",
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
                counselorProfileRepository.save(existing);
            }
            return ResponseEntity.ok(existing);
        }

        // Step 3: Seed new row
        CounselorProfile seeded = new CounselorProfile();
        seeded.setName(user.getName());
        seeded.setEmail(user.getEmail());
        seeded.setPhone(user.getPhone());
        seeded.setStudentId(user.getStudentId());
        CounselorProfile saved = counselorProfileRepository.save(seeded);
        log.info("Auto-seeded counselor profile for {}", email);
        return ResponseEntity.ok(saved);
    }

    // =====================================================================
    // UPDATE PROFILE — upsert + sync to users table
    // =====================================================================
    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestBody CounselorProfile updatedData) {
        log.info("Updating counselor profile for {}", updatedData.getEmail());

        try {
            CounselorProfile profile = counselorProfileRepository.findByEmail(updatedData.getEmail())
                    .orElse(new CounselorProfile());

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
            profile.setSpecialization(updatedData.getSpecialization());
            profile.setYearsOfExperience(updatedData.getYearsOfExperience());
            profile.setCertifications(updatedData.getCertifications());
            profile.setAvailability(updatedData.getAvailability());

            counselorProfileRepository.save(profile);

            userRepository.findByEmail(updatedData.getEmail()).ifPresent(user -> {
                user.setName(updatedData.getName());
                user.setPhone(updatedData.getPhone());
                userRepository.save(user);
            });

            return ResponseEntity.ok("Profile updated successfully ✅");

        } catch (Exception e) {
            log.error("Error updating counselor profile", e);
            return ResponseEntity.internalServerError().body("Profile update failed ❌");
        }
    }
}

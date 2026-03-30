package com.lms.controller;

import com.lms.entity.Trainer;
import com.lms.entity.User;
import com.lms.repository.TrainerRepository;
import com.lms.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/trainer")
@Slf4j
public class TrainerProfileController {

    @Autowired
    private TrainerRepository trainerRepository;

    @Autowired
    private UserRepository userRepository;

    // =====================================================================
    // GET PROFILE — same email-drift healing as StudentProfileController
    // =====================================================================
    @GetMapping("/profile/{email}")
    public ResponseEntity<Trainer> getProfile(@PathVariable String email) {
        log.info("Fetching trainer profile for {}", email);

        // Step 1: Direct match
        Optional<Trainer> byEmail = trainerRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            Trainer trainer = byEmail.get();
            userRepository.findByEmail(email).ifPresent(user -> {
                if (user.getStudentId() != null && !user.getStudentId().equals(trainer.getStudentId())) {
                    trainer.setStudentId(user.getStudentId());
                    trainerRepository.save(trainer);
                    log.info("Synced trainer_id for {}", email);
                }
            });
            return ResponseEntity.ok(trainer);
        }

        // Step 2: Look up user, then find trainer by name (email may have drifted)
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.warn("No user found for email: {}", email);
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        Optional<Trainer> byName = trainerRepository.findTopByNameIgnoreCase(user.getName());
        if (byName.isPresent()) {
            Trainer existing = byName.get();
            boolean changed = false;
            if (!email.equals(existing.getEmail())) {
                log.info("Healing trainer email drift: {} → {} for {}",
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
                trainerRepository.save(existing);
            }
            return ResponseEntity.ok(existing);
        }

        // Step 3: Seed new row
        Trainer seeded = new Trainer();
        seeded.setName(user.getName());
        seeded.setEmail(user.getEmail());
        seeded.setPhone(user.getPhone());
        seeded.setStudentId(user.getStudentId()); // ✅ SYNC ID
        Trainer saved = trainerRepository.save(seeded);
        log.info("Auto-seeded trainer profile for {}", email);
        return ResponseEntity.ok(saved);
    }

    // =====================================================================
    // UPDATE PROFILE — upsert + sync to users table
    // =====================================================================
    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestBody Trainer updatedData) {
        log.info("Updating trainer profile for {}", updatedData.getEmail());

        try {
            Trainer profile = trainerRepository.findByEmail(updatedData.getEmail())
                    .orElse(new Trainer());

            profile.setEmail(updatedData.getEmail());
            profile.setName(updatedData.getName());
            profile.setPhone(updatedData.getPhone());
            profile.setGender(updatedData.getGender());
            profile.setSpecialization(updatedData.getSpecialization());
            profile.setExperience(updatedData.getExperience());
            profile.setQualification(updatedData.getQualification());
            profile.setBio(updatedData.getBio());
            profile.setProfilePic(updatedData.getProfilePic());
            profile.setAddress(updatedData.getAddress());
            profile.setCity(updatedData.getCity());
            profile.setState(updatedData.getState());
            profile.setPincode(updatedData.getPincode());

            trainerRepository.save(profile);

            userRepository.findByEmail(updatedData.getEmail()).ifPresent(user -> {
                user.setName(updatedData.getName());
                user.setPhone(updatedData.getPhone());
                userRepository.save(user);
            });

            return ResponseEntity.ok("Profile updated successfully ✅");

        } catch (Exception e) {
            log.error("Error updating trainer profile", e);
            return ResponseEntity.internalServerError().body("Profile update failed ❌");
        }
    }
}
package com.lms.controller;

import com.lms.entity.Student;
import com.lms.entity.User;
import com.lms.repository.StudentRepository;
import com.lms.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/student")
@Slf4j
public class StudentProfileController {

    @Autowired
    private com.lms.repository.StudentRepository studentRepository;

    @Autowired
    private com.lms.repository.UserRepository userRepository;

    @Autowired
    private com.lms.service.CloudinaryService cloudinaryService;

    // =====================================================================
    // GET PROFILE
    //
    // Problem this solves:
    //   Admin can update a student's email in the users table.
    //   When that happens, /profile/:newEmail finds no row in students
    //   and seeds a brand-new row → duplicate.
    //
    // Fix strategy (lookup chain):
    //   1. Try students table by email (happy path — email never changed).
    //   2. If not found, look up users table by email to get the user ID,
    //      then search students table by user's ID-matched email
    //      (handles the case where users.email was updated by admin
    //       but students.email still holds the old value).
    //      When found this way → update the students row's email to match
    //      users so future lookups are fast again.
    //   3. If still not found → seed a new row from users data.
    // =====================================================================
    @GetMapping("/profile/{email}")
    public ResponseEntity<Student> getProfile(@PathVariable String email) {
        log.info("Fetching student profile for {}", email);

        // ── Step 1: Direct lookup by email ──
        Optional<Student> byEmail = studentRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            Student student = byEmail.get();
            // Sync ID if missing or different from users table
            userRepository.findByEmail(email).ifPresent(user -> {
                if (user.getStudentId() != null && !user.getStudentId().equals(student.getStudentId())) {
                    student.setStudentId(user.getStudentId());
                    studentRepository.save(student);
                    log.info("Synced student_id for {}", email);
                }
            });
            return ResponseEntity.ok(student);
        }

        // ── Step 2: Check users table — admin may have changed the email ──
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.warn("No user found for email: {}", email);
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        // Try to find an existing student profile that matches this user's
        // name (best proxy when email was changed and ID is not stored in students)
        // More reliable: find by name + old email won't work, so we use a
        // dedicated repository method findByNameIgnoreCaseAndEmailNot
        // to find any leftover row for this user.
        // Simplest reliable approach: find student by name that matches user
        Optional<Student> byUserName = studentRepository.findTopByNameIgnoreCase(user.getName());

        if (byUserName.isPresent()) {
            Student existing = byUserName.get();
            // Heal the email drift + sync studentId — update students row to match users row
            boolean changed = false;
            if (!email.equals(existing.getEmail())) {
                log.info("Healing email drift: {} → {} for student {}",
                        existing.getEmail(), email, existing.getName());
                existing.setEmail(email);
                changed = true;
            }
            if (user.getStudentId() != null && !user.getStudentId().equals(existing.getStudentId())) {
                existing.setStudentId(user.getStudentId());
                changed = true;
            }
            if (changed) {
                existing.setPhone(user.getPhone()); // also sync phone
                studentRepository.save(existing);
            }
            return ResponseEntity.ok(existing);
        }

        // ── Step 3: Seed new profile row from users data ──
        Student seeded = new Student();
        seeded.setName(user.getName());
        seeded.setEmail(user.getEmail());
        seeded.setPhone(user.getPhone());
        seeded.setStudentId(user.getStudentId()); // ✅ SYNC ID
        Student saved = studentRepository.save(seeded);
        log.info("Auto-seeded student profile for {}", email);
        return ResponseEntity.ok(saved);
    }

    // =====================================================================
    // UPDATE PROFILE
    // Upsert into students table + sync name/phone back to users table.
    // =====================================================================
    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestBody Student updatedData) {
        log.info("Updating student profile for {}", updatedData.getEmail());

        try {
            // Find existing row — prefer exact email match
            Student profile = studentRepository.findByEmail(updatedData.getEmail())
                    .orElse(new Student());

            profile.setEmail(updatedData.getEmail());
            profile.setName(updatedData.getName());
            profile.setPhone(updatedData.getPhone());
            profile.setGender(updatedData.getGender());
            profile.setQualification(updatedData.getQualification());
            profile.setYearOfPassing(updatedData.getYearOfPassing());
            profile.setAggregatePercentage(updatedData.getAggregatePercentage());
            profile.setMarks10th(updatedData.getMarks10th());
            profile.setMarks12th(updatedData.getMarks12th());
            profile.setParentName(updatedData.getParentName());
            profile.setParentPhone(updatedData.getParentPhone());
            profile.setSkills(updatedData.getSkills());
            profile.setBio(updatedData.getBio());
            profile.setProfilePic(updatedData.getProfilePic());

            // Document URLs (already uploaded to Cloudinary from frontend)
            profile.setAadharCardUrl(updatedData.getAadharCardUrl());
            profile.setResumeUrl(updatedData.getResumeUrl());
            profile.setMarks10thUrl(updatedData.getMarks10thUrl());
            profile.setMarks12thUrl(updatedData.getMarks12thUrl());
            profile.setGraduationDocUrl(updatedData.getGraduationDocUrl());
            profile.setAddress(updatedData.getAddress());
            profile.setCity(updatedData.getCity());
            profile.setState(updatedData.getState());
            profile.setPincode(updatedData.getPincode());

            studentRepository.save(profile);

            // Sync name + phone back to users table
            userRepository.findByEmail(updatedData.getEmail()).ifPresent(user -> {
                user.setName(updatedData.getName());
                user.setPhone(updatedData.getPhone());
                userRepository.save(user);
            });

            return ResponseEntity.ok("Profile updated successfully ✅");

        } catch (Exception e) {
            log.error("Error updating student profile", e);
            return ResponseEntity.internalServerError().body("Profile update failed ❌");
        }
    }

    // =====================================================================
    // UPLOAD DOCUMENT TO CLOUDINARY
    // =====================================================================
    @PostMapping("/upload-document")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam("type") String type,
            @RequestParam("email") String email) {

        log.info("Request to upload {} for student {}", type, email);

        try {
            // Validate the parent student exists
            Optional<com.lms.entity.Student> studentOpt = studentRepository.findByEmail(email);
            if (studentOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Student profile not found for email: " + email);
            }

            // Path pattern in Cloudinary: students/{studentId}/{type}
            String folder = "students/" + studentOpt.get().getStudentId();
            String url = cloudinaryService.uploadDocument(file, folder);

            return ResponseEntity.ok(java.util.Map.of(
                "url", url,
                "type", type,
                "message", type + " uploaded successfully ✅"
            ));

        } catch (Exception e) {
            log.error("Failed to upload document to Cloudinary", e);
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }
}
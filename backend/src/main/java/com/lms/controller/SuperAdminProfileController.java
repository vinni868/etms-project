package com.lms.controller;

import com.lms.entity.SuperAdminProfile;
import com.lms.repository.SuperAdminProfileRepository;
import com.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/superadmin")
public class SuperAdminProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SuperAdminProfileRepository superAdminProfileRepository;

    @GetMapping("/profile/{email}")
    public ResponseEntity<SuperAdminProfile> getProfile(@PathVariable String email) {
        Optional<SuperAdminProfile> saOpt = superAdminProfileRepository.findByEmail(email);
        if (saOpt.isPresent()) {
            return ResponseEntity.ok(saOpt.get());
        }

        return userRepository.findByEmail(email).map(user -> {
            SuperAdminProfile seeded = new SuperAdminProfile();
            seeded.setName(user.getName());
            seeded.setEmail(user.getEmail());
            seeded.setPhone(user.getPhone());
            return ResponseEntity.ok(superAdminProfileRepository.save(seeded));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/update-profile")
    public ResponseEntity<SuperAdminProfile> updateProfile(@RequestBody SuperAdminProfile profile) {
        SuperAdminProfile existing = superAdminProfileRepository.findByEmail(profile.getEmail())
                .orElse(new SuperAdminProfile());
        
        if (existing.getId() == null) {
            existing.setEmail(profile.getEmail());
        }

        existing.setName(profile.getName());
        existing.setPhone(profile.getPhone());
        existing.setGender(profile.getGender());
        existing.setBio(profile.getBio());
        existing.setProfilePic(profile.getProfilePic());
        existing.setAddress(profile.getAddress());
        existing.setCity(profile.getCity());
        existing.setState(profile.getState());
        existing.setPincode(profile.getPincode());
        existing.setAdminTitle(profile.getAdminTitle());
        existing.setEmergencyContact(profile.getEmergencyContact());

        SuperAdminProfile saved = superAdminProfileRepository.save(existing);

        userRepository.findByEmail(profile.getEmail()).ifPresent(user -> {
            user.setName(profile.getName());
            user.setPhone(profile.getPhone());
            userRepository.save(user);
        });

        return ResponseEntity.ok(saved);
    }
}

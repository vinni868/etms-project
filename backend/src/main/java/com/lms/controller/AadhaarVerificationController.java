package com.lms.controller;

import com.lms.service.OfflineAadhaarService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.lms.repository.UserRepository;

import java.util.Map;

/**
 * AadhaarVerificationController — handles Offline eKYC verification.
 *
 * Endpoint:
 *   POST /api/student/verify-aadhaar-offline
 *     Form params:
 *       file       — the Offline eKYC ZIP downloaded from UIDAI
 *       shareCode  — the 4-character share code set by student during download
 *
 * How to get the Offline eKYC ZIP:
 *   1. Go to https://resident.uidai.gov.in/offline-kyc
 *   2. Enter Aadhaar number (or VID) + captcha
 *   3. Verify with OTP sent to Aadhaar-linked mobile
 *   4. Set a 4-character share code
 *   5. Download the ZIP file
 *
 * Security:
 *   - Endpoint requires STUDENT role (JWT-protected)
 *   - The share code is never stored — only used transiently for decryption
 *   - XXE protection applied to all XML parsing
 *   - ZIP bomb protection via 10 MB limit (enforced by Spring's multipart config)
 */
@RestController
@RequestMapping("/api/student")
public class AadhaarVerificationController {

    private final OfflineAadhaarService aadhaarService;
    private final UserRepository userRepository;

    public AadhaarVerificationController(OfflineAadhaarService aadhaarService,
                                         UserRepository userRepository) {
        this.aadhaarService = aadhaarService;
        this.userRepository = userRepository;
    }

    /**
     * POST /api/student/verify-aadhaar-offline
     *
     * Accepts the UIDAI Offline eKYC ZIP + share code.
     * Verifies the XML signature, decrypts personal data, uploads to Cloudinary,
     * marks the student as Aadhaar-verified.
     *
     * Returns JSON with: verified, verificationLevel, name, dob, gender,
     *                    maskedAadhaar, message, cloudinaryUrl
     */
    @PostMapping("/verify-aadhaar-offline")
    public ResponseEntity<?> verifyAadhaarOffline(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "shareCode", required = false, defaultValue = "") String shareCode) {

        try {
            // Validate file
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Please upload the Offline eKYC ZIP file from UIDAI."
                ));
            }
            if (file.getSize() > 10 * 1024 * 1024) { // 10 MB cap
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "File is too large. The Offline eKYC ZIP is typically under 1 MB."
                ));
            }
            String filename = file.getOriginalFilename();
            if (filename == null || !filename.toLowerCase().endsWith(".zip")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Please upload the ZIP file (.zip) downloaded from the UIDAI portal."
                ));
            }

            // Validate share code format (optional but recommended)
            if (shareCode != null && !shareCode.isBlank() && !shareCode.matches("[A-Za-z0-9]{1,8}")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Share code should be alphanumeric (1-8 characters)."
                ));
            }

            Long userId = getLoggedInUserId();
            OfflineAadhaarService.AadhaarResult result =
                aadhaarService.verifyAndStore(file, shareCode, userId);

            if (!result.verified) {
                return ResponseEntity.badRequest().body(Map.of(
                    "verified",           false,
                    "verificationLevel",  result.verificationLevel,
                    "message",            result.message != null ? result.message : "Verification failed."
                ));
            }

            return ResponseEntity.ok(Map.of(
                "verified",           true,
                "verificationLevel",  result.verificationLevel != null ? result.verificationLevel : "",
                "name",               result.name   != null ? result.name   : "",
                "dob",                result.dob    != null ? result.dob    : "",
                "gender",             result.gender != null ? result.gender : "",
                "maskedAadhaar",      result.maskedAadhaar != null ? result.maskedAadhaar : "",
                "referenceId",        result.referenceId   != null ? result.referenceId   : "",
                "cloudinaryUrl",      result.cloudinaryUrl != null ? result.cloudinaryUrl : "",
                "message",            result.message != null ? result.message : "Verified successfully."
            ));

        } catch (Exception e) {
            System.err.println("AADHAAR_VERIFICATION_ERROR: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Verification failed: " + e.getMessage()
            ));
        }
    }

    private Long getLoggedInUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
        }
        throw new RuntimeException("User not authenticated");
    }
}

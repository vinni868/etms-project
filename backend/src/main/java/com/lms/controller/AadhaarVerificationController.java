package com.lms.controller;

import com.lms.service.OfflineAadhaarService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * AadhaarVerificationController — handles Offline eKYC verification.
 *
 * Endpoint:
 *   POST /api/student/verify-aadhaar-offline
 *     Form params:
 *       file       — the Offline eKYC ZIP downloaded from UIDAI
 *       shareCode  — the 4-character share code set by student during download
 */
@RestController
@RequestMapping("/api/student")
public class AadhaarVerificationController {

    private final OfflineAadhaarService aadhaarService;

    public AadhaarVerificationController(OfflineAadhaarService aadhaarService) {
        this.aadhaarService = aadhaarService;
    }

    /**
     * POST /api/student/verify-aadhaar-offline
     *
     * Accepts the UIDAI Offline eKYC ZIP + share code.
     * Verifies the XML signature, decrypts personal data,
     * and marks the student as Aadhaar-verified.
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
            if (file.getSize() > 10 * 1024 * 1024) {
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
            if (shareCode != null && !shareCode.isBlank() && !shareCode.matches("[A-Za-z0-9]{1,8}")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Share code should be alphanumeric (1-8 characters)."
                ));
            }

            // Get the logged-in student's email (used to look up student record)
            String email = getLoggedInEmail();

            OfflineAadhaarService.AadhaarResult result =
                aadhaarService.verifyAndStore(file, shareCode, email);

            if (!result.verified) {
                return ResponseEntity.badRequest().body(Map.of(
                    "verified",          false,
                    "verificationLevel", result.verificationLevel != null ? result.verificationLevel : "FAILED",
                    "message",           result.message != null ? result.message : "Verification failed."
                ));
            }

            return ResponseEntity.ok(Map.of(
                "verified",          true,
                "verificationLevel", result.verificationLevel != null ? result.verificationLevel : "",
                "name",              result.name   != null ? result.name   : "",
                "dob",               result.dob    != null ? result.dob    : "",
                "gender",            result.gender != null ? result.gender : "",
                "maskedAadhaar",     result.maskedAadhaar != null ? result.maskedAadhaar : "",
                "referenceId",       result.referenceId   != null ? result.referenceId   : "",
                "cloudinaryUrl",     result.cloudinaryUrl != null ? result.cloudinaryUrl : "",
                "message",           result.message != null ? result.message : "Verified successfully."
            ));

        } catch (Exception e) {
            System.err.println("AADHAAR_VERIFICATION_ERROR: " + e.getClass().getSimpleName() + " — " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Verification failed: " + e.getMessage()
            ));
        }
    }

    /** Get the email of the currently authenticated user from the JWT/Security context. */
    private String getLoggedInEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername(); // username = email in this app
        }
        throw new RuntimeException("User not authenticated");
    }
}

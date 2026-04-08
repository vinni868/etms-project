package com.lms.controller;

import com.lms.service.DigiLockerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.lms.repository.UserRepository;

import java.net.URI;
import java.util.Map;

/**
 * DigiLockerController — OAuth 2.0 endpoints for DigiLocker Aadhaar verification.
 *
 * Endpoints:
 *   GET /api/digilocker/auth-url   → returns authorization URL (requires student login)
 *   GET /api/digilocker/callback   → OAuth callback from DigiLocker (public, no JWT needed)
 *
 * How it works:
 *   1. Student clicks "Verify with DigiLocker" in the profile page
 *   2. Frontend calls GET /api/digilocker/auth-url → gets the DigiLocker URL
 *   3. Frontend redirects student's browser to that URL
 *   4. Student authenticates on DigiLocker and grants permission
 *   5. DigiLocker redirects browser to /api/digilocker/callback?code=...&state=...
 *   6. This controller validates state, fetches Aadhaar, uploads to Cloudinary,
 *      marks student verified, and redirects browser back to the frontend profile page
 */
@RestController
@RequestMapping("/api/digilocker")
public class DigiLockerController {

    private final DigiLockerService digiLockerService;
    private final UserRepository userRepository;

    public DigiLockerController(DigiLockerService digiLockerService,
                                UserRepository userRepository) {
        this.digiLockerService = digiLockerService;
        this.userRepository = userRepository;
    }

    /**
     * GET /api/digilocker/auth-url
     *
     * Returns the DigiLocker authorization URL for the currently logged-in student.
     * The student's browser should be redirected to this URL to begin the OAuth flow.
     *
     * Requires: valid JWT (STUDENT role)
     * Response: { "authUrl": "https://api.digitallocker.gov.in/..." }
     */
    @GetMapping("/auth-url")
    public ResponseEntity<?> getAuthUrl() {
        try {
            if (!digiLockerService.isConfigured()) {
                return ResponseEntity.status(503).body(Map.of(
                    "error", "DigiLocker integration is not configured on this server.",
                    "hint", "Please set DIGILOCKER_CLIENT_ID, DIGILOCKER_CLIENT_SECRET, and DIGILOCKER_REDIRECT_URI environment variables."
                ));
            }

            // Get the currently authenticated user's ID
            Long userId = getLoggedInUserId();
            String authUrl = digiLockerService.generateAuthUrl(userId);

            return ResponseEntity.ok(Map.of("authUrl", authUrl));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Failed to generate DigiLocker auth URL: " + e.getMessage()
            ));
        }
    }

    /**
     * GET /api/digilocker/callback?code={code}&state={state}
     *
     * DigiLocker redirects here after the user authorizes the application.
     * This endpoint is PUBLIC (no JWT) because DigiLocker calls it as a browser redirect.
     *
     * On success: 302 redirect → frontend profile page with ?digilocker=success
     * On failure: 302 redirect → frontend profile page with ?digilocker=error&reason=...
     */
    @GetMapping("/callback")
    public ResponseEntity<Void> handleCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            @RequestParam(name = "error_description", required = false) String errorDesc) {

        String frontendBase = digiLockerService.getFrontendBaseUrl();

        // Handle user denial or DigiLocker error
        if (error != null) {
            System.err.println("DIGILOCKER_CALLBACK: User denied or error — " + error + ": " + errorDesc);
            String redirectUrl = frontendBase + "/student/profile?digilocker=error&reason="
                + java.net.URLEncoder.encode(
                    errorDesc != null ? errorDesc : "Access denied",
                    java.nio.charset.StandardCharsets.UTF_8);
            return ResponseEntity.status(302).location(URI.create(redirectUrl)).build();
        }

        // Validate required params
        if (code == null || code.isBlank() || state == null || state.isBlank()) {
            String redirectUrl = frontendBase + "/student/profile?digilocker=error&reason=Missing+code+or+state";
            return ResponseEntity.status(302).location(URI.create(redirectUrl)).build();
        }

        try {
            String redirectUrl = digiLockerService.handleCallback(code, state);
            return ResponseEntity.status(302).location(URI.create(redirectUrl)).build();

        } catch (SecurityException e) {
            System.err.println("DIGILOCKER_CALLBACK SECURITY ERROR: " + e.getMessage());
            String redirectUrl = frontendBase + "/student/profile?digilocker=error&reason=Invalid+state";
            return ResponseEntity.status(302).location(URI.create(redirectUrl)).build();

        } catch (Exception e) {
            System.err.println("DIGILOCKER_CALLBACK ERROR: " + e.getMessage());
            String encodedReason = java.net.URLEncoder.encode(
                "Verification failed — please try again", java.nio.charset.StandardCharsets.UTF_8);
            String redirectUrl = frontendBase + "/student/profile?digilocker=error&reason=" + encodedReason;
            return ResponseEntity.status(302).location(URI.create(redirectUrl)).build();
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

package com.lms.controller;

import com.lms.dto.QrScanRequest;
import com.lms.dto.QrScanResponse;
import com.lms.entity.User;
import com.lms.repository.UserRepository;
import com.lms.service.QrAttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/qr")
@RequiredArgsConstructor
public class QrAttendanceController {

    private final QrAttendanceService qrService;
    private final UserRepository userRepository;

    // ─── Get current QR secret (Admin / SuperAdmin only) ────────────────────
    @GetMapping("/config")
    public ResponseEntity<?> getQrConfig() {
        String secret = qrService.getQrSecret();
        return ResponseEntity.ok(Map.of("qrSecret", secret));
    }

    // ─── Rotate / Regenerate QR secret ──────────────────────────────────────
    @PostMapping("/config/regenerate")
    public ResponseEntity<?> regenerateQrConfig() {
        String newSecret = qrService.regenerateQrSecret();
        return ResponseEntity.ok(Map.of(
                "qrSecret", newSecret,
                "message", "New QR secret generated. Old codes are now invalid."
        ));
    }

    // ─── QR Scan — Punch In / Out (authenticated user) ──────────────────────
    @PostMapping("/scan")
    public ResponseEntity<QrScanResponse> scanQr(
            @RequestBody QrScanRequest request,
            Authentication authentication) {

        User user = getUserFromAuth(authentication);
        QrScanResponse response = qrService.scanQr(user.getId(), request);
        return ResponseEntity.ok(response);
    }

    // ─── Direct Punch In (portal button — already authenticated) ─────────────
    @PostMapping("/punch-in")
    public ResponseEntity<?> punchIn(@RequestBody(required = false) Map<String, Object> body, Authentication authentication) {
        try {
            User user = getUserFromAuth(authentication);
            Double lat = null;
            Double lng = null;
            
            if (body != null) {
                if (body.get("latitude") != null) lat = Double.parseDouble(body.get("latitude").toString());
                if (body.get("longitude") != null) lng = Double.parseDouble(body.get("longitude").toString());
            }
            
            Map<String, Object> result = qrService.directPunchIn(user.getId(), lat, lng);
            return ResponseEntity.ok(result);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", "Internal server error: " + e.getMessage()));
        }
    }

    // ─── Direct Punch Out (portal button — already authenticated) ────────────
    @PostMapping("/punch-out")
    public ResponseEntity<?> punchOut(@RequestBody(required = false) Map<String, Object> body, Authentication authentication) {
        try {
            User user = getUserFromAuth(authentication);
            Double lat = null;
            Double lng = null;
            
            if (body != null) {
                if (body.get("latitude") != null) lat = Double.parseDouble(body.get("latitude").toString());
                if (body.get("longitude") != null) lng = Double.parseDouble(body.get("longitude").toString());
            }

            Map<String, Object> result = qrService.directPunchOut(user.getId(), lat, lng);
            return ResponseEntity.ok(result);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", "Internal server error: " + e.getMessage()));
        }
    }

    // ─── Get my time logs ───────────────────────────────────────────────────
    @GetMapping("/time-logs")
    public ResponseEntity<?> getTimeLogs(Authentication authentication) {
        User user = getUserFromAuth(authentication);
        return ResponseEntity.ok(qrService.getTimeLogs(user.getId()));
    }

    // ─── Get all time logs (Super Admin) ────────────────────────────────────
    @GetMapping("/all-logs")
    public ResponseEntity<?> getAllTimeLogs() {
        return ResponseEntity.ok(qrService.getAllTimeLogs());
    }

    // ─── Get sessions for a specific user on a specific date (Admin / SuperAdmin) ─
    @GetMapping("/user-sessions/{userId}")
    public ResponseEntity<?> getUserSessions(
            @PathVariable Long userId,
            @RequestParam(required = false) String date) {
        java.time.LocalDate targetDate = date != null && !date.isEmpty()
                ? java.time.LocalDate.parse(date)
                : java.time.LocalDate.now();
        return ResponseEntity.ok(qrService.getUserSessionsForDate(userId, targetDate));
    }

    // ─── Punch Settings — Get (Admin) ────────────────────────────────────────
    @GetMapping("/punch-settings")
    public ResponseEntity<?> getPunchSettings() {
        return ResponseEntity.ok(qrService.getPunchSettings());
    }

    // ─── Punch Settings — Save (Admin) ───────────────────────────────────────
    @PostMapping("/punch-settings")
    public ResponseEntity<?> savePunchSettings(@RequestBody Map<String, Object> body) {
        Double lat          = body.get("latitude")      != null ? Double.parseDouble(body.get("latitude").toString())      : null;
        Double lng          = body.get("longitude")     != null ? Double.parseDouble(body.get("longitude").toString())     : null;
        Double radiusMeters = body.get("radiusMeters")  != null ? Double.parseDouble(body.get("radiusMeters").toString())  : 200.0;
        String lateTime     = body.get("lateThreshold") != null ? body.get("lateThreshold").toString()                    : "10:00";

        qrService.savePunchSettings(lat, lng, radiusMeters, lateTime);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Punch settings saved successfully."));
    }

    // ─── Auto-Checkout (Geofenced exit) ───────────────────────────────────
    @PostMapping("/auto-checkout")
    public ResponseEntity<?> autoCheckout(
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        User user = getUserFromAuth(authentication);
        String reason = (body != null && body.containsKey("reason")) ? body.get("reason") : "GEOFENCE_EXIT";
        Double dist = (body != null && body.get("distance") != null) ? Double.parseDouble(body.get("distance")) : null;
        
        return ResponseEntity.ok(qrService.autoCheckout(user.getId(), reason, dist));
    }

    // ─── Helper ─────────────────────────────────────────────────────────────
    private User getUserFromAuth(Authentication auth) {
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + email));
    }
}

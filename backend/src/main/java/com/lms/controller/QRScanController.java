package com.lms.controller;

import com.lms.entity.SystemSetting;
import com.lms.entity.TimeTracking;
import com.lms.entity.User;
import com.lms.repository.SystemSettingRepository;
import com.lms.repository.TimeTrackingRepository;
import com.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/qr")
public class QRScanController {

    @Autowired
    private TimeTrackingRepository timeTrackingRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private SystemSettingRepository sysRepo;

    private String getSetting(String key, String def) {
        return sysRepo.findById(key).map(SystemSetting::getSettingValue).orElse(def);
    }

    private void saveSetting(String key, String val) {
        SystemSetting s = sysRepo.findById(key).orElse(new SystemSetting(key, val));
        s.setSettingValue(val);
        sysRepo.save(s);
    }

    // ================== SUPER ADMIN SETTINGS ==================
    @GetMapping("/settings")
    public ResponseEntity<?> getSettings() {
        return ResponseEntity.ok(Map.of(
            "activeToken", getSetting("QR_ACTIVE_TOKEN", "ETMS-AUTH-SECURE-SCAN-102938"),
            "instituteLat", getSetting("office_latitude", "0.0"),
            "instituteLng", getSetting("office_longitude", "0.0")
        ));
    }

    @PostMapping("/settings")
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, Object> req) {
        if (req.containsKey("lat")) {
            saveSetting("office_latitude", req.get("lat").toString());
            saveSetting("INSTITUTE_LAT", req.get("lat").toString()); // Keep old key in sync just in case
        }
        if (req.containsKey("lng")) {
            saveSetting("office_longitude", req.get("lng").toString());
            saveSetting("INSTITUTE_LNG", req.get("lng").toString()); // Keep old key in sync just in case
        }
        if (req.containsKey("generateNew") && Boolean.parseBoolean(req.get("generateNew").toString())) {
            String newToken = "ETMS-SECURE-" + UUID.randomUUID().toString();
            saveSetting("QR_ACTIVE_TOKEN", newToken);
            return ResponseEntity.ok(Map.of("message", "QR Token regenerated", "activeToken", newToken));
        }
        return ResponseEntity.ok(Map.of("message", "Settings updated"));
    }

    // ================== SCAN ENDPOINT (Punch In/Out for Time Tracking) ==================
    @PostMapping("/punch")
    public ResponseEntity<?> handleScan(@RequestBody Map<String, Object> request, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized. Please log in."));
        }

        String reqToken = request.get("qrToken") != null ? request.get("qrToken").toString() : "";
        String activeToken = getSetting("QR_ACTIVE_TOKEN", "ETMS-AUTH-SECURE-SCAN-102938");

        if (!activeToken.equals(reqToken)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid or Expired QR Code scanned. Please scan the official latest institute QR."));
        }

        // ---------- LOCATION CHECK (20 meters) ----------
        if (!request.containsKey("latitude") || !request.containsKey("longitude")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Your GPS location is required to punch in. Please enable location permissions."));
        }

        double userLat = Double.parseDouble(request.get("latitude").toString());
        double userLng = Double.parseDouble(request.get("longitude").toString());
        
        // Read from the SAME keys that QrAttendanceService saves to
        double instLat  = parseDoubleSafe(getSetting("office_latitude",      "0.0"));
        double instLng  = parseDoubleSafe(getSetting("office_longitude",     "0.0"));
        double radius   = parseDoubleSafe(getSetting("office_radius_meters", "200"));

        if (instLat != 0.0 && instLng != 0.0) {
            double distance = calculateDistance(userLat, userLng, instLat, instLng);
            if (distance > radius) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", String.format(
                        "You are %.0fm away from the institute. Scanning is only allowed within %.0fm of the premises.",
                        distance, radius)
                ));
            }
        }

        // ---------- SESSION LOGIC ----------
        String userEmail = auth.getName();
        Optional<User> userOpt = userRepo.findByEmail(userEmail);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found."));
        }

        User user = userOpt.get();
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        Optional<TimeTracking> openSessionOpt = timeTrackingRepo.findOpenSessionForToday(user.getId(), today);

        Map<String, Object> response = new HashMap<>();
        Map<String, Object> sessionInfo = new HashMap<>();

        if (openSessionOpt.isPresent()) {
            // PUNCH OUT
            TimeTracking openSession = openSessionOpt.get();
            openSession.setLogoutTime(now);

            int totalMins = (int) Duration.between(openSession.getLoginTime(), now).toMinutes();
            openSession.setTotalMinutes(totalMins);

            timeTrackingRepo.save(openSession);

            response.put("message", "Successfully Punched Out.");
            sessionInfo.put("punchType", "OUT");
            sessionInfo.put("loginTime", openSession.getLoginTime());
            sessionInfo.put("logoutTime", openSession.getLogoutTime());
            sessionInfo.put("totalMinutes", totalMins);
            
            sessionInfo.put("duration", (totalMins / 60) + "h " + (totalMins % 60) + "m");

        } else {
            // PUNCH IN
            TimeTracking newSession = new TimeTracking();
            newSession.setUserId(user.getId());
            newSession.setDate(today);
            newSession.setLoginTime(now);

            timeTrackingRepo.save(newSession);

            response.put("message", "Successfully Punched In.");
            sessionInfo.put("punchType", "IN");
            sessionInfo.put("loginTime", newSession.getLoginTime());
        }

        sessionInfo.put("userName", user.getName());
        sessionInfo.put("role", user.getRole().getRoleName());
        sessionInfo.put("studentId", user.getStudentId() != null ? user.getStudentId() : "N/A");

        response.put("sessionInfo", sessionInfo);

        return ResponseEntity.ok(response);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────
    private double parseDoubleSafe(String s) {
        try { return Double.parseDouble(s); } catch (Exception e) { return 0.0; }
    }

    // Haversine distance formula
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371e3; // metres
        double phi1 = Math.toRadians(lat1);
        double phi2 = Math.toRadians(lat2);
        double deltaPhi = Math.toRadians(lat2 - lat1);
        double deltaLambda = Math.toRadians(lon2 - lon1);

        double a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    }

    // ================== AUTO-CHECKOUT (Geofence Exit) ==================
    /**
     * Called by the frontend geofence watcher when a user has left the institute radius.
     * If the user has an open session, it is automatically closed.
     * Idempotent — safe to call even if no session is open.
     */
    @PostMapping("/auto-checkout")
    public ResponseEntity<?> autoCheckout(
            @RequestBody(required = false) Map<String, Object> body,
            Authentication auth) {

        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized."));
        }

        String userEmail = auth.getName();
        Optional<User> userOpt = userRepo.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found."));
        }

        User user = userOpt.get();
        LocalDate today = LocalDate.now();
        Optional<TimeTracking> openSessionOpt = timeTrackingRepo.findOpenSessionForToday(user.getId(), today);

        if (openSessionOpt.isEmpty()) {
            // No active session — nothing to do
            return ResponseEntity.ok(Map.of(
                "status",  "NO_ACTION",
                "message", "No active session found. Nothing to check out."
            ));
        }

        LocalDateTime now = LocalDateTime.now();
        TimeTracking session = openSessionOpt.get();
        session.setLogoutTime(now);
        int totalMins = (int) Duration.between(session.getLoginTime(), now).toMinutes();
        session.setTotalMinutes(totalMins);
        timeTrackingRepo.save(session);

        String reason = (body != null && body.get("reason") != null)
                ? body.get("reason").toString()
                : "GEOFENCE_EXIT";

        long hours = totalMins / 60;
        long mins  = totalMins % 60;
        String duration = hours > 0 ? hours + "h " + mins + "m" : mins + "m";

        return ResponseEntity.ok(Map.of(
            "status",       "CHECKED_OUT",
            "message",      "Auto-checked out: " + reason + ". Duration: " + duration,
            "logoutTime",   now.toString(),
            "totalMinutes", totalMins,
            "duration",     duration,
            "reason",       reason
        ));
    }

    // ================== MIDNIGHT SCHEDULER — End-of-Day Auto-Checkout ==================
    /**
     * Runs at 23:59 every night.
     * Closes ALL open sessions across all users to prevent sessions bleeding into next day.
     * These are marked with reason AUTO_CLOSED_END_OF_DAY.
     */
    @Scheduled(cron = "0 59 23 * * *")
    public void midnightAutoCheckout() {
        LocalDate today = LocalDate.now();
        LocalDateTime closeTime = LocalDateTime.of(today, LocalTime.of(23, 59, 0));

        List<TimeTracking> openSessions = timeTrackingRepo.findAllOpenSessionsForDate(today);

        int closed = 0;
        for (TimeTracking session : openSessions) {
            session.setLogoutTime(closeTime);
            int totalMins = (int) Duration.between(session.getLoginTime(), closeTime).toMinutes();
            if (totalMins < 0) totalMins = 0;
            session.setTotalMinutes(totalMins);
            timeTrackingRepo.save(session);
            closed++;
        }
        System.out.println("[MidnightScheduler] Auto-closed " + closed + " open sessions for " + today);
    }
}

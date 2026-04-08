package com.lms.service;

import com.lms.dto.QrScanRequest;
import com.lms.dto.QrScanResponse;
import com.lms.entity.AttendanceViolation;
import com.lms.entity.SystemSetting;
import com.lms.entity.TimeTracking;
import com.lms.entity.User;
import com.lms.repository.AttendanceViolationRepository;
import com.lms.repository.SystemSettingRepository;
import com.lms.repository.TimeTrackingRepository;
import com.lms.repository.UserRepository;
import com.lms.util.HaversineUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.lms.enums.Status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class QrAttendanceService {

    private final SystemSettingRepository settingRepo;
    private final TimeTrackingRepository trackingRepo;
    private final UserRepository userRepo;
    private final AttendanceViolationRepository violationRepo;

    // ─── QR Secret Management ──────────────────────────────────────────────

    public String getQrSecret() {
        Optional<SystemSetting> opt = settingRepo.findById("active_qr_secret");
        if (opt.isPresent()) {
            return opt.get().getSettingValue();
        }
        // Auto-generate if missing
        String secret = "atc_punch_" + UUID.randomUUID().toString().replace("-", "");
        settingRepo.save(new SystemSetting("active_qr_secret", secret));
        return secret;
    }

    @Transactional
    public String regenerateQrSecret() {
        String newSecret = "atc_punch_" + UUID.randomUUID().toString().replace("-", "");
        settingRepo.save(new SystemSetting("active_qr_secret", newSecret));
        return newSecret;
    }

    // ─── Punch Settings ─────────────────────────────────────────────────────

    @Cacheable("punchSettings")
    public Map<String, Object> getPunchSettings() {
        Map<String, Object> result = new HashMap<>();
        result.put("latitude",      parseDouble(getSetting("office_latitude", "0.0")));
        result.put("longitude",     parseDouble(getSetting("office_longitude", "0.0")));
        result.put("radiusMeters",  parseDouble(getSetting("office_radius_meters", "200")));
        result.put("lateThreshold", getSetting("late_threshold_time", "10:00"));
        return result;
    }

    @Transactional
    @CacheEvict(value = "punchSettings", allEntries = true)
    public void savePunchSettings(Double latitude, Double longitude, Double radiusMeters, String lateThreshold) {
        saveSetting("office_latitude",      latitude != null      ? String.valueOf(latitude)      : "0.0");
        saveSetting("office_longitude",     longitude != null     ? String.valueOf(longitude)     : "0.0");
        saveSetting("office_radius_meters", radiusMeters != null  ? String.valueOf(radiusMeters)  : "200");
        saveSetting("late_threshold_time",  lateThreshold != null ? lateThreshold                : "10:00");
    }

    // ─── Time Logs ──────────────────────────────────────────────────────────

    public Map<String, Object> getTimeLogs(Long userId) {
        List<TimeTracking> logs = trackingRepo.findByUserIdOrderByLoginTimeDesc(userId);
        List<Map<String, Object>> logDtos = new ArrayList<>();

        for (TimeTracking t : logs) {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id",            t.getId());
            dto.put("date",          t.getDate().toString());
            dto.put("loginTime",     t.getLoginTime().toString());
            dto.put("logoutTime",    t.getLogoutTime() != null ? t.getLogoutTime().toString() : null);
            dto.put("totalMinutes",  t.getTotalMinutes());
            dto.put("punchMethod",   t.getPunchMethod());
            dto.put("checkoutReason", t.getCheckoutReason());
            dto.put("distanceIn",    t.getDistanceFromOffice());
            dto.put("distanceOut",   t.getDistanceOut());
            dto.put("sessionCount",  1); 
            logDtos.add(dto);
        }

        // Stats
        double totalMinutes = logs.stream()
                .filter(t -> t.getTotalMinutes() != null)
                .mapToDouble(TimeTracking::getTotalMinutes)
                .sum();

        int totalDays = (int) logs.stream().map(TimeTracking::getDate).distinct().count();
        String avgHours = totalDays > 0
                ? String.format("%.1fh", (totalMinutes / totalDays) / 60.0)
                : "0h";

        boolean isActiveToday = !trackingRepo.findOpenSessionsForToday(userId, LocalDate.now()).isEmpty();

        Map<String, Object> stats = new HashMap<>();
        stats.put("avgHours",    avgHours);
        stats.put("totalDays",   totalDays);
        stats.put("activeToday", isActiveToday ? 1 : 0);

        Map<String, Object> response = new HashMap<>();
        response.put("logs",  logDtos);
        response.put("stats", stats);

        // Include current user status for frontend locking
        User user = userRepo.findById(userId).orElse(null);
        response.put("userStatus", user != null ? user.getStatus() : "ACTIVE");
        
        return response;
    }

    public List<Map<String, Object>> getAllTimeLogs() {
        List<TimeTracking> logs = trackingRepo.findByOrderByLoginTimeDesc();
        List<Map<String, Object>> logDtos = new ArrayList<>();

        for (TimeTracking t : logs) {
            Map<String, Object> dto = new HashMap<>();
            
            // Fetch User Details
            User user = userRepo.findById(t.getUserId()).orElse(null);
            if (user != null) {
                dto.put("userName", user.getName());
                dto.put("role", user.getRole() != null ? user.getRole().getRoleName() : "UNKNOWN");
                dto.put("portalId", user.getStudentId() != null ? user.getStudentId() : String.valueOf(t.getUserId()));
            } else {
                dto.put("userName", "Unknown User");
                dto.put("role", "UNKNOWN");
                dto.put("portalId", String.valueOf(t.getUserId()));
            }

            dto.put("userId",        t.getUserId());   // ← needed for frontend grouping
            dto.put("id",            t.getId());
            dto.put("date",          t.getDate().toString());
            dto.put("loginTime",     t.getLoginTime().toString());
            dto.put("logoutTime",    t.getLogoutTime() != null ? t.getLogoutTime().toString() : null);
            dto.put("totalMinutes",  t.getTotalMinutes());
            dto.put("punchMethod",   t.getPunchMethod());
            dto.put("checkoutReason", t.getCheckoutReason());
            dto.put("distanceIn",    t.getDistanceFromOffice());
            dto.put("distanceOut",   t.getDistanceOut());
            dto.put("lat",           t.getLatitude());
            dto.put("lng",           t.getLongitude());
            
            logDtos.add(dto);
        }
        return logDtos;
    }

    /**
     * Get all sessions for a specific user on a specific date.
     * Used by Admin / SuperAdmin detail modal to show accurate session timeline.
     */
    public Map<String, Object> getUserSessionsForDate(Long userId, LocalDate date) {
        List<TimeTracking> sessions = trackingRepo
                .findByUserIdAndDateOrderByLoginTimeDesc(userId, date);

        User user = userRepo.findById(userId).orElse(null);

        // Calculate total minutes from completed sessions only
        int totalMinutes = sessions.stream()
                .filter(t -> t.getTotalMinutes() != null && t.getTotalMinutes() > 0)
                .mapToInt(TimeTracking::getTotalMinutes)
                .sum();

        boolean isActiveNow = sessions.stream().anyMatch(t -> t.getLogoutTime() == null);

        List<Map<String, Object>> sessionDtos = new ArrayList<>();
        for (int i = 0; i < sessions.size(); i++) {
            TimeTracking t = sessions.get(i);
            Map<String, Object> dto = new HashMap<>();
            dto.put("id",             t.getId());
            dto.put("sessionNumber",  sessions.size() - i); // 1 = oldest
            dto.put("loginTime",      t.getLoginTime().toString());
            dto.put("logoutTime",     t.getLogoutTime() != null ? t.getLogoutTime().toString() : null);
            dto.put("totalMinutes",   t.getTotalMinutes());
            dto.put("punchMethod",    t.getPunchMethod());
            dto.put("checkoutReason", t.getCheckoutReason());
            dto.put("distanceIn",     t.getDistanceFromOffice());
            dto.put("distanceOut",    t.getDistanceOut());
            dto.put("isOpen",         t.getLogoutTime() == null);
            sessionDtos.add(dto);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("userId",       userId);
        result.put("userName",     user != null ? user.getName() : "Unknown");
        result.put("role",         user != null && user.getRole() != null ? user.getRole().getRoleName() : "UNKNOWN");
        result.put("portalId",     user != null && user.getStudentId() != null ? user.getStudentId() : String.valueOf(userId));
        result.put("date",         date.toString());
        result.put("sessions",     sessionDtos);
        result.put("totalMinutes", totalMinutes);
        result.put("isActiveNow",  isActiveNow);
        result.put("sessionCount", sessions.size());
        return result;
    }


    // ─── QR Scan (Core Logic) ────────────────────────────────────────────────

    @Transactional
    public QrScanResponse scanQr(Long userId, QrScanRequest request) {

        // 1. Load user
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // 2. Status / Access Check
        if (user.getStatus() != Status.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Your account is currently INACTIVE. Attendance tracking is disabled. Please contact administration.");
        }

        String roleName = user.getRole() != null ? user.getRole().getRoleName().toUpperCase() : "";

        // 3. Super Admin exempt
        if ("SUPER_ADMIN".equals(roleName) || "SUPERADMIN".equals(roleName)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Super Admins are exempt from punch-in requirements.");
        }

        // 3. Validate QR token
        String storedSecret = getQrSecret();
        boolean isValid = storedSecret.equals(request.getQrToken());

        if (!isValid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid or expired QR code. Please scan the current one displayed at the institute.");
        }

        // 4. Geolocation check & Distance calculation
        double distance = calculateDistance(request.getLatitude(), request.getLongitude());
        validateLocation(request.getLatitude(), request.getLongitude());

        // 5. Punch In / Out Toggle — use findOpenSessionsForToday as single source of truth
        //    This ensures cross-method pairings work: Quick Punch IN → QR Scan OUT and vice versa.
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        String message;
        Map<String, Object> sessionInfo = new HashMap<>();

        // Fetch ALL today's records for session numbering
        List<TimeTracking> todayRecords = trackingRepo
                .findByUserIdAndDateOrderByLoginTimeDesc(userId, today);

        // Fetch ONLY open sessions (no logoutTime) to determine punch direction
        List<TimeTracking> openSessions = trackingRepo.findOpenSessionsForToday(userId, today);

        if (openSessions.isEmpty()) {
            // ─ CASE A: No open session → Punch In ─
            int sessionNumber = todayRecords.size() + 1;

            TimeTracking record = new TimeTracking();
            record.setUserId(userId);
            record.setDate(today);
            record.setLoginTime(now);
            record.setCreatedAt(now);
            record.setLatitude(request.getLatitude());
            record.setLongitude(request.getLongitude());
            record.setDistanceFromOffice(distance);
            record.setPunchMethod("QR_SCAN");
            trackingRepo.save(record);

            message = String.format("Punch In successful! Session #%d started.", sessionNumber);
            sessionInfo.put("punchType",     "IN");
            sessionInfo.put("loginTime",     now.toString());
            sessionInfo.put("date",          today.toString());
            sessionInfo.put("userName",      user.getName());
            sessionInfo.put("role",          roleName);
            sessionInfo.put("studentId",     user.getStudentId() != null ? user.getStudentId() : String.valueOf(userId));
            sessionInfo.put("sessionNumber", sessionNumber);

        } else {
            // ─ CASE B: Open session exists → Punch Out (regardless of how they punched in) ─
            TimeTracking latest = openSessions.get(0); // most recent open session
            int sessionNumber = todayRecords.indexOf(latest) >= 0
                    ? todayRecords.size() - todayRecords.indexOf(latest)
                    : todayRecords.size();

            latest.setLogoutTime(now);
            latest.setCheckoutReason("MANUAL");
            latest.setDistanceOut(distance); // track exit distance

            long diffMinutes = java.time.Duration.between(latest.getLoginTime(), now).toMinutes();
            latest.setTotalMinutes((int) diffMinutes);
            trackingRepo.save(latest);

            long hours = diffMinutes / 60;
            long mins  = diffMinutes % 60;
            String duration = hours > 0
                    ? String.format("%dh %dm", hours, mins)
                    : (mins > 0 ? String.format("%dm", mins) : "< 1m");

            message = String.format("Punch Out successful! Session #%d — Duration: %s.", sessionNumber, duration);
            sessionInfo.put("punchType",    "OUT");
            sessionInfo.put("loginTime",    latest.getLoginTime().toString());
            sessionInfo.put("logoutTime",   now.toString());
            sessionInfo.put("totalMinutes", (int) diffMinutes);
            sessionInfo.put("duration",     duration);
            sessionInfo.put("date",         today.toString());
            sessionInfo.put("userName",     user.getName());
            sessionInfo.put("role",         roleName);
            sessionInfo.put("studentId",    user.getStudentId() != null ? user.getStudentId() : String.valueOf(userId));
            sessionInfo.put("sessionNumber",sessionNumber);
            sessionInfo.put("punchInMethod", latest.getPunchMethod()); // show original punch-in method
        }

        return new QrScanResponse("success", message, sessionInfo);
    }

    // ─── Direct Punch In (portal authenticated, no QR token) ─────────────────
    @Transactional
    public Map<String, Object> directPunchIn(Long userId, Double latitude, Double longitude) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // 2. Status / Access Check
        if (user.getStatus() != Status.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Your account status is INACTIVE. Quick Punch is disabled.");
        }

        String roleName = user.getRole() != null ? user.getRole().getRoleName().toUpperCase() : "";
        if ("SUPER_ADMIN".equals(roleName) || "SUPERADMIN".equals(roleName)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Super Admins are exempt from punch-in.");
        }

        // Location Check
        double distance = calculateDistance(latitude, longitude);
        validateLocation(latitude, longitude);

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        // Check if there is already an open session today
        List<TimeTracking> openSessions = trackingRepo.findOpenSessionsForToday(userId, today);
        if (!openSessions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You are already punched in. Please punch out first.");
        }

        TimeTracking record = new TimeTracking();
        record.setUserId(userId);
        record.setDate(today);
        record.setLoginTime(now);
        record.setCreatedAt(now);
        record.setPunchMethod("QUICK_PUNCH");
        record.setDistanceFromOffice(distance);
        record.setLatitude(latitude);
        record.setLongitude(longitude);
        
        int sessionNumber = trackingRepo.findOpenSessionsForToday(userId, today).size() + 1;
        trackingRepo.save(record);

        return Map.of(
                "status", "SUCCESS",
                "message", String.format("Punched In successfully! Session #%d at %s", sessionNumber, now.format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a")))
        );
    }

    // ─── Direct Punch Out (portal authenticated, no QR token) ────────────────
    @Transactional
    public Map<String, Object> directPunchOut(Long userId, Double latitude, Double longitude) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Location Check
        validateLocation(latitude, longitude);

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        List<TimeTracking> openSessions = trackingRepo.findOpenSessionsForToday(userId, today);
        if (openSessions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No active punch-in session found. Please punch in first.");
        }
        
        TimeTracking record = openSessions.get(0);
        record.setLogoutTime(now);
        record.setCheckoutReason("MANUAL");
        
        // Track exit distance
        double exitDistance = calculateDistance(latitude, longitude);
        record.setDistanceOut(exitDistance);
        
        long diffMinutes = 0;
        if (record.getLoginTime() != null) {
            diffMinutes = java.time.Duration.between(record.getLoginTime(), now).toMinutes();
        }
        record.setTotalMinutes((int) diffMinutes);
        
        long hours = diffMinutes / 60;
        long mins  = diffMinutes % 60;
        String duration = hours > 0
                ? String.format("%dh %dm", hours, mins)
                : (mins > 0 ? String.format("%dm", mins) : "< 1m");

        trackingRepo.save(record);

        return Map.of(
                "status", "SUCCESS",
                "message", String.format("Punched Out successful! Duration: %s", duration),
                "duration", duration,
                "punchInMethod", record.getPunchMethod() != null ? record.getPunchMethod() : "UNKNOWN"
        );
    }

    // ─── Auto-Checkout (Geofence Exit or Manual Trigger) ───────────────────
    @Transactional
    public Map<String, Object> autoCheckout(Long userId, String reason, Double distance) {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        List<TimeTracking> openSessions = trackingRepo.findOpenSessionsForToday(userId, today);
        if (openSessions.isEmpty()) {
            return Map.of("status", "ALREADY_CLOSED", "message", "No active session found.");
        }

        TimeTracking record = openSessions.get(0);
        record.setLogoutTime(now);
        record.setCheckoutReason(reason != null ? reason : "GEOFENCE_EXIT");
        record.setDistanceOut(distance);
        long diffMinutes = java.time.Duration.between(record.getLoginTime(), now).toMinutes();
        record.setTotalMinutes((int) diffMinutes);
        trackingRepo.save(record);

        // Record violation for geofence exit
        if ("GEOFENCE_EXIT".equals(reason)) {
            recordViolationIfNotDuplicate(userId, today, "GEOFENCE_EXIT",
                    "Left institute premises without punching out. Auto-checked out by geofence.");
        }

        long hours = diffMinutes / 60;
        long mins  = diffMinutes % 60;
        String duration = hours > 0 ? String.format("%dh %dm", hours, mins) : String.format("%dm", mins);

        return Map.of(
            "status",        "CHECKED_OUT",
            "reason",        reason,
            "logoutTime",    now.toString(),
            "totalMinutes",  (int) diffMinutes,
            "duration",      duration,
            "distanceOut",   distance != null ? distance : 0.0
        );
    }

    // ─── Midnight Auto-Checkout for ALL users ───────────────────────────────
    @Transactional
    public void autoCheckoutAllOpenSessions(LocalDate date) {
        List<TimeTracking> openSessions = trackingRepo.findAllOpenSessionsForDate(date);
        LocalDateTime endOfDay = date.atTime(23, 59, 0);

        for (TimeTracking session : openSessions) {
            session.setLogoutTime(endOfDay);
            session.setCheckoutReason("MIDNIGHT_AUTO_CLOSE");
            long diffMinutes = java.time.Duration.between(session.getLoginTime(), endOfDay).toMinutes();
            session.setTotalMinutes((int) diffMinutes);
            trackingRepo.save(session);

            // Record violation: forgot to punch out (system closed at midnight)
            recordViolationIfNotDuplicate(session.getUserId(), date, "FORGOT_PUNCH_OUT",
                    "Did not punch out before end of day. Session auto-closed at 23:59.");
        }
    }

    // ─── Record violation safely (no duplicates) ───────────────────────────
    private void recordViolationIfNotDuplicate(Long userId, LocalDate date, String type, String description) {
        try {
            long existing = violationRepo.countByUserIdAndViolationDateAndType(userId, date, type);
            if (existing > 0) return; // already recorded

            userRepo.findById(userId).ifPresent(user -> {
                String roleName = user.getRole() != null ? user.getRole().getRoleName() : "UNKNOWN";
                String portalId = user.getPortalId() != null ? user.getPortalId() : user.getStudentId();
                AttendanceViolation v = new AttendanceViolation(
                        userId, user.getName(), roleName, portalId, date, type, description);
                violationRepo.save(v);
            });
        } catch (Exception ignored) {
            // Violations are non-critical — never block the main punch flow
        }
    }

    // ─── Geofencing Helper ──────────────────────────────────────────────────
    private void validateLocation(Double lat, Double lng) {
        String officeLat  = getSetting("office_latitude",      "0.0");
        String officeLng  = getSetting("office_longitude",     "0.0");
        String radiusStr  = getSetting("office_radius_meters", "200");

        if (lat != null && lng != null) {
            if (!"0.0".equals(officeLat) && !"0.0".equals(officeLng)) {
                double oLat   = parseDouble(officeLat);
                double oLng   = parseDouble(officeLng);
                double radius = parseDouble(radiusStr);
                double dist   = HaversineUtil.distanceMeters(lat, lng, oLat, oLng);

                if (dist > radius) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            String.format("You are %dm away from the office. Punching is only allowed within %dm. " +
                                    "Please move closer to the institute.", (int) dist, (int) radius));
                }
            }
        } else {
            // Location not provided — reject only if office coords are configured
            if (!"0.0".equals(officeLat)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Location access is required to punch in/out. Please enable location services in your browser.");
            }
        }
    }

    private double calculateDistance(Double lat, Double lng) {
        if (lat == null || lng == null) return 0.0;
        String officeLat = getSetting("office_latitude", "0.0");
        String officeLng = getSetting("office_longitude", "0.0");
        if ("0.0".equals(officeLat) || "0.0".equals(officeLng)) return 0.0;

        return HaversineUtil.distanceMeters(lat, lng, parseDouble(officeLat), parseDouble(officeLng));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private String getSetting(String key, String defaultValue) {
        return settingRepo.findById(key)
                .map(SystemSetting::getSettingValue)
                .orElse(defaultValue);
    }

    @Transactional
    private void saveSetting(String key, String value) {
        settingRepo.save(new SystemSetting(key, value));
    }

    private double parseDouble(String s) {
        try { return Double.parseDouble(s); } catch (Exception e) { return 0.0; }
    }
}

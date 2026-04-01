package com.lms.service;

import com.lms.dto.QrScanRequest;
import com.lms.dto.QrScanResponse;
import com.lms.entity.SystemSetting;
import com.lms.entity.TimeTracking;
import com.lms.entity.User;
import com.lms.repository.SystemSettingRepository;
import com.lms.repository.TimeTrackingRepository;
import com.lms.repository.UserRepository;
import com.lms.util.HaversineUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class QrAttendanceService {

    private final SystemSettingRepository settingRepo;
    private final TimeTrackingRepository trackingRepo;
    private final UserRepository userRepo;

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

    public Map<String, Object> getPunchSettings() {
        Map<String, Object> result = new HashMap<>();
        result.put("latitude",      parseDouble(getSetting("office_latitude", "0.0")));
        result.put("longitude",     parseDouble(getSetting("office_longitude", "0.0")));
        result.put("radiusMeters",  parseDouble(getSetting("office_radius_meters", "200")));
        result.put("lateThreshold", getSetting("late_threshold_time", "10:00"));
        return result;
    }

    @Transactional
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
            dto.put("sessionCount",  1); 
            logDtos.add(dto);
        }

        // Stats
        double totalMinutes = logs.stream()
                .filter(t -> t.getTotalMinutes() != null)
                .mapToInt(TimeTracking::getTotalMinutes)
                .sum();

        int totalDays = (int) logs.stream().map(TimeTracking::getDate).distinct().count();
        String avgHours = totalDays > 0
                ? String.format("%.1fh", (totalMinutes / totalDays) / 60.0)
                : "0h";

        boolean isActiveToday = trackingRepo.findOpenSessionForToday(userId, LocalDate.now()).isPresent();

        Map<String, Object> stats = new HashMap<>();
        stats.put("avgHours",    avgHours);
        stats.put("totalDays",   totalDays);
        stats.put("activeToday", isActiveToday ? 1 : 0);

        Map<String, Object> response = new HashMap<>();
        response.put("logs",  logDtos);
        response.put("stats", stats);
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

            dto.put("id",            t.getId());
            dto.put("date",          t.getDate().toString());
            dto.put("loginTime",     t.getLoginTime().toString());
            dto.put("logoutTime",    t.getLogoutTime() != null ? t.getLogoutTime().toString() : null);
            dto.put("totalMinutes",  t.getTotalMinutes());
            dto.put("punchMethod",   t.getPunchMethod());
            dto.put("checkoutReason", t.getCheckoutReason());
            dto.put("distanceIn",    t.getDistanceFromOffice());
            dto.put("lat",           t.getLatitude());
            dto.put("lng",           t.getLongitude());
            
            logDtos.add(dto);
        }
        return logDtos;
    }

    // ─── QR Scan (Core Logic) ────────────────────────────────────────────────

    @Transactional
    public QrScanResponse scanQr(Long userId, QrScanRequest request) {

        // 1. Load user
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String roleName = user.getRole() != null ? user.getRole().getRoleName().toUpperCase() : "";

        // 2. Super Admin exempt
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

        // 5. Punch In / Out Toggle
        LocalDate today = LocalDate.now();
        List<TimeTracking> todayRecords = trackingRepo
                .findByUserIdAndDateOrderByLoginTimeDesc(userId, today);

        TimeTracking latest  = todayRecords.isEmpty() ? null : todayRecords.get(0);
        LocalDateTime now    = LocalDateTime.now();
        String message;
        Map<String, Object> sessionInfo = new HashMap<>();

        if (latest == null || latest.getLogoutTime() != null) {
            // ─ CASE A: Punch In ─
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
            // ─ CASE B: Punch Out ─
            int sessionNumber = todayRecords.size();
            latest.setLogoutTime(now);
            latest.setCheckoutReason("MANUAL");

            long diffMinutes = java.time.Duration.between(latest.getLoginTime(), now).toMinutes();
            latest.setTotalMinutes((int) diffMinutes);
            trackingRepo.save(latest);

            long hours = diffMinutes / 60;
            long mins  = diffMinutes % 60;
            String duration = hours > 0
                    ? String.format("%dh %dm", hours, mins)
                    : String.format("%dm", mins);

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
        }

        return new QrScanResponse("success", message, sessionInfo);
    }

    // ─── Direct Punch In (portal authenticated, no QR token) ─────────────────
    @Transactional
    public Map<String, Object> directPunchIn(Long userId, Double latitude, Double longitude) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

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
        Optional<TimeTracking> openOpt = trackingRepo.findOpenSessionForToday(userId, today);
        if (openOpt.isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You are already punched in. Please punch out first.");
        }

        TimeTracking record = new TimeTracking();
        record.setUserId(userId);
        record.setDate(today);
        record.setLoginTime(now);
        record.setCreatedAt(now);
        record.setLatitude(latitude);
        record.setLongitude(longitude);
        record.setDistanceFromOffice(distance);
        record.setPunchMethod("QUICK_PUNCH");
        trackingRepo.save(record);

        int sessionNumber = trackingRepo.findByUserIdAndDateOrderByLoginTimeDesc(userId, today).size();
        return Map.of(
            "status",         "success",
            "punchType",      "IN",
            "message",        String.format("Punched In! Session #%d started.", sessionNumber),
            "loginTime",      now.toString(),
            "date",           today.toString(),
            "sessionNumber",  sessionNumber
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

        Optional<TimeTracking> openOpt = trackingRepo.findOpenSessionForToday(userId, today);
        if (openOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No active punch-in session found. Please punch in first.");
        }

        TimeTracking record = openOpt.get();
        record.setLogoutTime(now);
        record.setCheckoutReason("MANUAL");
        long diffMinutes = java.time.Duration.between(record.getLoginTime(), now).toMinutes();
        record.setTotalMinutes((int) diffMinutes);
        trackingRepo.save(record);

        long hours = diffMinutes / 60;
        long mins  = diffMinutes % 60;
        String duration = hours > 0 ? String.format("%dh %dm", hours, mins) : String.format("%dm", mins);

        return Map.of(
            "status",        "success",
            "punchType",     "OUT",
            "message",       String.format("Punched Out! Duration: %s.", duration),
            "logoutTime",    now.toString(),
            "totalMinutes",  (int) diffMinutes,
            "duration",      duration
        );
    }

    // ─── Auto-Checkout (Geofence Exit or Manual Trigger) ───────────────────
    @Transactional
    public Map<String, Object> autoCheckout(Long userId, String reason) {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        Optional<TimeTracking> openOpt = trackingRepo.findOpenSessionForToday(userId, today);
        if (openOpt.isEmpty()) {
            return Map.of("status", "ALREADY_CLOSED", "message", "No active session found.");
        }

        TimeTracking record = openOpt.get();
        record.setLogoutTime(now);
        record.setCheckoutReason(reason != null ? reason : "GEOFENCE_EXIT");
        long diffMinutes = java.time.Duration.between(record.getLoginTime(), now).toMinutes();
        record.setTotalMinutes((int) diffMinutes);
        trackingRepo.save(record);

        long hours = diffMinutes / 60;
        long mins  = diffMinutes % 60;
        String duration = hours > 0 ? String.format("%dh %dm", hours, mins) : String.format("%dm", mins);

        return Map.of(
            "status",        "CHECKED_OUT",
            "reason",        reason,
            "logoutTime",    now.toString(),
            "totalMinutes",  (int) diffMinutes,
            "duration",      duration
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

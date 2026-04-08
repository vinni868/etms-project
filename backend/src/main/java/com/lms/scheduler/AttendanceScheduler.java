package com.lms.scheduler;

import com.lms.entity.AttendanceViolation;
import com.lms.entity.TrainerMarkedAttendance;
import com.lms.entity.User;
import com.lms.repository.AttendanceRepository;
import com.lms.repository.AttendanceViolationRepository;
import com.lms.repository.UserRepository;
import com.lms.service.QrAttendanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AttendanceScheduler {

    private final QrAttendanceService qrAttendanceService;
    private final AttendanceRepository attendanceRepository;
    private final AttendanceViolationRepository violationRepo;
    private final UserRepository userRepo;

    /**
     * Midnight Auto-Checkout
     * Runs every day at 23:59:00
     * Closes all open sessions for the current day.
     */
    @Scheduled(cron = "0 59 23 * * *")
    public void scheduledMidnightCheckout() {
        LocalDate today = LocalDate.now();
        log.info("Starting Midnight Auto-Checkout for date: {}", today);
        try {
            qrAttendanceService.autoCheckoutAllOpenSessions(today);
            log.info("Midnight Auto-Checkout completed successfully for {}", today);
        } catch (Exception e) {
            log.error("Error during Midnight Auto-Checkout for {}: {}", today, e.getMessage());
        }
    }

    /**
     * Trainer-Marked Absent Violations
     * Runs every day at 23:50:00 (before midnight checkout)
     * Records violations for students marked ABSENT by trainer today.
     */
    @Scheduled(cron = "0 50 23 * * *")
    public void recordTrainerMarkedAbsentViolations() {
        LocalDate today = LocalDate.now();
        log.info("Checking trainer-marked absent records for date: {}", today);
        try {
            // Get all records from today
            List<TrainerMarkedAttendance> allToday = attendanceRepository.findAll()
                    .stream()
                    .filter(a -> today.equals(a.getAttendanceDate()) && "ABSENT".equalsIgnoreCase(a.getStatus()))
                    .toList();

            for (TrainerMarkedAttendance record : allToday) {
                Long studentId = record.getStudentId().longValue();
                String violationType = "TRAINER_MARKED_ABSENT";

                // Skip if violation already recorded for this student+date
                long existing = violationRepo.countByUserIdAndViolationDateAndType(studentId, today, violationType);
                if (existing > 0) continue;

                Optional<User> userOpt = userRepo.findById(studentId);
                userOpt.ifPresent(user -> {
                    String roleName = user.getRole() != null ? user.getRole().getRoleName() : "STUDENT";
                    String portalId = user.getPortalId() != null ? user.getPortalId() : user.getStudentId();
                    AttendanceViolation v = new AttendanceViolation(
                            studentId,
                            user.getName(),
                            roleName,
                            portalId,
                            today,
                            violationType,
                            "Marked ABSENT by trainer for today's session."
                    );
                    violationRepo.save(v);
                });
            }
            log.info("Trainer-marked absent violations recorded for {}", today);
        } catch (Exception e) {
            log.error("Error recording trainer-marked absent violations for {}: {}", today, e.getMessage());
        }
    }
}

package com.lms.scheduler;

import com.lms.service.QrAttendanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class AttendanceScheduler {

    private final QrAttendanceService qrAttendanceService;

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
}

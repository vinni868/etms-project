package com.lms.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "time_tracking")
@Data
@NoArgsConstructor
public class TimeTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "login_time", nullable = false)
    private LocalDateTime loginTime;

    @Column(name = "logout_time")
    private LocalDateTime logoutTime;

    @Column(name = "total_minutes")
    private Integer totalMinutes;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "distance_from_office")
    private Double distanceFromOffice;

    @Column(name = "distance_out")
    private Double distanceOut;

    @Column(name = "punch_method")
    private String punchMethod; // "QR_SCAN", "QUICK_PUNCH"

    @Column(name = "checkout_reason")
    private String checkoutReason; // "MANUAL", "GEOFENCE_EXIT", "MIDNIGHT_AUTO_CLOSE"

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}

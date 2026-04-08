package com.lms.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_violations")
@Data
@NoArgsConstructor
public class AttendanceViolation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "role")
    private String role;

    @Column(name = "portal_id")
    private String portalId;

    @Column(name = "violation_date", nullable = false)
    private LocalDate violationDate;

    // FORGOT_PUNCH_OUT | GEOFENCE_EXIT | MIDNIGHT_AUTO_CLOSE | TRAINER_MARKED_ABSENT
    @Column(name = "violation_type", nullable = false, length = 50)
    private String violationType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public AttendanceViolation(Long userId, String userName, String role, String portalId,
                                LocalDate violationDate, String violationType, String description) {
        this.userId = userId;
        this.userName = userName;
        this.role = role;
        this.portalId = portalId;
        this.violationDate = violationDate;
        this.violationType = violationType;
        this.description = description;
        this.createdAt = LocalDateTime.now();
    }
}

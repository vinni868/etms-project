package com.lms.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "counselor_profiles")
@Data
public class CounselorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    private String phone;
    private String gender;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(columnDefinition = "LONGTEXT")
    private String profilePic;

    private String address;
    private String city;
    private String state;
    private String pincode;

    // Counselor-specific fields
    private String specialization; // e.g., Career Counseling, Mental Health, Academic

    @Column(name = "years_of_experience")
    private String yearsOfExperience;

    @Column(columnDefinition = "TEXT")
    private String certifications; // e.g., NLP, CBT, Career Counseling

    @Column(columnDefinition = "TEXT")
    private String availability; // Availability info (days/hours)

    private String studentId; // Portal ID mapping
}

package com.lms.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "marketer_profiles")
@Data
public class MarketerProfile {

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

    // Marketer-specific fields
    private String department; // e.g., Digital Marketing, Lead Generation, Content

    @Column(name = "target_region")
    private String targetRegion; // e.g., Bangalore, Hyderabad, Pan-India

    @Column(name = "monthly_target")
    private String monthlyTarget; // Lead count or revenue target

    @Column(columnDefinition = "TEXT")
    private String skills; // e.g., SEO, PPC, Content Marketing, Social Media

    private String studentId; // Portal ID mapping
}

package com.lms.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "admin_profiles")
@Data
public class AdminProfile {

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
    
    // Administrative fields
    private String adminTitle;
    private String emergencyContact;
    
    private String studentId; // Mapping for identification
}

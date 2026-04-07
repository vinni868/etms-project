package com.lms.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "students")
@Data
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(name = "student_id", unique = true, length = 30)
    private String studentId;

    private String name;

    @Column(unique = true)
    private String email;

    private String phone;

    private String gender;

    private String qualification;

    @Column(name = "year_of_passing")
    private String yearOfPassing;

    @Column(name = "aggregate_percentage")
    private String aggregatePercentage;

    @Column(name = "marks_10th")
    private String marks10th;

    @Column(name = "marks_12th")
    private String marks12th;

    @Column(name = "parent_name")
    private String parentName;

    @Column(name = "parent_phone")
    private String parentPhone;

    private String skills;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "profile_pic", columnDefinition = "LONGTEXT")
    private String profilePic;

    @Column(name = "aadhar_card_url", columnDefinition = "TEXT")
    private String aadharCardUrl;

    @Column(name = "resume_url", columnDefinition = "TEXT")
    private String resumeUrl;

    @Column(name = "marks_10th_url", columnDefinition = "TEXT")
    private String marks10thUrl;

    @Column(name = "marks_12th_url", columnDefinition = "TEXT")
    private String marks12thUrl;

    @Column(name = "graduation_doc_url", columnDefinition = "TEXT")
    private String graduationDocUrl;

    private String address;
    private String city;
    private String state;
    private String pincode;

    // ── Identity Verification ──────────────────────────────────────────────
    @Column(name = "aadhar_number", length = 12)
    private String aadharNumber;

    @Column(name = "aadhar_name")
    private String aadharName; // Full name as on Aadhar (used as profile display name)

    // ── Bank Details ───────────────────────────────────────────────────────
    @Column(name = "bank_account_number")
    private String bankAccountNumber;

    @Column(name = "bank_ifsc_code", length = 20)
    private String bankIfscCode;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "bank_account_holder")
    private String bankAccountHolder;

    @Column(name = "bank_account_type", length = 20)
    private String bankAccountType; // SAVINGS / CURRENT
}
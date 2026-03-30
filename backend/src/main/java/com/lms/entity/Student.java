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

    private String year;

    private String skills;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "profile_pic", columnDefinition = "LONGTEXT")
    private String profilePic;

    private String address;

    private String city;

    private String state;

    private String pincode;
}
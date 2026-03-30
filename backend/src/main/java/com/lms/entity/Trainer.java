package com.lms.entity;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "trainers")
@Data // Using Lombok to handle Getters/Setters
public class Trainer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(name = "student_id", unique = true, length = 30)
    private String studentId;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    private String phone;
    private String gender;
    private String specialization;
    private String experience;
    private String qualification;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(columnDefinition = "LONGTEXT")
    private String profilePic; // Matches 'profilePic' in React state

    private String address;
    private String city;
    private String state;
    private String pincode;
}
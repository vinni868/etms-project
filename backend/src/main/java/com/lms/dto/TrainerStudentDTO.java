package com.lms.dto;

public class TrainerStudentDTO {

    private Integer id;
    private String name;
    private String email;
    private String phone;
    private String studentId; // Standardized ID (e.g., ETMS-ST-2026-0001)
    private String batchName;
    private String courseName;
    private String courseMode; // ONLINE, OFFLINE, HYBRID

    // Constructor for batch-wise students
    public TrainerStudentDTO(Integer id, String name, String email, String phone, String studentId, String courseMode) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.studentId = studentId;
        this.courseMode = courseMode;
    }

    // Constructor for trainer-wide students
    public TrainerStudentDTO(Integer id, String name, String email,
                             String phone, String studentId, String batchName, String courseName, String courseMode) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.studentId = studentId;
        this.batchName = batchName;
        this.courseName = courseName;
        this.courseMode = courseMode;
    }

    // Getters
    public Integer getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getStudentId() { return studentId; }
    public String getBatchName() { return batchName; }
    public String getCourseName() { return courseName; }
    public String getCourseMode() { return courseMode; }
}
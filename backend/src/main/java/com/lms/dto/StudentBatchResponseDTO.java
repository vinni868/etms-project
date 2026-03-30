package com.lms.dto;

public class StudentBatchResponseDTO {

    private Long studentId;
    private String studentName;
    private String studentEmail;

    private Long batchId;
    private String batchName;

    private String courseName;

    public StudentBatchResponseDTO(Long studentId, String studentName, String studentEmail,
                                   Long batchId, String batchName, String courseName) {
        this.studentId = studentId;
        this.studentName = studentName;
        this.studentEmail = studentEmail;
        this.batchId = batchId;
        this.batchName = batchName;
        this.courseName = courseName;
    }

    public Long getStudentId() { return studentId; }
    public String getStudentName() { return studentName; }
    public String getStudentEmail() { return studentEmail; }
    public Long getBatchId() { return batchId; }
    public String getBatchName() { return batchName; }
    public String getCourseName() { return courseName; }
}
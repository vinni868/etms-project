package com.lms.dto;

import java.time.LocalDate;

public class AttendanceRequest {

    private Integer studentId;
    private String status;  // PRESENT / ABSENT / LEAVE

    // getters and setters
    public Integer getStudentId() { return studentId; }
    public void setStudentId(Integer studentId) { this.studentId = studentId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
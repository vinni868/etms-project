package com.lms.dto;

import java.time.LocalDate;

public interface AttendanceHistoryDTO {
    LocalDate getAttendanceDate();
    String getStudentName();
    String getFormattedId();
    Long getStudentId();
    String getTopic();
    String getStatus();
    Integer getLateMinutes();
}
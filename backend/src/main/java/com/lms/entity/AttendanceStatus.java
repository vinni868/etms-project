package com.lms.entity;

/**
 * Declaring this as 'public' is crucial so that the 
 * StudentAttendanceController can see and use it.
 */
public enum AttendanceStatus {
    PRESENT,
    ABSENT,
    LEAVE
}
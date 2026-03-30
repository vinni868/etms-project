package com.lms.dto;

import java.util.List;

public class DashboardResponse {

    // -------------------------------------------------
    // EXISTING FIELDS
    // -------------------------------------------------
    private long totalCourses;
    private long totalTrainers;
    private long totalStudents;
    private long activeBatches;
    private long pendingApprovals;
    private List<String> recentActivities;

    // -------------------------------------------------
    // SUPER ADMIN FIELDS
    // -------------------------------------------------
    private long totalAdmins;
    private long totalSubAdmins;   // ✅ NEW FIELD
    private long totalMarketers;
    private long totalRevenue;

    // -------------------------------------------------
    // EXISTING CONSTRUCTOR (UNCHANGED - for normal dashboard)
    // -------------------------------------------------
    public DashboardResponse(long totalCourses,
                             long totalTrainers,
                             long totalStudents,
                             long activeBatches,
                             long pendingApprovals,
                             List<String> recentActivities) {

        this.totalCourses = totalCourses;
        this.totalTrainers = totalTrainers;
        this.totalStudents = totalStudents;
        this.activeBatches = activeBatches;
        this.pendingApprovals = pendingApprovals;
        this.recentActivities = recentActivities;
    }

    // -------------------------------------------------
    // SUPER ADMIN CONSTRUCTOR (UPDATED)
    // -------------------------------------------------
    public DashboardResponse(long totalCourses,
                             long totalTrainers,
                             long totalStudents,
                             long activeBatches,
                             long totalAdmins,
                             long totalSubAdmins,   // ✅ added
                             long totalMarketers,
                             long totalRevenue,
                             List<String> recentActivities) {

        this.totalCourses = totalCourses;
        this.totalTrainers = totalTrainers;
        this.totalStudents = totalStudents;
        this.activeBatches = activeBatches;
        this.totalAdmins = totalAdmins;
        this.totalSubAdmins = totalSubAdmins;   // ✅ set value
        this.totalMarketers = totalMarketers;
        this.totalRevenue = totalRevenue;
        this.recentActivities = recentActivities;
    }

    // -------------------------------------------------
    // GETTERS
    // -------------------------------------------------

    public long getTotalCourses() {
        return totalCourses;
    }

    public long getTotalTrainers() {
        return totalTrainers;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public long getActiveBatches() {
        return activeBatches;
    }

    public long getPendingApprovals() {
        return pendingApprovals;
    }

    public List<String> getRecentActivities() {
        return recentActivities;
    }

    public long getTotalAdmins() {
        return totalAdmins;
    }

    public long getTotalSubAdmins() {   // ✅ NEW GETTER
        return totalSubAdmins;
    }

    public long getTotalMarketers() {
        return totalMarketers;
    }

    public long getTotalRevenue() {
        return totalRevenue;
    }
}

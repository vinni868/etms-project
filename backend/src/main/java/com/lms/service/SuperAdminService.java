package com.lms.service;

import com.lms.dto.DashboardResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SuperAdminService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public DashboardResponse getDashboardStats() {

        Long totalStudents = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users u JOIN role_master r ON u.role_id = r.id WHERE r.role_name = 'STUDENT'",
                Long.class);

        Long totalTrainers = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users u JOIN role_master r ON u.role_id = r.id WHERE r.role_name = 'TRAINER'",
                Long.class);

        Long totalAdmins = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users u JOIN role_master r ON u.role_id = r.id WHERE r.role_name = 'ADMIN'",
                Long.class);

        // ✅ Added SUB_ADMIN
        Long totalSubAdmins = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users u JOIN role_master r ON u.role_id = r.id WHERE r.role_name = 'SUB_ADMIN'",
                Long.class);

        Long totalMarketers = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users u JOIN role_master r ON u.role_id = r.id WHERE r.role_name = 'MARKETER'",
                Long.class);

        Long totalCourses = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM course_master",
                Long.class);

        Long activeBatches = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM batches WHERE status = 'ONGOING'",
                Long.class);

        Long totalRevenue = jdbcTemplate.queryForObject(
                "SELECT IFNULL(SUM(amount), 0) FROM fees",
                Long.class);

        // Recent activities
        List<String> recentActivities = jdbcTemplate.query(
                "SELECT CONCAT(name, ' registered as ', r.role_name) " +
                        "FROM users u JOIN role_master r ON u.role_id = r.id " +
                        "ORDER BY u.created_at DESC LIMIT 5",
                (rs, rowNum) -> rs.getString(1)
        );

        return new DashboardResponse(
                totalCourses != null ? totalCourses : 0,
                totalTrainers != null ? totalTrainers : 0,
                totalStudents != null ? totalStudents : 0,
                activeBatches != null ? activeBatches : 0,
                totalAdmins != null ? totalAdmins : 0,
                totalSubAdmins != null ? totalSubAdmins : 0,   
                totalMarketers != null ? totalMarketers : 0,
                totalRevenue != null ? totalRevenue : 0,
                recentActivities != null ? recentActivities : new ArrayList<>()
        );
    }
}

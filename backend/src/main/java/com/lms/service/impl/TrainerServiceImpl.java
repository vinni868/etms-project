package com.lms.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.lms.dto.TrainerBatchDTO;
import com.lms.dto.TrainerCourseDTO;
import com.lms.dto.TrainerProfileDTO;
import com.lms.dto.TrainerStudentDTO;
import com.lms.service.TrainerService;

@Service
public class TrainerServiceImpl implements TrainerService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // ================= GET TRAINER PROFILE =================
    @Override
    public TrainerProfileDTO getProfile(String email) {

        String sql = """
            SELECT u.name,
                   u.email,
                   u.phone,
                   t.specialization,
                   t.experience,
                   t.qualification,
                   t.bio
            FROM users u
            LEFT JOIN trainer_details t ON t.user_id = u.id
            WHERE u.email = ?
        """;

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) ->
                new TrainerProfileDTO(
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getString("specialization"),
                        rs.getString("experience"),
                        rs.getString("qualification"),
                        rs.getString("bio")
                ), email);
    }

    // ================= UPDATE TRAINER PROFILE =================
    @Override
    public void updateProfile(String email, TrainerProfileDTO dto) {

        // 🔹 1. Update users table
        String updateUserSql = """
            UPDATE users
            SET name = ?, phone = ?
            WHERE email = ?
        """;

        int userRows = jdbcTemplate.update(updateUserSql,
                dto.getName(),
                dto.getPhone(),
                email
        );

        // 🔹 2. Check if trainer_details exists
        String checkSql = """
            SELECT COUNT(*)
            FROM trainer_details t
            JOIN users u ON t.user_id = u.id
            WHERE u.email = ?
        """;

        Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, email);

        if (count != null && count > 0) {

            // 🔹 3A. Update trainer_details if exists
            String updateTrainerSql = """
                UPDATE trainer_details t
                JOIN users u ON t.user_id = u.id
                SET t.specialization = ?,
                    t.experience = ?,
                    t.qualification = ?,
                    t.bio = ?
                WHERE u.email = ?
            """;

            jdbcTemplate.update(updateTrainerSql,
                    dto.getSpecialization(),
                    dto.getExperience(),
                    dto.getQualification(),
                    dto.getBio(),
                    email
            );

        } else {

            // 🔹 3B. Insert if not exists
            String insertSql = """
                INSERT INTO trainer_details (user_id, specialization, experience, qualification, bio)
                SELECT id, ?, ?, ?, ?
                FROM users
                WHERE email = ?
            """;

            jdbcTemplate.update(insertSql,
                    dto.getSpecialization(),
                    dto.getExperience(),
                    dto.getQualification(),
                    dto.getBio(),
                    email
            );
        }

        System.out.println("Profile updated successfully for email: " + email);
    }

    // ================= GET TRAINER COURSES =================
    @Override
    public List<TrainerCourseDTO> getTrainerCourses(Integer trainerId) {

        String sql = """
            SELECT c.id, c.course_name, c.duration,
                   COUNT(b.id) as total_batches
            FROM course_master c
            JOIN batches b ON b.course_id = c.id
            WHERE b.trainer_id = ?
            GROUP BY c.id, c.course_name, c.duration
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new TrainerCourseDTO(
                        rs.getInt("id"),
                        rs.getString("course_name"),
                        rs.getString("duration"),
                        rs.getInt("total_batches")
                ), trainerId);
    }

    // ================= GET BATCHES BY COURSE =================
    @Override
    public List<TrainerBatchDTO> getBatchesByCourse(Integer trainerId, Integer courseId) {

        String sql = """
            SELECT id, batch_name, status
            FROM batches
            WHERE trainer_id = ? AND course_id = ?
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new TrainerBatchDTO(
                        rs.getInt("id"),
                        rs.getString("batch_name"),
                        rs.getString("status")
                ), trainerId, courseId);
    }

    // ================= GET STUDENTS BY BATCH =================
    @Override
    public List<TrainerStudentDTO> getStudentsByBatch(Integer batchId) {

        String sql = """
            SELECT u.id, u.name, u.email, u.phone, u.student_id,
                   COALESCE((SELECT sc.course_mode FROM student_course sc WHERE sc.student_id = u.id ORDER BY sc.id DESC LIMIT 1), 'OFFLINE') as course_mode
            FROM student_batches sb
            JOIN users u ON sb.student_id = u.id
            WHERE sb.batch_id = ? AND sb.status = 'ACTIVE'
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new TrainerStudentDTO(
                        rs.getInt("id"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getString("student_id"),
                        rs.getString("course_mode")
                ), batchId);
    }

    // ================= GET ALL STUDENTS UNDER TRAINER =================
    @Override
    public List<TrainerStudentDTO> getAllStudentsUnderTrainer(Integer trainerId) {

        String sql = """
            SELECT DISTINCT u.id,
                   u.name,
                   u.email,
                   u.phone,
                   u.student_id,
                   b.batch_name,
                   COALESCE((SELECT cm.course_name FROM student_course sc JOIN course_master cm ON sc.course_id = cm.id WHERE sc.student_id = u.id ORDER BY sc.id DESC LIMIT 1), 'N/A') as course_name,
                   COALESCE((SELECT sc.course_mode FROM student_course sc WHERE sc.student_id = u.id ORDER BY sc.id DESC LIMIT 1), 'OFFLINE') as course_mode
            FROM batches b
            JOIN student_batches sb ON sb.batch_id = b.id
            JOIN users u ON sb.student_id = u.id
            WHERE b.trainer_id = ?
              AND sb.status = 'ACTIVE'
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new TrainerStudentDTO(
                        rs.getInt("id"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getString("student_id"),
                        rs.getString("batch_name"),
                        rs.getString("course_name"),
                        rs.getString("course_mode")
                ), trainerId);
    }
}
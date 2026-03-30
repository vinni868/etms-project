package com.lms.service;

import java.util.List;
import java.util.Map;

import com.lms.dto.CourseFullDetailsDTO;
import com.lms.dto.DashboardResponse;
import com.lms.entity.CourseMaster;

public interface AdminService {

    DashboardResponse getDashboardData();

    void createCourse(CourseMaster course);

    List<CourseMaster> getAllCourses();

    void updateCourse(Long id, CourseMaster course);

    // ✅ SOFT DELETE
    void deleteCourse(Long id);

    List<CourseFullDetailsDTO> getAllCoursesWithDetails();

    // ✅ MANAGE STUDENTS
    List<Map<String, Object>> getStudentCourseMappings();
    List<Map<String, Object>> getStudentBatchMappings();
    void mapStudentToCourse(Long studentId, Long courseId, Double feePaid, Double feePending, String courseMode);
    void mapStudentToBatch(Long studentId, Long batchId);
    void removeStudentFromBatch(Long mappingId);
}
package com.lms.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.lms.dto.BatchDetailsDTO;
import com.lms.dto.CourseFullDetailsDTO;
import com.lms.dto.DashboardResponse;
import com.lms.entity.*;
import com.lms.enums.Status;
import com.lms.repository.*;
import com.lms.service.AdminService;

import java.util.*;
import java.time.LocalDateTime;

@Service
public class AdminServiceImpl implements AdminService {

    @Autowired private CourseRepository courseRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private BatchRepository batchRepository;
    @Autowired private StudentBatchesRepository studentBatchesRepository;
    @Autowired private StudentCourseRepository studentCourseRepository;

    // ================= DASHBOARD =================
    @Override
    public DashboardResponse getDashboardData() {
        long totalCourses  = courseRepository.count();
        long totalTrainers = userRepository.countByRole_RoleNameAndStatus("TRAINER", Status.ACTIVE);
        long totalStudents = userRepository.countByRole_RoleNameAndStatus("STUDENT", Status.ACTIVE);
        long activeBatches = batchRepository.countByStatus("ONGOING");
        long pendingApprovals = userRepository.countByApprovalStatusAndRole_RoleName(com.lms.enums.ApprovalStatus.PENDING, "STUDENT");
        return new DashboardResponse(totalCourses, totalTrainers, totalStudents, activeBatches, pendingApprovals, Collections.emptyList());
    }

    // ================= COURSE =================
    @Override
    public void createCourse(CourseMaster course) { courseRepository.save(course); }

    @Override
    public List<CourseMaster> getAllCourses() { return courseRepository.findAll(); }

    @Override
    public void updateCourse(Long id, CourseMaster updatedCourse) {
        CourseMaster course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        course.setCourseName(updatedCourse.getCourseName());
        course.setDuration(updatedCourse.getDuration());
        course.setDescription(updatedCourse.getDescription());
        courseRepository.save(course);
    }

    @Override
    public void deleteCourse(Long id) {
        CourseMaster course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        course.setStatus("INACTIVE");
        courseRepository.save(course);
    }

    @Override
    public List<CourseFullDetailsDTO> getAllCoursesWithDetails() {
        return courseRepository.findAll().stream().map(course ->
                new CourseFullDetailsDTO(course.getId(), course.getCourseName(),
                        course.getDuration(), course.getDescription(),
                        course.getCourseCode(), course.getCategory(), Collections.emptyList())
        ).toList();
    }

    // ================= STUDENT → COURSE MAPPING =================
    @Override
    public List<Map<String, Object>> getStudentCourseMappings() {
        return studentCourseRepository.findAll().stream().map(sc -> {
            Map<String, Object> map = new HashMap<>();
            map.put("mappingId",    sc.getId());
            map.put("studentId",    sc.getStudent().getId());
            map.put("studentName",  sc.getStudent().getName());
            map.put("studentEmail", sc.getStudent().getEmail());
            map.put("phone",        sc.getStudent().getPhone());
            map.put("status",       sc.getStudent().getStatus().name());
            map.put("formattedId",  sc.getStudent().getStudentId());
            map.put("courseId",     sc.getCourse().getId());
            map.put("courseName",   sc.getCourse().getCourseName());
            map.put("courseStatus", sc.getCourse().getStatus());
            map.put("feePaid",      sc.getFeePaid());
            map.put("feePending",   sc.getFeePending());
            map.put("courseMode",   sc.getCourseMode());
            map.put("studentCourseStatus", sc.getStatus());
            map.put("enrolledAt",   sc.getEnrolledAt());
            return map;
        }).toList();
    }

    // ================= STUDENT → BATCH MAPPING =================
    @Override
    public List<Map<String, Object>> getStudentBatchMappings() {
        return studentBatchesRepository.findAll().stream().map(sb -> {
            Map<String, Object> map = new HashMap<>();
            map.put("mappingId",    sb.getId());
            map.put("studentId",    sb.getStudent().getId());
            map.put("studentName",  sb.getStudent().getName());
            map.put("studentEmail", sb.getStudent().getEmail());
            map.put("phone",        sb.getStudent().getPhone());
            map.put("status",       sb.getStudent().getStatus().name());
            map.put("formattedId",  sb.getStudent().getStudentId());
            map.put("batchId",      sb.getBatch().getId());
            map.put("batchName",    sb.getBatch().getBatchName());
            map.put("batchStatus",  sb.getBatch().getStatus());
            return map;
        }).toList();
    }

    // ================= MAP STUDENT → COURSE =================
    @Override
    public void mapStudentToCourse(Long studentId, Long courseId, Double feePaid, Double feePending, String courseMode) {
        Optional<StudentCourse> existing = studentCourseRepository.findByStudent_IdAndCourse_Id(studentId, courseId);
        StudentCourse mapping;
        if (existing.isPresent()) {
            mapping = existing.get();
        } else {
            User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));
            CourseMaster course = courseRepository.findById(courseId).orElseThrow(() -> new RuntimeException("Course not found"));
            mapping = new StudentCourse();
            mapping.setStudent(student);
            mapping.setCourse(course);
            mapping.setEnrolledAt(LocalDateTime.now());
        }
        
        if (feePaid != null) mapping.setFeePaid(feePaid);
        if (feePending != null) mapping.setFeePending(feePending);
        if (courseMode != null) mapping.setCourseMode(courseMode);
        mapping.setStatus("ACTIVE");
        
        studentCourseRepository.save(mapping);
    }

    // ================= MAP STUDENT → BATCH =================
    @Override
    public void mapStudentToBatch(Long studentId, Long batchId) {
        Optional<StudentBatches> existingMapping = studentBatchesRepository.findByStudent_IdAndBatch_Id(studentId, batchId);
        
        User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));
        Batches batch = batchRepository.findById(batchId).orElseThrow(() -> new RuntimeException("Batch not found"));
        
        StudentBatches mapping;
        if (existingMapping.isPresent()) {
            mapping = existingMapping.get();
        } else {
            mapping = new StudentBatches();
            mapping.setStudent(student);
            mapping.setBatch(batch);
        }
        
        mapping.setStatus(StudentBatches.Status.ACTIVE);
        studentBatchesRepository.save(mapping);
    }

    @Override
    public void removeStudentFromBatch(Long mappingId) {
        StudentBatches mapping = studentBatchesRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));
        studentBatchesRepository.delete(mapping);
    }
}
package com.lms.controller;

import com.lms.entity.CourseMaster;
import com.lms.repository.CourseRepository;
import com.lms.repository.StudentCourseRepository;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
public class StudentCourseController {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private StudentCourseRepository studentCourseRepository;

    private Long getLoggedInStudentId(HttpSession session) {
        Object userIdObj = session.getAttribute("USER_ID");
        if (userIdObj == null) {
            throw new RuntimeException("User not logged in. Please login again.");
        }
        return Long.valueOf(userIdObj.toString());
    }

    // ================= MY ASSIGNED COURSES =================
    @GetMapping("/my-assigned")
    public ResponseEntity<?> getMyAssignedCourses(HttpSession session) {

        try {

            Long studentId = getLoggedInStudentId(session);

            List<CourseMaster> courses =
                    studentCourseRepository.findByStudent_Id(studentId)
                    .stream()
                    .map(sc -> sc.getCourse())
                    .distinct()
                    .collect(Collectors.toList());

            if (courses.isEmpty()) {
                return ResponseEntity.noContent().build();
            }

            return ResponseEntity.ok(courses);

        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    // ================= SINGLE COURSE =================
    @GetMapping("/{id}")
    public ResponseEntity<CourseMaster> getCourseById(@PathVariable Long id, HttpSession session) {

        getLoggedInStudentId(session);

        Optional<CourseMaster> course = courseRepository.findById(id);

        return course.map(ResponseEntity::ok)
                     .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ================= ALL COURSES =================
    @GetMapping("/all")
    public ResponseEntity<List<CourseMaster>> getAllCourses() {
        return ResponseEntity.ok(courseRepository.findAll());
    }
}
package com.lms.controller;

import com.lms.dto.StudentBatchResponseDTO;
import com.lms.service.StudentBatchService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student-batch")
public class StudentBatchController {

    private final StudentBatchService studentBatchService;

    public StudentBatchController(StudentBatchService studentBatchService) {
        this.studentBatchService = studentBatchService;
    }

    /* Assign student to batch */
    @PostMapping("/student-batch-mappings")
    public String assignStudent(
            @RequestParam Long studentId,
            @RequestParam Long batchId) {

        return studentBatchService.assignStudentToBatch(studentId, batchId);
    }

    /* Get all mappings */
    @GetMapping("/student-batch-mappings")
    public List<StudentBatchResponseDTO> getAllMappings() {
        return studentBatchService.getAllMappings();
    }

    /* Remove mapping */
    @DeleteMapping("/student-batch-mappings")
    public String removeMapping(
            @RequestParam Long studentId,
            @RequestParam Long batchId) {

        studentBatchService.removeMapping(studentId, batchId);
        return "Mapping removed successfully.";
    }
    @GetMapping("/student-course/{studentId}")
    public Long getStudentCourse(@PathVariable Long studentId) {
        return studentBatchService.getStudentCourseId(studentId);
    }
}
package com.lms.service;

import com.lms.dto.StudentBatchResponseDTO;
import java.util.List;

public interface StudentBatchService {

    String assignStudentToBatch(Long studentId, Long batchId);

    List<StudentBatchResponseDTO> getAllMappings();

    void removeMapping(Long studentId, Long batchId);
    
    Long getStudentCourseId(Long studentId);
}
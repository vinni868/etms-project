package com.lms.service.impl;

import com.lms.dto.StudentBatchResponseDTO;
import com.lms.entity.Batches;
import com.lms.entity.CourseMaster;
import com.lms.entity.StudentBatches;
import com.lms.entity.User;
import com.lms.repository.BatchRepository;
import com.lms.repository.StudentBatchesRepository;
import com.lms.repository.UserRepository;
import com.lms.service.StudentBatchService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class StudentBatchServiceImpl implements StudentBatchService {

    private final StudentBatchesRepository studentBatchRepo;
    private final UserRepository userRepo;
    private final BatchRepository batchRepo;

    public StudentBatchServiceImpl(StudentBatchesRepository studentBatchRepo,
                                   UserRepository userRepo,
                                   BatchRepository batchRepo) {
        this.studentBatchRepo = studentBatchRepo;
        this.userRepo = userRepo;
        this.batchRepo = batchRepo;
    }

    /* ================= ASSIGN ================= */

    @Override
    public String assignStudentToBatch(Long studentId, Long batchId) {

        User student = userRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getRole() == null ||
            !student.getRole().getRoleName().equalsIgnoreCase("STUDENT")) {
            throw new RuntimeException("User is not a student.");
        }

        Batches batch = batchRepo.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        // Check existing mapping
        var existingOpt = studentBatchRepo
                .findByStudent_IdAndBatch_Id(studentId, batchId);

        if (existingOpt.isPresent()) {

            StudentBatches existing = existingOpt.get();

            if (existing.getStatus() == StudentBatches.Status.ACTIVE) {
                throw new RuntimeException("Student already assigned to this batch.");
            }

            // If previously removed → reactivate
            existing.setStatus(StudentBatches.Status.ACTIVE);
            studentBatchRepo.save(existing);

            return "Student re-assigned successfully.";
        }

        StudentBatches mapping = new StudentBatches();
        mapping.setStudent(student);
        mapping.setBatch(batch);
        mapping.setStatus(StudentBatches.Status.ACTIVE);

        studentBatchRepo.save(mapping);

        return "Student assigned successfully.";
    }
   
    /* ================= REMOVE ================= */

    @Override
    public void removeMapping(Long studentId, Long batchId) {

        StudentBatches mapping = studentBatchRepo
                .findByStudent_IdAndBatch_Id(studentId, batchId)
                .orElseThrow(() -> new RuntimeException("Mapping not found"));

        mapping.setStatus(StudentBatches.Status.REMOVED);
        studentBatchRepo.save(mapping);
    }
    @Override
    public Long getStudentCourseId(Long studentId) {

        return studentBatchRepo
                .findByStudent_Id(studentId)
                .stream()
                .filter(m -> m.getStatus() == StudentBatches.Status.ACTIVE)
                .map(m -> m.getBatch().getId())
                .findFirst()
                .orElse(null);
    }    
    @Override
    public List<StudentBatchResponseDTO> getAllMappings() {

        return studentBatchRepo.findAll()
                .stream()
                .filter(mapping -> mapping.getStatus() == StudentBatches.Status.ACTIVE)
                .map(mapping -> {

                    User student = mapping.getStudent();
                    Batches batch = mapping.getBatch();

                    return new StudentBatchResponseDTO(
                            student.getId(),
                            student.getName(),
                            student.getEmail(),
                            batch.getId(),
                            batch.getBatchName(),
                            "N/A"
                    );
                })
                .collect(Collectors.toList());
    }
    
    
}
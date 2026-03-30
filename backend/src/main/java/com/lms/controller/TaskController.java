package com.lms.controller;

import com.lms.entity.Task;
import com.lms.entity.TaskAssignment;
import com.lms.entity.User;
import com.lms.repository.TaskAssignmentRepository;
import com.lms.repository.TaskRepository;
import com.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskAssignmentRepository taskAssignmentRepository;

    @Autowired
    private UserRepository userRepository;

    // ─── TRAINER ENDPOINTS ───

    @PostMapping("/trainer/create")
    public ResponseEntity<?> createTask(@RequestBody Map<String, Object> payload) {
        try {
            Task task = new Task();
            task.setTitle(payload.get("title").toString());
            task.setDescription(payload.get("description").toString());
            task.setBatchId(Long.valueOf(payload.get("batchId").toString()));
            task.setTrainerId(Long.valueOf(payload.get("trainerId").toString()));
            
            if (payload.get("deadline") != null) {
                task.setDeadline(LocalDateTime.parse(payload.get("deadline").toString()));
            }
            
            task = taskRepository.save(task);

            // Auto-assign to all students in batch (Placeholder logic - in full version triggers a worker)
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ─── STUDENT ENDPOINTS ───

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentTasks(@PathVariable Long studentId, @RequestParam Long batchId) {
        // Fetch assignments for this student in this batch
        List<TaskAssignment> assignments = taskAssignmentRepository.findByStudent_IdAndTask_BatchId(studentId, batchId);
        
        // If no assignments exist yet, we might need to sync from tasks table
        if (assignments.isEmpty()) {
            List<Task> tasks = taskRepository.findByBatchId(batchId);
            User student = userRepository.findById(studentId).orElse(null);
            if (student != null) {
                for (Task t : tasks) {
                    TaskAssignment ta = new TaskAssignment();
                    ta.setTask(t);
                    ta.setStudent(student);
                    ta.setStatus("PENDING");
                    taskAssignmentRepository.save(ta);
                }
                assignments = taskAssignmentRepository.findByStudent_IdAndTask_BatchId(studentId, batchId);
            }
        }

        return ResponseEntity.ok(assignments);
    }

    @PostMapping("/student/submit/{assignmentId}")
    public ResponseEntity<?> submitTask(@PathVariable Long assignmentId, @RequestBody Map<String, String> payload) {
        Optional<TaskAssignment> taOpt = taskAssignmentRepository.findById(assignmentId);
        if (taOpt.isPresent()) {
            TaskAssignment ta = taOpt.get();
            ta.setSubmission(payload.get("submission"));
            ta.setSubmittedAt(LocalDateTime.now());
            ta.setStatus("SUBMITTED");
            return ResponseEntity.ok(taskAssignmentRepository.save(ta));
        }
        return ResponseEntity.notFound().build();
    }
}

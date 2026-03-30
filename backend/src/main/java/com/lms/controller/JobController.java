package com.lms.controller;

import com.lms.entity.Job;
import com.lms.entity.JobApplication;
import com.lms.entity.User;
import com.lms.repository.JobApplicationRepository;
import com.lms.repository.JobRepository;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequiredArgsConstructor
public class JobController {

    private final JobRepository jobRepo;
    private final JobApplicationRepository appRepo;
    private final UserRepository userRepo;

    // ─────────────── STUDENT ENDPOINTS ─────────────────────────────

    /** GET /api/student/jobs — active listings */
    @GetMapping("/api/student/jobs")
    public ResponseEntity<?> getActiveJobs(Authentication auth) {
        User user = getUser(auth);
        List<Job> jobs = jobRepo.findActiveJobs();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Job j : jobs) {
            Map<String, Object> dto = buildJobDto(j);
            dto.put("alreadyApplied", appRepo.existsByJobIdAndStudentId(j.getId(), user.getId()));
            dto.put("applicationCount", appRepo.countByJobId(j.getId()));
            result.add(dto);
        }
        return ResponseEntity.ok(result);
    }

    /** POST /api/student/jobs/{id}/apply */
    @PostMapping("/api/student/jobs/{id}/apply")
    public ResponseEntity<?> apply(@PathVariable Long id,
                                   @RequestBody(required = false) Map<String, String> body,
                                   Authentication auth) {
        User user = getUser(auth);
        if (appRepo.existsByJobIdAndStudentId(id, user.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "You have already applied for this job."));
        }
        Job job = jobRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        if (!"ACTIVE".equals(job.getStatus()) || job.getApplyDeadline().isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "This job listing is no longer accepting applications."));
        }
        JobApplication app = new JobApplication();
        app.setJobId(id);
        app.setStudentId(user.getId());
        app.setCoverLetter(body != null ? body.get("coverLetter") : null);
        appRepo.save(app);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Application submitted!"));
    }

    /** GET /api/student/my-applications */
    @GetMapping("/api/student/my-applications")
    public ResponseEntity<?> myApplications(Authentication auth) {
        User user = getUser(auth);
        List<JobApplication> apps = appRepo.findByStudentIdOrderByAppliedAtDesc(user.getId());
        List<Map<String, Object>> result = new ArrayList<>();
        for (JobApplication a : apps) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", a.getId());
            dto.put("status", a.getStatus());
            dto.put("appliedAt", a.getAppliedAt());
            jobRepo.findById(a.getJobId()).ifPresent(j -> {
                dto.put("jobTitle", j.getTitle());
                dto.put("company", j.getCompany());
                dto.put("location", j.getLocation());
                dto.put("jobType", j.getJobType());
            });
            result.add(dto);
        }
        return ResponseEntity.ok(result);
    }

    // ─────────────── ADMIN ENDPOINTS ─────────────────────────────

    /** GET /api/admin/jobs — all jobs */
    @GetMapping("/api/admin/jobs")
    public ResponseEntity<?> adminGetJobs() {
        List<Job> jobs = jobRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Job j : jobs) {
            Map<String, Object> dto = buildJobDto(j);
            dto.put("applicationCount", appRepo.countByJobId(j.getId()));
            result.add(dto);
        }
        return ResponseEntity.ok(result);
    }

    /** POST /api/admin/jobs — create job */
    @PostMapping("/api/admin/jobs")
    public ResponseEntity<?> createJob(@RequestBody Map<String, Object> body, Authentication auth) {
        User user = getUser(auth);
        Job job = new Job();
        job.setTitle(str(body, "title"));
        job.setCompany(str(body, "company"));
        job.setLocation(str(body, "location"));
        job.setDescription(str(body, "description"));
        job.setRequirements(str(body, "requirements"));
        job.setSkillsNeeded(str(body, "skillsNeeded"));
        job.setSalaryRange(str(body, "salaryRange"));
        job.setJobType(str(body, "jobType"));
        job.setStipend(str(body, "stipend"));
        if (body.get("applyDeadline") != null)
            job.setApplyDeadline(LocalDate.parse(body.get("applyDeadline").toString()));
        job.setPostedBy(user.getId());
        jobRepo.save(job);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Job posted successfully.", "id", job.getId()));
    }

    /** PUT /api/admin/jobs/{id} — update job */
    @PutMapping("/api/admin/jobs/{id}")
    public ResponseEntity<?> updateJob(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Job job = jobRepo.findById(id).orElseThrow(() -> new RuntimeException("Job not found"));
        if (body.containsKey("title"))       job.setTitle(str(body, "title"));
        if (body.containsKey("company"))     job.setCompany(str(body, "company"));
        if (body.containsKey("location"))    job.setLocation(str(body, "location"));
        if (body.containsKey("description")) job.setDescription(str(body, "description"));
        if (body.containsKey("skillsNeeded")) job.setSkillsNeeded(str(body, "skillsNeeded"));
        if (body.containsKey("salaryRange")) job.setSalaryRange(str(body, "salaryRange"));
        if (body.containsKey("jobType"))     job.setJobType(str(body, "jobType"));
        if (body.containsKey("status"))      job.setStatus(str(body, "status"));
        if (body.containsKey("applyDeadline"))
            job.setApplyDeadline(LocalDate.parse(body.get("applyDeadline").toString()));
        jobRepo.save(job);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Job updated."));
    }

    /** DELETE /api/admin/jobs/{id} */
    @DeleteMapping("/api/admin/jobs/{id}")
    public ResponseEntity<?> deleteJob(@PathVariable Long id) {
        jobRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Job deleted."));
    }

    /** GET /api/admin/jobs/{id}/applications */
    @GetMapping("/api/admin/jobs/{id}/applications")
    public ResponseEntity<?> getApplications(@PathVariable Long id) {
        List<JobApplication> apps = appRepo.findByJobIdOrderByAppliedAtDesc(id);
        List<Map<String, Object>> result = new ArrayList<>();
        for (JobApplication a : apps) {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", a.getId());
            dto.put("studentId", a.getStudentId());
            dto.put("status", a.getStatus());
            dto.put("appliedAt", a.getAppliedAt());
            dto.put("coverLetter", a.getCoverLetter());
            userRepo.findById(a.getStudentId()).ifPresent(u -> {
                dto.put("studentName", u.getName());
                dto.put("studentEmail", u.getEmail());
                dto.put("studentPhone", u.getPhone());
            });
            result.add(dto);
        }
        return ResponseEntity.ok(result);
    }

    /** PUT /api/admin/applications/{id}/status */
    @PutMapping("/api/admin/applications/{id}/status")
    public ResponseEntity<?> updateApplicationStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        JobApplication app = appRepo.findById(id).orElseThrow(() -> new RuntimeException("Application not found"));
        app.setStatus(body.get("status"));
        app.setRejectionReason(body.get("rejectionReason"));
        app.setUpdatedAt(LocalDateTime.now());
        appRepo.save(app);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Application status updated."));
    }

    // ─────────────── HELPERS ─────────────────────────────

    private Map<String, Object> buildJobDto(Job j) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", j.getId());
        dto.put("title", j.getTitle());
        dto.put("company", j.getCompany());
        dto.put("location", j.getLocation());
        dto.put("description", j.getDescription());
        dto.put("skillsNeeded", j.getSkillsNeeded());
        dto.put("salaryRange", j.getSalaryRange());
        dto.put("jobType", j.getJobType());
        dto.put("stipend", j.getStipend());
        dto.put("applyDeadline", j.getApplyDeadline());
        dto.put("status", j.getStatus());
        dto.put("createdAt", j.getCreatedAt());
        return dto;
    }

    private User getUser(Authentication auth) {
        return userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String str(Map<String, Object> body, String key) {
        return body.get(key) != null ? body.get(key).toString() : null;
    }
}

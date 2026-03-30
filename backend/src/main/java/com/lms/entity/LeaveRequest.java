package com.lms.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_requests")
public class LeaveRequest {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "courses", columnDefinition = "TEXT")
    private String courses;

    @Column(name = "batches", columnDefinition = "TEXT")
    private String batches;

    @Column(name = "course_mode", length = 20)
    private String courseMode;

    @Column(name = "request_type", length = 20)
    private String requestType = "LEAVE"; // LEAVE, ONLINE, or WFH

    @Column(name = "leave_category", length = 50)
    private String leaveCategory;

    @Column(name = "document_file_name")
    private String documentFileName;

    @Column(name = "document_file_path")
    private String documentFilePath;

    @Column(name = "from_date", nullable = false)
    private LocalDate fromDate;

    @Column(name = "to_date", nullable = false)
    private LocalDate toDate;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(length = 20)
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approval_note", columnDefinition = "TEXT")
    private String approvalNote;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // ─── Getters & Setters ────────────────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getBatchId() { return batchId; }
    public void setBatchId(Long batchId) { this.batchId = batchId; }
    public String getCourses() { return courses; }
    public void setCourses(String courses) { this.courses = courses; }
    public String getBatches() { return batches; }
    public void setBatches(String batches) { this.batches = batches; }
    public String getCourseMode() { return courseMode; }
    public void setCourseMode(String courseMode) { this.courseMode = courseMode; }
    public String getRequestType() { return requestType; }
    public void setRequestType(String requestType) { this.requestType = requestType; }
    public String getLeaveCategory() { return leaveCategory; }
    public void setLeaveCategory(String leaveCategory) { this.leaveCategory = leaveCategory; }
    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }
    public LocalDate getToDate() { return toDate; }
    public void setToDate(LocalDate toDate) { this.toDate = toDate; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getApprovedBy() { return approvedBy; }
    public void setApprovedBy(Long approvedBy) { this.approvedBy = approvedBy; }
    public String getApprovalNote() { return approvalNote; }
    public void setApprovalNote(String approvalNote) { this.approvalNote = approvalNote; }
    public String getDocumentFileName() { return documentFileName; }
    public void setDocumentFileName(String documentFileName) { this.documentFileName = documentFileName; }
    public String getDocumentFilePath() { return documentFilePath; }
    public void setDocumentFilePath(String documentFilePath) { this.documentFilePath = documentFilePath; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

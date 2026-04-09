package com.lms.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leads")
public class Lead {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 200)
    private String email;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(name = "whatsapp_number", length = 20)
    private String whatsappNumber;

    @Column(name = "course_interest", length = 300)
    private String courseInterest;

    @Column(length = 100)
    private String source; // WALK_IN, SOCIAL_MEDIA, REFERRAL, WEBSITE, PHONE, FACEBOOK, INSTAGRAM, GOOGLE

    @Column(length = 50)
    private String status = "NEW"; // NEW, CONTACTED, INTERESTED, DEMO_BOOKED, ENROLLED, NOT_INTERESTED, LOST

    @Column(length = 20)
    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH

    /** Marketer who created/owns this lead */
    @Column(name = "assigned_to")
    private Long assignedTo;

    /** Counselor assigned to convert this lead */
    @Column(name = "assigned_counselor_id")
    private Long assignedCounselorId;

    @Column(name = "campaign_id")
    private Long campaignId;

    @Column(name = "next_followup_date")
    private LocalDate nextFollowupDate;

    @Column(name = "last_contacted_at")
    private LocalDateTime lastContactedAt;

    @Column(name = "demo_scheduled_at")
    private LocalDateTime demoScheduledAt;

    @Column(name = "callback_scheduled_at")
    private LocalDateTime callbackScheduledAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "converted_at")
    private LocalDateTime convertedAt;

    @Column(name = "converted_student_id")
    private Long convertedStudentId;

    // ─── Getters & Setters ────────────────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getWhatsappNumber() { return whatsappNumber; }
    public void setWhatsappNumber(String whatsappNumber) { this.whatsappNumber = whatsappNumber; }
    public String getCourseInterest() { return courseInterest; }
    public void setCourseInterest(String courseInterest) { this.courseInterest = courseInterest; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public Long getAssignedTo() { return assignedTo; }
    public void setAssignedTo(Long assignedTo) { this.assignedTo = assignedTo; }
    public Long getAssignedCounselorId() { return assignedCounselorId; }
    public void setAssignedCounselorId(Long assignedCounselorId) { this.assignedCounselorId = assignedCounselorId; }
    public Long getCampaignId() { return campaignId; }
    public void setCampaignId(Long campaignId) { this.campaignId = campaignId; }
    public LocalDate getNextFollowupDate() { return nextFollowupDate; }
    public void setNextFollowupDate(LocalDate nextFollowupDate) { this.nextFollowupDate = nextFollowupDate; }
    public LocalDateTime getLastContactedAt() { return lastContactedAt; }
    public void setLastContactedAt(LocalDateTime lastContactedAt) { this.lastContactedAt = lastContactedAt; }
    public LocalDateTime getDemoScheduledAt() { return demoScheduledAt; }
    public void setDemoScheduledAt(LocalDateTime demoScheduledAt) { this.demoScheduledAt = demoScheduledAt; }
    public LocalDateTime getCallbackScheduledAt() { return callbackScheduledAt; }
    public void setCallbackScheduledAt(LocalDateTime callbackScheduledAt) { this.callbackScheduledAt = callbackScheduledAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getConvertedAt() { return convertedAt; }
    public void setConvertedAt(LocalDateTime convertedAt) { this.convertedAt = convertedAt; }
    public Long getConvertedStudentId() { return convertedStudentId; }
    public void setConvertedStudentId(Long convertedStudentId) { this.convertedStudentId = convertedStudentId; }
}

package com.lms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lead_notes")
public class LeadNote {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lead_id", nullable = false)
    private Long leadId;

    @Column(name = "counselor_id")
    private Long counselorId;

    @Column(name = "note_text", columnDefinition = "TEXT", nullable = false)
    private String noteText;

    @Column(name = "call_outcome", length = 50)
    private String callOutcome; // ANSWERED, NO_ANSWER, BUSY, CALLBACK, WHATSAPP_SENT

    @Column(name = "call_duration_minutes")
    private Integer callDurationMinutes;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // ─── Getters & Setters ────────────────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }
    public Long getCounselorId() { return counselorId; }
    public void setCounselorId(Long counselorId) { this.counselorId = counselorId; }
    public String getNoteText() { return noteText; }
    public void setNoteText(String noteText) { this.noteText = noteText; }
    public String getCallOutcome() { return callOutcome; }
    public void setCallOutcome(String callOutcome) { this.callOutcome = callOutcome; }
    public Integer getCallDurationMinutes() { return callDurationMinutes; }
    public void setCallDurationMinutes(Integer callDurationMinutes) { this.callDurationMinutes = callDurationMinutes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

package com.lms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "announcements")
public class Announcement {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    // JSON string e.g. ["STUDENT","TRAINER"]
    @Column(name = "target_roles", columnDefinition = "JSON")
    private String targetRoles;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "is_popup")
    private Boolean isPopup = false;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "link", columnDefinition = "TEXT")
    private String link;

    // ─── Getters & Setters ────────────────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getTargetRoles() { return targetRoles; }
    public void setTargetRoles(String targetRoles) { this.targetRoles = targetRoles; }
    public Long getBatchId() { return batchId; }
    public void setBatchId(Long batchId) { this.batchId = batchId; }
    public Boolean getIsPopup() { return isPopup; }
    public void setIsPopup(Boolean isPopup) { this.isPopup = isPopup; }
    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }
}

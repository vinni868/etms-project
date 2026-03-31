package com.lms.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 50)
    private String type; // LEAVE, USER_CREATION, QUERY, SYSTEM

    @Column(name = "is_read")
    private boolean read = false;

    @Column(name = "recipient_role")
    private String recipientRole; // ADMIN, SUPERADMIN, STUDENT

    @Column(name = "related_id")
    private Long relatedId; // e.g., LeaveRequest ID

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification() {}

    public Notification(String message, String type, String recipientRole) {
        this.message = message;
        this.type = type;
        this.recipientRole = recipientRole;
    }

    public Notification(String message, String type, String recipientRole, Long relatedId) {
        this.message = message;
        this.type = type;
        this.recipientRole = recipientRole;
        this.relatedId = relatedId;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public String getRecipientRole() { return recipientRole; }
    public void setRecipientRole(String recipientRole) { this.recipientRole = recipientRole; }
    public Long getRelatedId() { return relatedId; }
    public void setRelatedId(Long relatedId) { this.relatedId = relatedId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

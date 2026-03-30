package com.lms.entity;

import jakarta.persistence.*;
import com.lms.enums.Status;
import com.lms.enums.ApprovalStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

import java.util.List;

@Entity
@Table(name = "users")
public class User {

    // ================= PRIMARY KEY =================
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ================= BASIC FIELDS =================
    @Column(nullable = false, length = 100)
    private String name;

    @Column(unique = true, nullable = false, length = 150)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "plain_password", length = 150)
    private String plainPassword;

    @Column(length = 20)
    private String phone;

    @Column(name = "student_id", unique = true, length = 30)
    private String studentId;

    @Column(name = "portal_id", unique = true, length = 30)
    private String portalId;

    // ================= ROLE MAPPING =================
    @ManyToOne
    @JoinColumn(name = "role_id", nullable = false)
    private RoleMaster role;

    // ================= STATUS ENUM =================
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    // ================= PERMISSION MAPPING =================
    @ManyToMany
    @JoinTable(
            name = "user_permissions",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private List<PermissionMaster> permissions;

    @Column(length = 6)
    private String resetOtp;

    private java.time.LocalDateTime resetOtpExpiry;

    // ================= LIFECYCLE & APPROVAL FIELDS =================
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status")
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @Column(name = "created_by", length = 50)
    private String createdBy; // "self" or admin's ID

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "inactivation_date")
    private LocalDate inactivationDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    // ================= CONSTRUCTORS =================

    public User() {
    }

    // ================= GETTERS & SETTERS =================

    public String getResetOtp() { return resetOtp; }
    public void setResetOtp(String resetOtp) { this.resetOtp = resetOtp; }

    public java.time.LocalDateTime getResetOtpExpiry() { return resetOtpExpiry; }
    public void setResetOtpExpiry(java.time.LocalDateTime resetOtpExpiry) { this.resetOtpExpiry = resetOtpExpiry; }

    public Long getId() {
        return id;
    }

    public ApprovalStatus getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(ApprovalStatus approvalStatus) { this.approvalStatus = approvalStatus; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Long getApprovedBy() { return approvedBy; }
    public void setApprovedBy(Long approvedBy) { this.approvedBy = approvedBy; }

    public LocalDate getInactivationDate() { return inactivationDate; }
    public void setInactivationDate(LocalDate inactivationDate) { this.inactivationDate = inactivationDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }
 
    public String getPassword() {
        return password;
    }

    public String getPhone() {
        return phone;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getPortalId() {
        return portalId;
    }

    public RoleMaster getRole() {
        return role;
    }

    public Status getStatus() {
        return status;
    }

    public List<PermissionMaster> getPermissions() {
        return permissions;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }
 
    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPlainPassword() { return plainPassword; }
    public void setPlainPassword(String plainPassword) { this.plainPassword = plainPassword; }
 
    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public void setPortalId(String portalId) {
        this.portalId = portalId;
    }

    public void setRole(RoleMaster role) {
        this.role = role;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public void setPermissions(List<PermissionMaster> permissions) {
        this.permissions = permissions;
    }

    // ================= TO STRING =================

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", phone='" + phone + '\'' +
                ", status=" + status +
                '}';
    }
}

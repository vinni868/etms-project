package com.lms.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "permission_master")
public class PermissionMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "permission_name", nullable = false, unique = true, length = 100)
    private String permissionName;

    // ================= CONSTRUCTORS =================

    public PermissionMaster() {
    }

    public PermissionMaster(String permissionName) {
        this.permissionName = permissionName;
    }

    // ================= GETTERS AND SETTERS =================

    public Long getId() {
        return id;
    }

    public String getPermissionName() {
        return permissionName;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setPermissionName(String permissionName) {
        this.permissionName = permissionName;
    }

    // ================= TO STRING =================

    @Override
    public String toString() {
        return "PermissionMaster{" +
                "id=" + id +
                ", permissionName='" + permissionName + '\'' +
                '}';
    }
}

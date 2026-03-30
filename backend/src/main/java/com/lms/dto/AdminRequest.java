package com.lms.dto;

import java.util.List;

public class AdminRequest {

    private String name;
    private String email;
    private String password;
    private String role;
    private List<String> permissions;
    private String status;

    public AdminRequest() {}

    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getRole() { return role; }
    public List<String> getPermissions() { return permissions; }
    public String getStatus() { return status; }

    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setRole(String role) { this.role = role; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }
    public void setStatus(String status) { this.status = status; }
}

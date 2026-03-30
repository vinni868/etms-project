package com.lms.dto;

public class LoginResponse {

    private Long id;
    private String name;
    private String email;
    private String role;
    private String token;
    private String studentId;
    private String portalId;

    public LoginResponse(Long id, String name, String email, String role, String token, String studentId, String portalId) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.token = token;
        this.studentId = studentId;
        this.portalId = portalId;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getToken() { return token; }
    public String getStudentId() { return studentId; }
    public String getPortalId() { return portalId; }
}

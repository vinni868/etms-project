package com.lms.dto;

public class TrainerProfileDTO {

    // ================= USER DETAILS =================
    private String name;
    private String email;
    private String phone;

    // ================= TRAINER DETAILS =================
    private String specialization;
    private String experience;
    private String qualification;
    private String bio;

    // ================= CONSTRUCTOR =================
    public TrainerProfileDTO() {
    }

    public TrainerProfileDTO(String name, String email, String phone,
                             String specialization, String experience,
                             String qualification, String bio) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.specialization = specialization;
        this.experience = experience;
        this.qualification = qualification;
        this.bio = bio;
    }

    // ================= GETTERS =================
    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getSpecialization() {
        return specialization;
    }

    public String getExperience() {
        return experience;
    }

    public String getQualification() {
        return qualification;
    }

    public String getBio() {
        return bio;
    }

    // ================= SETTERS =================
    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }

    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    // ================= TO STRING =================
    @Override
    public String toString() {
        return "TrainerProfileDTO{" +
                "name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", phone='" + phone + '\'' +
                ", specialization='" + specialization + '\'' +
                ", experience='" + experience + '\'' +
                ", qualification='" + qualification + '\'' +
                '}';
    }
}
package com.lms.dto;

import java.util.List;

public class BatchDetailsDTO {

    private Long batchId;
    private String batchName;
    private String trainerName;
    private String trainerEmail;
    private List<String> students;

    public BatchDetailsDTO(Long batchId,
                           String batchName,
                           String trainerName,
                           String trainerEmail,
                           List<String> students) {
        this.batchId = batchId;
        this.batchName = batchName;
        this.trainerName = trainerName;
        this.trainerEmail = trainerEmail;
        this.students = students;
    }

    public Long getBatchId() { return batchId; }
    public String getBatchName() { return batchName; }
    public String getTrainerName() { return trainerName; }
    public String getTrainerEmail() { return trainerEmail; }
    public List<String> getStudents() { return students; }
}
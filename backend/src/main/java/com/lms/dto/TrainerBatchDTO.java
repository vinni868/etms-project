package com.lms.dto;

public class TrainerBatchDTO {

    private Integer batchId;
    private String batchName;
    private String status;

    public TrainerBatchDTO(Integer batchId, String batchName, String status) {
        this.batchId = batchId;
        this.batchName = batchName;
        this.status = status;
    }

    public Integer getBatchId() { return batchId; }
    public String getBatchName() { return batchName; }
    public String getStatus() { return status; }
}
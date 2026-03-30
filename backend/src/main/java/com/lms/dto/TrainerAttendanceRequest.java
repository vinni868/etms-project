package com.lms.dto;

import java.time.LocalDate;
import java.util.List;

public class TrainerAttendanceRequest {

    private Integer batchId;
    private Integer trainerId;
    private LocalDate date;
    private List<AttendanceRequest> students;
	public Integer getBatchId() {
		return batchId;
	}
	public void setBatchId(Integer batchId) {
		this.batchId = batchId;
	}
	public Integer getTrainerId() {
		return trainerId;
	}
	public void setTrainerId(Integer trainerId) {
		this.trainerId = trainerId;
	}
	public LocalDate getDate() {
		return date;
	}
	public void setDate(LocalDate date) {
		this.date = date;
	}
	public List<AttendanceRequest> getStudents() {
		return students;
	}
	public void setStudents(List<AttendanceRequest> students) {
		this.students = students;
	}

    // getters & setters
}
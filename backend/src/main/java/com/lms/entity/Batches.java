package com.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "batches")
public class Batches {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_id")
    private String batchId;

    @Column(name = "batch_name")
    private String batchName;

    // Trainer assigned to batch
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "trainer_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User trainer;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "max_students")
    private Integer maxStudents;

    private String status;

    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties("batch")
    private List<StudentBatches> studentBatches;
    public String getMeetingLink() {
		return meetingLink;
	}

	public void setMeetingLink(String meetingLink) {
		this.meetingLink = meetingLink;
	}

	@Column(name = "meeting_link")
    private String meetingLink;


    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public String getBatchId() { return batchId; }

    public void setBatchId(String batchId) { this.batchId = batchId; }

    public String getBatchName() { return batchName; }

    public void setBatchName(String batchName) { this.batchName = batchName; }

    public User getTrainer() { return trainer; }

    public void setTrainer(User trainer) { this.trainer = trainer; }

    public LocalDate getStartDate() { return startDate; }

    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }

    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Integer getMaxStudents() { return maxStudents; }

    public void setMaxStudents(Integer maxStudents) { this.maxStudents = maxStudents; }

    public String getStatus() { return status; }

    public void setStatus(String status) { this.status = status; }

    public List<StudentBatches> getStudentBatches() { return studentBatches; }

    public void setStudentBatches(List<StudentBatches> studentBatches) {
        this.studentBatches = studentBatches;
    }
}
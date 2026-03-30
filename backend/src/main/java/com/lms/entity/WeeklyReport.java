package com.lms.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class WeeklyReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate reportDate; // End of the week
    
    @Column(columnDefinition = "TEXT")
    private String aiSummary; // AI generated insights
    
    private Double weeklyRevenue;
    private Integer activeStudentCount;
    private String status; // DRAFT, FINALIZED
}

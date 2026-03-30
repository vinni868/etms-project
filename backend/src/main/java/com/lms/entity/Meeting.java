package com.lms.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Meeting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String link; // Zoom/Meet link
    private String status; // UPCOMING, COMPLETED, CANCELLED
    
    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;
}

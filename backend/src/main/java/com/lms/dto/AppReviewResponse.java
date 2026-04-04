package com.lms.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AppReviewResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String userRole;
    private int rating;
    private String feedback;
    private LocalDateTime createdAt;
}

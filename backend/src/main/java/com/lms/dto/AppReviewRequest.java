package com.lms.dto;

import lombok.Data;

@Data
public class AppReviewRequest {
    private Long userId;
    private int rating;
    private String feedback;
}

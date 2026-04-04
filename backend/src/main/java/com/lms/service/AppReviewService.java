package com.lms.service;

import com.lms.dto.AppReviewRequest;
import com.lms.dto.AppReviewResponse;
import java.util.List;

public interface AppReviewService {
    AppReviewResponse submitReview(AppReviewRequest request);
    List<AppReviewResponse> getAllReviews();
}

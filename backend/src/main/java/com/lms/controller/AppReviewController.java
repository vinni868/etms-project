package com.lms.controller;

import com.lms.dto.AppReviewRequest;
import com.lms.dto.AppReviewResponse;
import com.lms.service.AppReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/app-reviews")
@RequiredArgsConstructor
public class AppReviewController {

    private final AppReviewService appReviewService;

    @PostMapping
    public ResponseEntity<AppReviewResponse> submitReview(@RequestBody AppReviewRequest request) {
        return ResponseEntity.ok(appReviewService.submitReview(request));
    }

    @GetMapping
    public ResponseEntity<List<AppReviewResponse>> getAllReviews() {
        return ResponseEntity.ok(appReviewService.getAllReviews());
    }
}

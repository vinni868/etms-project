package com.lms.service.impl;

import com.lms.dto.AppReviewRequest;
import com.lms.dto.AppReviewResponse;
import com.lms.entity.AppReview;
import com.lms.entity.User;
import com.lms.repository.AppReviewRepository;
import com.lms.repository.UserRepository;
import com.lms.service.AppReviewService;
import com.lms.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppReviewServiceImpl implements AppReviewService {

    private final AppReviewRepository appReviewRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    public AppReviewResponse submitReview(AppReviewRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        AppReview review = new AppReview();
        review.setUser(user);
        review.setRating(request.getRating());
        review.setFeedback(request.getFeedback());

        AppReview savedReview = appReviewRepository.save(review);
        
        // Dispatch Notification to Super Admin and Admin
        String msg = "New App Review (" + request.getRating() + " ⭐) by " + user.getName();
        notificationService.createNotification(msg, "REVIEW", "SUPERADMIN");
        notificationService.createNotification(msg, "REVIEW", "ADMIN");

        return mapToDto(savedReview);
    }

    @Override
    public List<AppReviewResponse> getAllReviews() {
        return appReviewRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private AppReviewResponse mapToDto(AppReview review) {
        AppReviewResponse dto = new AppReviewResponse();
        dto.setId(review.getId());
        dto.setUserId(review.getUser().getId());
        dto.setUserName(review.getUser().getName());
        dto.setUserEmail(review.getUser().getEmail());
        dto.setUserRole(review.getUser().getRole().getRoleName());
        dto.setRating(review.getRating());
        dto.setFeedback(review.getFeedback());
        dto.setCreatedAt(review.getCreatedAt());
        return dto;
    }
}

package com.lms.repository;

import com.lms.entity.AppReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppReviewRepository extends JpaRepository<AppReview, Long> {
    List<AppReview> findAllByOrderByCreatedAtDesc();
}

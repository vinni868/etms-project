package com.lms.repository;

import com.lms.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByEmail(String email);

    Optional<Student> findTopByNameIgnoreCase(String name);

    /** Students who uploaded a scanned Aadhaar but are not yet verified */
    @Query("SELECT s FROM Student s WHERE s.aadharCardUrl IS NOT NULL AND (s.isAadharVerified IS NULL OR s.isAadharVerified = false)")
    List<Student> findPendingAadhaarReview();

    /** Count of pending Aadhaar reviews */
    @Query("SELECT COUNT(s) FROM Student s WHERE s.aadharCardUrl IS NOT NULL AND (s.isAadharVerified IS NULL OR s.isAadharVerified = false)")
    long countPendingAadhaarReview();

    /** All students with a verified Aadhaar card (any source) ordered by verification time */
    @Query("SELECT s FROM Student s WHERE s.isAadharVerified = true ORDER BY s.aadharVerifiedAt DESC NULLS LAST")
    List<Student> findVerifiedAadhaarCards();

    /** Count of verified Aadhaar cards */
    @Query("SELECT COUNT(s) FROM Student s WHERE s.isAadharVerified = true")
    long countVerifiedAadhaarCards();
}
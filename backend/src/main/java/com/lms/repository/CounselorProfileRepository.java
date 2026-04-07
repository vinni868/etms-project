package com.lms.repository;

import com.lms.entity.CounselorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CounselorProfileRepository extends JpaRepository<CounselorProfile, Long> {
    Optional<CounselorProfile> findByEmail(String email);
    Optional<CounselorProfile> findTopByNameIgnoreCase(String name);
}

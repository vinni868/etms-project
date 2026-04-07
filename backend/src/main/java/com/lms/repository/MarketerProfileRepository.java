package com.lms.repository;

import com.lms.entity.MarketerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MarketerProfileRepository extends JpaRepository<MarketerProfile, Long> {
    Optional<MarketerProfile> findByEmail(String email);
    Optional<MarketerProfile> findTopByNameIgnoreCase(String name);
}

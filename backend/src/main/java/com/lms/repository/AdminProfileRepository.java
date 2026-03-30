package com.lms.repository;

import com.lms.entity.AdminProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AdminProfileRepository extends JpaRepository<AdminProfile, Long> {
    Optional<AdminProfile> findByEmail(String email);
    Optional<AdminProfile> findTopByNameIgnoreCase(String name);
}

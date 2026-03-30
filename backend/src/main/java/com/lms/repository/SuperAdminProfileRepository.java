package com.lms.repository;

import com.lms.entity.SuperAdminProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SuperAdminProfileRepository extends JpaRepository<SuperAdminProfile, Long> {
    Optional<SuperAdminProfile> findByEmail(String email);
}

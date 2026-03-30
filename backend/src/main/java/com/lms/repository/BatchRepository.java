package com.lms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.lms.entity.Batches;

import java.util.List;
import java.util.Optional;

public interface BatchRepository extends JpaRepository<Batches, Long> {

    long countByStatus(String status);

    long countByStatusNot(String status);
}
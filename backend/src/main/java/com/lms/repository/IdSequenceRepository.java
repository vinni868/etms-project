package com.lms.repository;

import com.lms.entity.IdSequence;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface IdSequenceRepository extends JpaRepository<IdSequence, String> {
    Optional<IdSequence> findByPortal(String portal);
}

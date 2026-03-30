package com.lms.repository;

import com.lms.entity.CourseMaterials;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CourseMaterialsRepository extends JpaRepository<CourseMaterials, Long> {
    List<CourseMaterials> findByBatchId(Long batchId);
    List<CourseMaterials> findByBatchIdAndType(Long batchId, String type);
}

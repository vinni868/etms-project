package com.lms.repository;

import com.lms.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findByStatusOrderByCreatedAtDesc(String status);
    List<Job> findByPostedByOrderByCreatedAtDesc(Long postedBy);

    @Query("SELECT j FROM Job j WHERE j.status = 'ACTIVE' AND j.applyDeadline >= CURRENT_DATE ORDER BY j.createdAt DESC")
    List<Job> findActiveJobs();
}

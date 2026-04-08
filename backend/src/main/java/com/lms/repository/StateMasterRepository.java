package com.lms.repository;

import com.lms.entity.StateMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StateMasterRepository extends JpaRepository<StateMaster, Long> {
    @Query("SELECT s.name FROM StateMaster s ORDER BY s.name ASC")
    List<String> findAllNames();
}

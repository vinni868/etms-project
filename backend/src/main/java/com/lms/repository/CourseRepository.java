package com.lms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.lms.entity.CourseMaster;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<CourseMaster, Long> {

    /**
     * Finds courses assigned to a specific student using Native SQL.
     * This avoids the "UnknownPathException" by talking to the DB tables directly.
     */
    @Query(value = "SELECT DISTINCT cm.* FROM course_master cm " +
                   "JOIN batches b ON cm.id = b.course_id " +
                   "JOIN batch_students bs ON b.id = bs.batch_id " +
                   "WHERE bs.student_id = :studentId", 
           nativeQuery = true)
    List<CourseMaster> findByStudentId(@Param("studentId") Long studentId);
}
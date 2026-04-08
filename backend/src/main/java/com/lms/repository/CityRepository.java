package com.lms.repository;

import com.lms.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CityRepository extends JpaRepository<City, Long> {
    @Query("SELECT c.name FROM City c ORDER BY c.name ASC")
    List<String> findAllNames();

    long count();
}

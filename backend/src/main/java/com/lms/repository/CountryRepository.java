package com.lms.repository;

import com.lms.entity.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CountryRepository extends JpaRepository<Country, Long> {
    @Query("SELECT c.name FROM Country c ORDER BY c.name ASC")
    List<String> findAllNames();
}

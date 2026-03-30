package com.lms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.lms.entity.RoleMaster;

public interface RoleRepository extends JpaRepository<RoleMaster, Integer> {

    RoleMaster findByRoleName(String roleName);
}

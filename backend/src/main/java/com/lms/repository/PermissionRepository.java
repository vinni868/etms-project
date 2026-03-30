package com.lms.repository;

import com.lms.entity.PermissionMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PermissionRepository extends JpaRepository<PermissionMaster, Long> {
    List<PermissionMaster> findByPermissionNameIn(List<String> names);

    PermissionMaster findByPermissionName(String permissionName);
}

package com.lms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lms.entity.User;
import com.lms.enums.Status;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT MAX(u.studentId) FROM User u WHERE u.studentId LIKE :prefix")
    String findMaxStudentId(@org.springframework.data.repository.query.Param("prefix") String prefix);

    long countByRoleId(int roleId);

    List<User> findByRoleId(Integer roleId);

    List<User> findByRole_RoleNameIn(List<String> roleNames);

    List<User> findByRoleRoleNameIn(List<String> roleNames);

    List<User> findByStatus(Status status);

    long countByStatus(Status status);

    long countByRole_RoleNameAndStatus(String roleName, Status status);

    List<User> findByStatusAndRole_RoleNameIn(Status status, List<String> roleNames);

    long countByStatusAndRole_RoleNameIn(Status status, List<String> roleNames);

    List<User> findByRoleIdAndStatus(int roleId, Status status);

    List<User> findByRole_RoleName(String roleName);

    List<User> findByRole_RoleNameAndStatus(String roleName, Status status);
    List<User> findByRole_RoleNameAndStatusNot(String roleName, Status status);

    List<User> findByApprovalStatus(com.lms.enums.ApprovalStatus approvalStatus);
    
    // ✅ ROLE-SPECIFIC PENDING FETCH
    List<User> findByApprovalStatusAndRole_RoleName(com.lms.enums.ApprovalStatus approvalStatus, String roleName);
    
    // ✅ ROLE-SPECIFIC PENDING COUNT
    long countByApprovalStatusAndRole_RoleName(com.lms.enums.ApprovalStatus approvalStatus, String roleName);

    // ✅ ISOLATION FOR ADMIN PORTAL (Exclude SuperAdmin, and soon Admins)
    List<User> findByRole_RoleNameNot(String roleName);
    List<User> findByRole_RoleNameNotIn(List<String> roleNames);

    Optional<User> findByPortalId(String portalId);
    Optional<User> findByStudentId(String studentId);
}
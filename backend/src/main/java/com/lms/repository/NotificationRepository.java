package com.lms.repository;

import com.lms.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // ─── Legacy role-only queries (kept for backward compat) ───────────────
    List<Notification> findByRecipientRoleOrderByCreatedAtDesc(String recipientRole);
    List<Notification> findByRecipientRoleAndReadOrderByCreatedAtDesc(String recipientRole, boolean read);
    long countByRecipientRoleAndRead(String recipientRole, boolean read);

    // ─── Combined: role-level OR user-specific notifications ───────────────

    /** All notifications visible to a user: role-wide (no specific user) OR addressed to this user directly. */
    @Query("SELECT n FROM Notification n WHERE (n.recipientRole = :role AND n.recipientUserId IS NULL) OR n.recipientUserId = :userId ORDER BY n.createdAt DESC")
    List<Notification> findForUser(@Param("role") String role, @Param("userId") Long userId);

    /** Unread notifications for a user. */
    @Query("SELECT n FROM Notification n WHERE ((n.recipientRole = :role AND n.recipientUserId IS NULL) OR n.recipientUserId = :userId) AND n.read = false ORDER BY n.createdAt DESC")
    List<Notification> findUnreadForUser(@Param("role") String role, @Param("userId") Long userId);

    /** Unread count for a user. */
    @Query("SELECT COUNT(n) FROM Notification n WHERE ((n.recipientRole = :role AND n.recipientUserId IS NULL) OR n.recipientUserId = :userId) AND n.read = false")
    long countUnreadForUser(@Param("role") String role, @Param("userId") Long userId);

    /** Mark all unread notifications as read for a user (role-wide + user-specific). */
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE ((n.recipientRole = :role AND n.recipientUserId IS NULL) OR n.recipientUserId = :userId) AND n.read = false")
    void markAllReadForUser(@Param("role") String role, @Param("userId") Long userId);
}

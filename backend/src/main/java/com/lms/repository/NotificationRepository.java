package com.lms.repository;

import com.lms.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientRoleOrderByCreatedAtDesc(String recipientRole);
    List<Notification> findByRecipientRoleAndReadOrderByCreatedAtDesc(String recipientRole, boolean read);
    long countByRecipientRoleAndRead(String recipientRole, boolean read);
}

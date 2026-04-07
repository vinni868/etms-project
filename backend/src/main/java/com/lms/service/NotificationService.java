package com.lms.service;

import com.lms.entity.Notification;
import com.lms.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    // ─── Create ────────────────────────────────────────────────────────────

    /** Role-wide notification (goes to every user holding that role). */
    public void createNotification(String message, String type, String recipientRole) {
        notificationRepository.save(new Notification(message, type, recipientRole));
    }

    /** Role-wide notification with a linked entity ID. */
    public void createNotification(String message, String type, String recipientRole, Long relatedId) {
        notificationRepository.save(new Notification(message, type, recipientRole, relatedId));
    }

    /** User-specific notification — visible only to this one person. */
    public void createNotificationForUser(String message, String type, String recipientRole,
                                          Long recipientUserId, Long relatedId) {
        notificationRepository.save(new Notification(message, type, recipientRole, recipientUserId, relatedId));
    }

    // ─── Read (combined role + user-specific) ──────────────────────────────

    public List<Notification> getNotificationsForUser(String role, Long userId) {
        return notificationRepository.findForUser(role, userId);
    }

    public List<Notification> getUnreadNotificationsForUser(String role, Long userId) {
        return notificationRepository.findUnreadForUser(role, userId);
    }

    public long getUnreadCountForUser(String role, Long userId) {
        return notificationRepository.countUnreadForUser(role, userId);
    }

    // ─── Legacy role-only (kept for any existing callers) ──────────────────

    public List<Notification> getNotificationsForRole(String role) {
        return notificationRepository.findByRecipientRoleOrderByCreatedAtDesc(role);
    }

    public List<Notification> getUnreadNotificationsForRole(String role) {
        return notificationRepository.findByRecipientRoleAndReadOrderByCreatedAtDesc(role, false);
    }

    public long getUnreadCountForRole(String role) {
        return notificationRepository.countByRecipientRoleAndRead(role, false);
    }

    // ─── Mark read ─────────────────────────────────────────────────────────

    public void markAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    /** Marks all notifications (role-wide + user-specific) as read for this user. */
    public void markAllAsReadForUser(String role, Long userId) {
        notificationRepository.markAllReadForUser(role, userId);
    }

    /** Legacy role-only mark-all-read. */
    public void markAllAsReadForRole(String role) {
        List<Notification> unread = notificationRepository
                .findByRecipientRoleAndReadOrderByCreatedAtDesc(role, false);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    // ─── Delete ────────────────────────────────────────────────────────────

    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }
}

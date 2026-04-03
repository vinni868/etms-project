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

    public void createNotification(String message, String type, String recipientRole) {
        Notification notification = new Notification(message, type, recipientRole);
        notificationRepository.save(notification);
    }

    public void createNotification(String message, String type, String recipientRole, Long relatedId) {
        Notification notification = new Notification(message, type, recipientRole, relatedId);
        notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsForRole(String role) {
        return notificationRepository.findByRecipientRoleOrderByCreatedAtDesc(role);
    }

    public List<Notification> getUnreadNotificationsForRole(String role) {
        return notificationRepository.findByRecipientRoleAndReadOrderByCreatedAtDesc(role, false);
    }

    public void markAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public void markAllAsReadForRole(String role) {
        List<Notification> unread = notificationRepository.findByRecipientRoleAndReadOrderByCreatedAtDesc(role, false);
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    public long getUnreadCountForRole(String role) {
        return notificationRepository.countByRecipientRoleAndRead(role, false);
    }

    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }
}

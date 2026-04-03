package com.lms.controller;

import com.lms.entity.Notification;
import com.lms.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications(Authentication auth) {
        String role = getRole(auth);
        return ResponseEntity.ok(notificationService.getNotificationsForRole(role));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(Authentication auth) {
        String role = getRole(auth);
        return ResponseEntity.ok(notificationService.getUnreadNotificationsForRole(role));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication auth) {
        String role = getRole(auth);
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCountForRole(role)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }

    @PatchMapping("/mark-all-read")
    public ResponseEntity<?> markAllAsRead(Authentication auth) {
        String role = getRole(auth);
        notificationService.markAllAsReadForRole(role);
        return ResponseEntity.ok(Map.of("message", "All marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(Map.of("message", "Notification deleted"));
    }

    private String getRole(Authentication auth) {
        return auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("STUDENT");
    }
}

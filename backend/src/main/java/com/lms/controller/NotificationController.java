package com.lms.controller;

import com.lms.entity.Notification;
import com.lms.entity.User;
import com.lms.repository.UserRepository;
import com.lms.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    /** GET /api/notifications — all notifications for the authenticated user */
    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications(Authentication auth) {
        UserContext ctx = resolve(auth);
        return ResponseEntity.ok(notificationService.getNotificationsForUser(ctx.role, ctx.userId));
    }

    /** GET /api/notifications/unread */
    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(Authentication auth) {
        UserContext ctx = resolve(auth);
        return ResponseEntity.ok(notificationService.getUnreadNotificationsForUser(ctx.role, ctx.userId));
    }

    /** GET /api/notifications/unread-count */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication auth) {
        UserContext ctx = resolve(auth);
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCountForUser(ctx.role, ctx.userId)));
    }

    /** PATCH /api/notifications/{id}/read */
    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }

    /** PATCH /api/notifications/mark-all-read */
    @PatchMapping("/mark-all-read")
    public ResponseEntity<?> markAllAsRead(Authentication auth) {
        UserContext ctx = resolve(auth);
        notificationService.markAllAsReadForUser(ctx.role, ctx.userId);
        return ResponseEntity.ok(Map.of("message", "All marked as read"));
    }

    /** DELETE /api/notifications/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(Map.of("message", "Notification deleted"));
    }

    // ─── Helper ────────────────────────────────────────────────────────────

    private record UserContext(String role, Long userId) {}

    private UserContext resolve(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElse(null);
        if (user == null) {
            // Fallback: extract role from Spring Security authority
            String role = auth.getAuthorities().stream()
                    .findFirst()
                    .map(a -> a.getAuthority().replace("ROLE_", ""))
                    .orElse("STUDENT");
            return new UserContext(role, 0L);
        }
        String role = user.getRole() != null
                ? user.getRole().getRoleName().toUpperCase()
                : "STUDENT";
        return new UserContext(role, user.getId());
    }
}

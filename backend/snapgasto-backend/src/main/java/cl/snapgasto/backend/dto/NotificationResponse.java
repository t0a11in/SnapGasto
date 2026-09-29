package cl.snapgasto.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import cl.snapgasto.backend.entity.AppNotification;

/** Expone una notificación junto con el receptor para la grilla administrativa. */
public record NotificationResponse(
        UUID id,
        UUID userId,
        String userName,
        String title,
        String body,
        boolean read,
        LocalDateTime createdAt) {
    public static NotificationResponse from(AppNotification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getUser().getId(),
                notification.getUser().getFullName(),
                notification.getTitle(),
                notification.getBody(),
                notification.isRead(),
                notification.getCreatedAt());
    }
}

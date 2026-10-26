package cl.snapgasto.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.NotificationResponse;
import cl.snapgasto.backend.entity.AppNotification;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.repository.NotificationRepository;

/** Notificaciones propias del usuario autenticado (avisos de proyectos, mensajes del admin). */
@Service
public class UserNotificationService {

    private final NotificationRepository notificationRepository;

    public UserNotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listFor(AppUser user, boolean onlyUnread) {
        List<AppNotification> list = onlyUnread
                ? notificationRepository.findAllByUserAndReadFalseOrderByCreatedAtDesc(user)
                : notificationRepository.findAllByUserOrderByCreatedAtDesc(user);
        return list.stream().map(NotificationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public long countUnread(AppUser user) {
        return notificationRepository.countByUserAndReadFalse(user);
    }

    @Transactional
    public NotificationResponse markRead(UUID notificationId, AppUser user, boolean read) {
        AppNotification notification = notificationRepository.findByIdAndUser(notificationId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificación no encontrada."));
        notification.setRead(read);
        return NotificationResponse.from(notification);
    }

    @Transactional
    public int markAllRead(AppUser user) {
        return notificationRepository.markAllReadFor(user);
    }
}

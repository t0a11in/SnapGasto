package cl.snapgasto.backend.admin;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.NotificationRequest;
import cl.snapgasto.backend.dto.NotificationResponse;
import cl.snapgasto.backend.entity.AppNotification;
import cl.snapgasto.backend.repository.NotificationRepository;
import cl.snapgasto.backend.repository.UserRepository;

/** Implementa el mantenedor de notificaciones internas. */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list() {
        return notificationRepository.findAllByOrderByCreatedAtDesc().stream().map(NotificationResponse::from).toList();
    }

    @Transactional
    public NotificationResponse create(NotificationRequest request) {
        AppNotification notification = new AppNotification();
        apply(request, notification);
        return NotificationResponse.from(notificationRepository.save(notification));
    }

    @Transactional
    public NotificationResponse update(UUID notificationId, NotificationRequest request) {
        AppNotification notification = getNotification(notificationId);
        apply(request, notification);
        return NotificationResponse.from(notification);
    }

    @Transactional
    public void delete(UUID notificationId) {
        notificationRepository.delete(getNotification(notificationId));
    }

    private void apply(NotificationRequest request, AppNotification notification) {
        notification.setUser(userRepository.findById(request.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado.")));
        notification.setTitle(request.title().trim());
        notification.setBody(request.body().trim());
        notification.setRead(request.read());
    }

    private AppNotification getNotification(UUID notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificación no encontrada."));
    }
}

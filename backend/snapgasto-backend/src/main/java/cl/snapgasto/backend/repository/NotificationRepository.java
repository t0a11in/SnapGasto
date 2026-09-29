package cl.snapgasto.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import cl.snapgasto.backend.entity.AppNotification;
import cl.snapgasto.backend.entity.AppUser;

/** Expone las operaciones persistentes del mantenedor de notificaciones. */
public interface NotificationRepository extends JpaRepository<AppNotification, UUID> {
    List<AppNotification> findAllByOrderByCreatedAtDesc();

    void deleteAllByUser(AppUser user);
}

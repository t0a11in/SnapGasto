package cl.snapgasto.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import cl.snapgasto.backend.entity.AppNotification;
import cl.snapgasto.backend.entity.AppUser;

/** Expone las operaciones persistentes del mantenedor de notificaciones. */
public interface NotificationRepository extends JpaRepository<AppNotification, UUID> {
    List<AppNotification> findAllByOrderByCreatedAtDesc();

    void deleteAllByUser(AppUser user);

    List<AppNotification> findAllByUserOrderByCreatedAtDesc(AppUser user);

    List<AppNotification> findAllByUserAndReadFalseOrderByCreatedAtDesc(AppUser user);

    long countByUserAndReadFalse(AppUser user);

    Optional<AppNotification> findByIdAndUser(UUID id, AppUser user);

    @Modifying
    @Query("update AppNotification n set n.read = true where n.user = :user and n.read = false")
    int markAllReadFor(@Param("user") AppUser user);
}

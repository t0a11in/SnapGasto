package cl.snapgasto.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.NotificationResponse;
import cl.snapgasto.backend.entity.AppNotification;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.repository.NotificationRepository;

@ExtendWith(MockitoExtension.class)
class UserNotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;

    private UserNotificationService service;
    private AppUser user;

    @BeforeEach
    void setUp() {
        service = new UserNotificationService(notificationRepository);
        user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setFullName("Ana");
    }

    private AppNotification notification(boolean read) {
        AppNotification n = new AppNotification();
        n.setId(UUID.randomUUID());
        n.setUser(user);
        n.setTitle("Próximo gasto");
        n.setBody("Arriendo");
        n.setRead(read);
        return n;
    }

    @Test
    void listsOnlyTheUsersUnreadNotifications() {
        when(notificationRepository.findAllByUserAndReadFalseOrderByCreatedAtDesc(user))
                .thenReturn(List.of(notification(false)));

        List<NotificationResponse> result = service.listFor(user, true);

        assertEquals(1, result.size());
        assertEquals(user.getId(), result.get(0).userId());
    }

    @Test
    void marksANotificationAsRead() {
        AppNotification n = notification(false);
        when(notificationRepository.findByIdAndUser(n.getId(), user)).thenReturn(Optional.of(n));

        assertTrue(service.markRead(n.getId(), user, true).read());
    }

    @Test
    void cannotTouchAnotherUsersNotification() {
        UUID id = UUID.randomUUID();
        when(notificationRepository.findByIdAndUser(id, user)).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> service.markRead(id, user, true));
    }

    @Test
    void marksAllAsRead() {
        when(notificationRepository.markAllReadFor(user)).thenReturn(3);
        assertEquals(3, service.markAllRead(user));
        verify(notificationRepository).markAllReadFor(user);
    }
}

package cl.snapgasto.backend.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import cl.snapgasto.backend.dto.NotificationResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.service.UserNotificationService;

/** Campana de notificaciones del usuario autenticado. */
@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notificaciones", description = "Avisos del usuario autenticado.")
@SecurityRequirement(name = "bearerAuth")
public class UserNotificationController {

    private final UserNotificationService notificationService;

    public UserNotificationController(UserNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/v1/mias")
    public List<NotificationResponse> mine(
            @RequestParam(name = "soloNoLeidas", defaultValue = "false") boolean onlyUnread,
            @AuthenticationPrincipal AppUser user) {
        return notificationService.listFor(user, onlyUnread);
    }

    @GetMapping("/v1/no-leidas/cantidad")
    public Map<String, Long> unreadCount(@AuthenticationPrincipal AppUser user) {
        return Map.of("count", notificationService.countUnread(user));
    }

    @RequestMapping(path = "/v1/{notificationId}/leida", method = { RequestMethod.PATCH, RequestMethod.PUT })
    public NotificationResponse markRead(
            @PathVariable UUID notificationId,
            @RequestParam(defaultValue = "true") boolean read,
            @AuthenticationPrincipal AppUser user) {
        return notificationService.markRead(notificationId, user, read);
    }

    @RequestMapping(path = "/v1/leer-todas", method = { RequestMethod.PATCH, RequestMethod.PUT })
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(@AuthenticationPrincipal AppUser user) {
        notificationService.markAllRead(user);
    }
}

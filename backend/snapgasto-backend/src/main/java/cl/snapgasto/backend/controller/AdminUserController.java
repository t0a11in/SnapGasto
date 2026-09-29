package cl.snapgasto.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import cl.snapgasto.backend.admin.AdminUserService;
import cl.snapgasto.backend.dto.AdminUserRequest;
import cl.snapgasto.backend.dto.AdminUserResponse;
import cl.snapgasto.backend.entity.AppUser;
import jakarta.validation.Valid;

/** Publica el mantenedor administrativo de usuarios. */
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public List<AdminUserResponse> list() {
        return adminUserService.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUserResponse create(@Valid @RequestBody AdminUserRequest request) {
        return adminUserService.create(request);
    }

    @PutMapping("/{userId}")
    public AdminUserResponse update(@PathVariable UUID userId, @Valid @RequestBody AdminUserRequest request) {
        return adminUserService.update(userId, request);
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID userId, @AuthenticationPrincipal AppUser currentUser) {
        adminUserService.delete(userId, currentUser);
    }
}

package cl.snapgasto.backend.admin;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.AdminUserRequest;
import cl.snapgasto.backend.dto.AdminUserResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.repository.ExpenseRepository;
import cl.snapgasto.backend.repository.NotificationRepository;
import cl.snapgasto.backend.repository.UserRepository;

/** Implementa el mantenedor de usuarios disponible sólo para administradores. */
@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(
            UserRepository userRepository,
            ExpenseRepository expenseRepository,
            NotificationRepository notificationRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.expenseRepository = expenseRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> list() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream().map(AdminUserResponse::from).toList();
    }

    @Transactional
    public AdminUserResponse create(AdminUserRequest request) {
        if (request.password() == null || request.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña es obligatoria al crear un usuario.");
        }
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una cuenta con ese correo.");
        }
        AppUser user = new AppUser();
        apply(request, user, true);
        return AdminUserResponse.from(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse update(UUID userId, AdminUserRequest request) {
        AppUser user = getUser(userId);
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCaseAndIdNot(email, userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una cuenta con ese correo.");
        }
        apply(request, user, false);
        return AdminUserResponse.from(user);
    }

    @Transactional
    public void delete(UUID userId, AppUser currentUser) {
        if (currentUser.getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes eliminar tu propia cuenta.");
        }
        AppUser user = getUser(userId);
        notificationRepository.deleteAllByUser(user);
        expenseRepository.deleteAllByUser(user);
        userRepository.delete(user);
    }

    private void apply(AdminUserRequest request, AppUser user, boolean creating) {
        user.setFullName(request.fullName().trim());
        user.setEmail(normalizeEmail(request.email()));
        user.setRole(request.role());
        if (creating || (request.password() != null && !request.password().isBlank())) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }
    }

    private AppUser getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado."));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}

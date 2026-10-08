package cl.snapgasto.backend.service;

import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.AuthRequest;
import cl.snapgasto.backend.dto.AuthResponse;
import cl.snapgasto.backend.dto.FirebaseLoginRequest;
import cl.snapgasto.backend.dto.RegisterRequest;
import cl.snapgasto.backend.dto.UserResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Role;
import cl.snapgasto.backend.repository.UserRepository;
import cl.snapgasto.backend.security.FirebaseIdentity;
import cl.snapgasto.backend.security.FirebaseTokenVerifier;
import cl.snapgasto.backend.security.JwtService;

/** Implementa registro y acceso con contraseña BCrypt para el MVP. */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final FirebaseTokenVerifier firebaseTokenVerifier;
    private final String bootstrapAdminEmail;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            FirebaseTokenVerifier firebaseTokenVerifier,
            @Value("${app.bootstrap.admin-email:}") String bootstrapAdminEmail) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.firebaseTokenVerifier = firebaseTokenVerifier;
        this.bootstrapAdminEmail = bootstrapAdminEmail;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una cuenta con ese correo.");
        }
        AppUser user = new AppUser();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(isBootstrapAdmin(email) ? Role.ADMIN : Role.USER);
        return responseFor(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        AppUser user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> invalidCredentials());
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw invalidCredentials();
        }
        return responseFor(user);
    }

    /**
     * Vincula una identidad Google verificada por Firebase con una cuenta local
     * y entrega el mismo JWT que consume el resto de la API.
     */
    @Transactional
    public AuthResponse loginWithGoogle(FirebaseLoginRequest request) {
        FirebaseIdentity identity = firebaseTokenVerifier.verifyGoogleToken(request.idToken());
        AppUser user = userRepository.findByFirebaseUid(identity.uid())
                .orElseGet(() -> userRepository.findByEmailIgnoreCase(identity.email()).orElse(null));

        if (user == null) {
            user = new AppUser();
            user.setEmail(identity.email());
            user.setFullName(identity.displayName());
            // La cuenta Google no tiene contraseña local. Se conserva una clave
            // BCrypt aleatoria para mantener la columna no nula y no habilitar
            // acceso por contraseña sin que el usuario la cree explícitamente.
            user.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
            user.setRole(isBootstrapAdmin(identity.email()) ? Role.ADMIN : Role.USER);
        } else if (user.getFirebaseUid() != null && !user.getFirebaseUid().equals(identity.uid())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este correo ya está vinculado a otra cuenta Google.");
        }

        user.setFirebaseUid(identity.uid());
        return responseFor(userRepository.save(user));
    }

    private AuthResponse responseFor(AppUser user) {
        return new AuthResponse(jwtService.generateToken(user.getUsername()), UserResponse.from(user));
    }

    private ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos.");
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private boolean isBootstrapAdmin(String email) {
        return !bootstrapAdminEmail.isBlank() && normalizeEmail(bootstrapAdminEmail).equals(email);
    }
}

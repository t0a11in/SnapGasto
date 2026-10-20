package cl.snapgasto.backend.service;

import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
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
import cl.snapgasto.backend.security.LoginAttemptService;

/** Implementa registro y acceso con contraseña BCrypt o con Google. */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final FirebaseTokenVerifier firebaseTokenVerifier;
    private final LoginAttemptService loginAttemptService;
    private final String bootstrapAdminEmail;
    /**
     * Hash de una clave aleatoria. Se compara contra él cuando el correo no
     * existe, para que el tiempo de respuesta no revele qué cuentas existen.
     */
    private final String dummyPasswordHash;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            FirebaseTokenVerifier firebaseTokenVerifier,
            LoginAttemptService loginAttemptService,
            @Value("${app.bootstrap.admin-email:}") String bootstrapAdminEmail) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.firebaseTokenVerifier = firebaseTokenVerifier;
        this.loginAttemptService = loginAttemptService;
        this.bootstrapAdminEmail = bootstrapAdminEmail == null ? "" : bootstrapAdminEmail;
        this.dummyPasswordHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

    /**
     * Crea siempre una cuenta USER. El correo no está verificado, así que el
     * registro nunca puede otorgar ADMIN (ni siquiera al correo bootstrap):
     * ese rol lo asigna {@code AdminBootstrap} a una cuenta existente o el
     * acceso con Google, cuyo correo sí viene verificado.
     */
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
        user.setRole(Role.USER);
        return responseFor(userRepository.save(user));
    }

    /**
     * Valida la contraseña. Tras varios intentos fallidos el correo queda
     * bloqueado temporalmente y se responde 429 aunque la clave sea correcta.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        String email = normalizeEmail(request.email());
        loginAttemptService.assertNotBlocked(email);

        AppUser user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        String storedHash = user == null ? dummyPasswordHash : user.getPassword();
        boolean passwordMatches = passwordEncoder.matches(request.password(), storedHash);
        if (user == null || !passwordMatches) {
            loginAttemptService.recordFailure(email);
            throw invalidCredentials();
        }
        loginAttemptService.recordSuccess(email);
        return responseFor(user);
    }

    /**
     * Vincula una identidad Google verificada por Firebase con una cuenta local
     * y entrega el mismo JWT que consume el resto de la API.
     *
     * <p>Si el correo ya tenía una cuenta con contraseña que nunca se había
     * vinculado a Google, se reemplaza la contraseña por una aleatoria y se
     * cierran sus sesiones. Así, quien hubiera registrado ese correo antes que
     * su dueño real (sin poder verificarlo) pierde el acceso.
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
            // La cuenta Google no tiene contraseña local utilizable.
            user.setPassword(randomPasswordHash());
            user.setRole(isBootstrapAdmin(identity.email()) ? Role.ADMIN : Role.USER);
        } else if (user.getFirebaseUid() == null) {
            // Primera vinculación de una cuenta creada con contraseña.
            user.setPassword(randomPasswordHash());
            user.invalidateSessions();
        } else if (!user.getFirebaseUid().equals(identity.uid())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este correo ya está vinculado a otra cuenta Google.");
        }

        user.setFirebaseUid(identity.uid());
        return responseFor(userRepository.save(user));
    }

    private AuthResponse responseFor(AppUser user) {
        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }

    private String randomPasswordHash() {
        return passwordEncoder.encode(UUID.randomUUID().toString());
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

package cl.snapgasto.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.AuthRequest;
import cl.snapgasto.backend.dto.AuthResponse;
import cl.snapgasto.backend.dto.FirebaseLoginRequest;
import cl.snapgasto.backend.dto.RegisterRequest;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Role;
import cl.snapgasto.backend.exception.TooManyRequestsException;
import cl.snapgasto.backend.repository.UserRepository;
import cl.snapgasto.backend.security.FirebaseIdentity;
import cl.snapgasto.backend.security.FirebaseTokenVerifier;
import cl.snapgasto.backend.security.JwtService;
import cl.snapgasto.backend.security.LoginAttemptService;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String ADMIN_EMAIL = "admin@example.com";

    @Mock
    private UserRepository userRepository;

    @Mock
    private FirebaseTokenVerifier firebaseTokenVerifier;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
    private final JwtService jwtService =
            new JwtService("test-only-jwt-secret-must-have-at-least-thirty-two-characters", 120, 168);
    private LoginAttemptService loginAttemptService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        loginAttemptService = new LoginAttemptService(3, Duration.ofMinutes(15).toMinutes());
        authService = new AuthService(userRepository, passwordEncoder, jwtService, firebaseTokenVerifier,
                loginAttemptService, ADMIN_EMAIL);
    }

    @Test
    void registeringWithTheBootstrapAdminEmailStillCreatesARegularUser() {
        when(userRepository.existsByEmailIgnoreCase(ADMIN_EMAIL)).thenReturn(false);
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = authService.register(new RegisterRequest("Intruso", ADMIN_EMAIL, "password123"));

        assertEquals("USER", response.user().role());
    }

    @Test
    void locksTheEmailAfterRepeatedFailuresEvenIfThePasswordIsThenCorrect() {
        AppUser user = localUser("ada@example.com", "correct-password");
        when(userRepository.findByEmailIgnoreCase("ada@example.com")).thenReturn(Optional.of(user));

        for (int i = 0; i < 3; i++) {
            ResponseStatusException failure = assertThrows(ResponseStatusException.class,
                    () -> authService.login(new AuthRequest("ada@example.com", "wrong-password")));
            assertEquals(HttpStatus.UNAUTHORIZED, failure.getStatusCode());
        }

        assertThrows(TooManyRequestsException.class,
                () -> authService.login(new AuthRequest("ada@example.com", "correct-password")));
    }

    @Test
    void unknownEmailsAlsoCountTowardsTheLock() {
        when(userRepository.findByEmailIgnoreCase("ghost@example.com")).thenReturn(Optional.empty());

        for (int i = 0; i < 3; i++) {
            assertThrows(ResponseStatusException.class,
                    () -> authService.login(new AuthRequest("ghost@example.com", "whatever")));
        }

        assertThrows(TooManyRequestsException.class,
                () -> authService.login(new AuthRequest("ghost@example.com", "whatever")));
    }

    @Test
    void firstGoogleLinkOfAPasswordAccountRotatesThePasswordAndClosesItsSessions() {
        AppUser preRegistered = localUser("victim@example.com", "attacker-password");
        String attackerToken = jwtService.generateToken(preRegistered);
        when(firebaseTokenVerifier.verifyGoogleToken("google-id-token"))
                .thenReturn(new FirebaseIdentity("firebase-uid", "victim@example.com", "Victim"));
        when(userRepository.findByFirebaseUid("firebase-uid")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("victim@example.com")).thenReturn(Optional.of(preRegistered));
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.loginWithGoogle(new FirebaseLoginRequest("google-id-token"));

        assertEquals("firebase-uid", preRegistered.getFirebaseUid());
        assertFalse(passwordEncoder.matches("attacker-password", preRegistered.getPassword()));
        assertEquals(1, preRegistered.getSessionVersion());
        assertEquals(0, jwtService.sessionVersion(jwtService.parseClaims(attackerToken)));
    }

    @Test
    void googleSignInWithTheVerifiedBootstrapEmailCreatesAnAdmin() {
        when(firebaseTokenVerifier.verifyGoogleToken("google-id-token"))
                .thenReturn(new FirebaseIdentity("admin-uid", ADMIN_EMAIL, "Admin"));
        when(userRepository.findByFirebaseUid("admin-uid")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase(ADMIN_EMAIL)).thenReturn(Optional.empty());
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = authService.loginWithGoogle(new FirebaseLoginRequest("google-id-token"));

        assertEquals("ADMIN", response.user().role());
    }

    private AppUser localUser(String email, String password) {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setFullName("Local");
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(Role.USER);
        return user;
    }
}

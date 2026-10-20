package cl.snapgasto.backend.security;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import cl.snapgasto.backend.exception.TooManyRequestsException;

/**
 * Bloquea temporalmente el login con contraseña de un correo después de varios
 * intentos fallidos seguidos, para frenar ataques de fuerza bruta.
 *
 * <p>El estado vive en memoria: es suficiente para una sola instancia de la API.
 * Si se escala a varias instancias hay que moverlo a un almacenamiento compartido.
 */
@Service
public class LoginAttemptService {

    private final int maxFailures;
    private final Duration lockDuration;
    private final Clock clock;
    private final Map<String, Attempts> attemptsByKey = new ConcurrentHashMap<>();

    @Autowired
    public LoginAttemptService(
            @Value("${app.security.login-attempts.max-failures:5}") int maxFailures,
            @Value("${app.security.login-attempts.lock-minutes:15}") long lockMinutes) {
        this(maxFailures, Duration.ofMinutes(lockMinutes), Clock.systemUTC());
    }

    LoginAttemptService(int maxFailures, Duration lockDuration, Clock clock) {
        this.maxFailures = Math.max(1, maxFailures);
        this.lockDuration = lockDuration;
        this.clock = clock;
    }

    /** Lanza {@link TooManyRequestsException} si el correo está bloqueado. */
    public void assertNotBlocked(String key) {
        Attempts attempts = attemptsByKey.get(key);
        if (attempts == null) {
            return;
        }
        Instant now = clock.instant();
        if (attempts.lockedUntil != null && now.isBefore(attempts.lockedUntil)) {
            long seconds = Duration.between(now, attempts.lockedUntil).toSeconds() + 1;
            throw new TooManyRequestsException(
                    "Demasiados intentos fallidos. Vuelve a intentarlo en unos minutos.", seconds);
        }
    }

    public void recordFailure(String key) {
        Instant now = clock.instant();
        attemptsByKey.compute(key, (ignored, current) -> {
            Attempts attempts = current == null || current.isStale(now, lockDuration) ? new Attempts() : current;
            if (attempts.lockedUntil != null && !now.isBefore(attempts.lockedUntil)) {
                // El bloqueo anterior terminó: se empieza a contar de nuevo.
                attempts = new Attempts();
            }
            attempts.failures++;
            attempts.lastFailure = now;
            if (attempts.failures >= maxFailures) {
                attempts.lockedUntil = now.plus(lockDuration);
            }
            return attempts;
        });
    }

    public void recordSuccess(String key) {
        attemptsByKey.remove(key);
    }

    /** Descarta entradas antiguas para que el mapa no crezca sin límite. */
    @Scheduled(fixedDelayString = "PT10M", initialDelayString = "PT10M")
    public void evictStaleEntries() {
        Instant now = clock.instant();
        attemptsByKey.entrySet().removeIf(entry -> entry.getValue().isStale(now, lockDuration));
    }

    private static final class Attempts {
        private int failures;
        private Instant lastFailure;
        private Instant lockedUntil;

        private boolean isStale(Instant now, Duration window) {
            Instant reference = lockedUntil != null ? lockedUntil : lastFailure.plus(window);
            return !now.isBefore(reference);
        }
    }
}

package cl.snapgasto.backend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

import cl.snapgasto.backend.entity.AppUser;
import io.jsonwebtoken.Claims;

class JwtServiceTest {

    private static final String SECRET = "test-only-jwt-secret-must-have-at-least-thirty-two-characters";
    private static final Instant NOW = Instant.parse("2026-10-19T12:00:00Z");

    @Test
    void rejectsAMissingOrShortSecret() {
        assertThrows(IllegalArgumentException.class, () -> new JwtService(null, 120, 168, Clock.systemUTC()));
        assertThrows(IllegalArgumentException.class, () -> new JwtService("short", 120, 168, Clock.systemUTC()));
    }

    @Test
    void embedsTheSessionVersionAndTheOriginalAuthenticationTime() {
        JwtService jwtService = service(NOW);
        AppUser user = user();
        user.invalidateSessions();
        Instant authTime = NOW.minus(Duration.ofHours(5));

        Claims claims = jwtService.parseClaims(jwtService.generateToken(user, authTime));

        assertEquals("ada@example.com", claims.getSubject());
        assertEquals(1, jwtService.sessionVersion(claims));
        assertEquals(authTime, jwtService.authTime(claims));
    }

    @Test
    void issuesDistinctTokensEvenWithinTheSameSecond() {
        JwtService jwtService = service(NOW);

        assertNotEquals(jwtService.generateToken(user()), jwtService.generateToken(user()));
    }

    @Test
    void detectsWhenASessionExceedsItsMaximumDuration() {
        JwtService jwtService = service(NOW);
        Claims recent = jwtService.parseClaims(jwtService.generateToken(user(), NOW.minus(Duration.ofHours(167))));
        Claims tooOld = jwtService.parseClaims(jwtService.generateToken(user(), NOW.minus(Duration.ofHours(169))));

        assertFalse(jwtService.exceedsMaxSession(recent));
        assertTrue(jwtService.exceedsMaxSession(tooOld));
    }

    private JwtService service(Instant now) {
        return new JwtService(SECRET, 120, 168, Clock.fixed(now, ZoneOffset.UTC));
    }

    private AppUser user() {
        AppUser user = new AppUser();
        user.setEmail("ada@example.com");
        return user;
    }
}

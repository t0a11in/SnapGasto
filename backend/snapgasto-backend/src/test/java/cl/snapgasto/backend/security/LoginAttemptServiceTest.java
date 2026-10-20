package cl.snapgasto.backend.security;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

import cl.snapgasto.backend.exception.TooManyRequestsException;

class LoginAttemptServiceTest {

    private final MutableClock clock = new MutableClock(Instant.parse("2026-10-19T12:00:00Z"));
    private final LoginAttemptService service = new LoginAttemptService(3, Duration.ofMinutes(15), clock);

    @Test
    void blocksAfterTheMaximumNumberOfConsecutiveFailures() {
        service.recordFailure("ada@example.com");
        service.recordFailure("ada@example.com");
        assertDoesNotThrow(() -> service.assertNotBlocked("ada@example.com"));

        service.recordFailure("ada@example.com");

        assertThrows(TooManyRequestsException.class, () -> service.assertNotBlocked("ada@example.com"));
        assertDoesNotThrow(() -> service.assertNotBlocked("other@example.com"));
    }

    @Test
    void unblocksOnceTheLockExpires() {
        for (int i = 0; i < 3; i++) {
            service.recordFailure("ada@example.com");
        }

        clock.advance(Duration.ofMinutes(16));

        assertDoesNotThrow(() -> service.assertNotBlocked("ada@example.com"));
    }

    @Test
    void aSuccessfulLoginResetsTheCounter() {
        service.recordFailure("ada@example.com");
        service.recordFailure("ada@example.com");
        service.recordSuccess("ada@example.com");
        service.recordFailure("ada@example.com");

        assertDoesNotThrow(() -> service.assertNotBlocked("ada@example.com"));
    }

    static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant now) {
            this.now = now;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}

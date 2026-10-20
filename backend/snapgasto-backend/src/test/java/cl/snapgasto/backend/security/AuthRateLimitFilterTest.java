package cl.snapgasto.backend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.time.Duration;
import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class AuthRateLimitFilterTest {

    private final LoginAttemptServiceTest.MutableClock clock =
            new LoginAttemptServiceTest.MutableClock(Instant.parse("2026-10-19T12:00:00Z"));
    private final AuthRateLimitFilter filter = new AuthRateLimitFilter(2, clock);

    @Test
    void returns429OnceAnIpExceedsTheLimitAndRecoversInTheNextWindow() throws Exception {
        assertEquals(200, call("POST", "/api/auth/login", "10.0.0.1").getStatus());
        assertEquals(200, call("POST", "/api/auth/login", "10.0.0.1").getStatus());

        MockHttpServletResponse blocked = call("POST", "/api/auth/login", "10.0.0.1");
        assertEquals(429, blocked.getStatus());
        assertNotNull(blocked.getHeader("Retry-After"));
        assertEquals(200, call("POST", "/api/auth/login", "10.0.0.2").getStatus());

        clock.advance(Duration.ofMinutes(1));
        assertEquals(200, call("POST", "/api/auth/login", "10.0.0.1").getStatus());
    }

    @Test
    void doesNotLimitOtherEndpointsOrMethods() throws Exception {
        for (int i = 0; i < 5; i++) {
            assertEquals(200, call("GET", "/api/auth/login", "10.0.0.3").getStatus());
            assertEquals(200, call("POST", "/api/expenses", "10.0.0.3").getStatus());
        }
    }

    private MockHttpServletResponse call(String method, String uri, String ip) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRemoteAddr(ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }
}

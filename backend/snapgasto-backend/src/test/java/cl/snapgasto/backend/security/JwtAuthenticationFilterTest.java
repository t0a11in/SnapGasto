package cl.snapgasto.backend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Role;
import cl.snapgasto.backend.service.TokenRevocationService;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    private static final String SECRET = "test-only-jwt-secret-must-have-at-least-thirty-two-characters";

    private final JwtService jwtService = new JwtService(SECRET, 120, 168, Clock.systemUTC());

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private TokenRevocationService tokenRevocationService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatesAValidTokenWhoseSessionVersionMatches() throws Exception {
        AppUser user = user();
        when(userDetailsService.loadUserByUsername("ada@example.com")).thenReturn(user);

        filter().doFilter(request(jwtService.generateToken(user)), new MockHttpServletResponse(), new MockFilterChain());

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals(user, SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    @Test
    void rejectsATokenIssuedBeforeTheSessionsWereInvalidated() throws Exception {
        AppUser user = user();
        String oldToken = jwtService.generateToken(user);
        user.invalidateSessions();
        when(userDetailsService.loadUserByUsername("ada@example.com")).thenReturn(user);

        filter().doFilter(request(oldToken), new MockHttpServletResponse(), new MockFilterChain());

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void rejectsARevokedToken() throws Exception {
        String token = jwtService.generateToken(user());
        when(tokenRevocationService.isRevoked(token)).thenReturn(true);

        filter().doFilter(request(token), new MockHttpServletResponse(), new MockFilterChain());

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void treatsADeletedTokenSubjectAsUnauthenticated() throws Exception {
        AppUser deleted = user();
        deleted.setEmail("deleted@example.com");
        when(userDetailsService.loadUserByUsername("deleted@example.com"))
                .thenThrow(new UsernameNotFoundException("Usuario no encontrado."));

        filter().doFilter(request(jwtService.generateToken(deleted)), new MockHttpServletResponse(),
                new MockFilterChain());

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void returns401WithTokenExpiredCodeWhenTheBearerTokenIsExpired() throws Exception {
        Clock threeHoursAgo = Clock.fixed(Instant.now().minus(Duration.ofHours(3)), ZoneOffset.UTC);
        String expired = new JwtService(SECRET, 120, 168, threeHoursAgo).generateToken(user());
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter().doFilter(request(expired), response, new MockFilterChain());

        assertEquals(401, response.getStatus());
        assertTrue(response.getContentType().startsWith("application/json"));
        assertEquals("{\"code\":\"TOKEN_EXPIRED\",\"message\":\"El token expiró. Inicia sesión nuevamente.\"}",
                response.getContentAsString());
        assertTrue(response.getHeader("WWW-Authenticate").contains("invalid_token"));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void ignoresAMalformedToken() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter().doFilter(request("not-a-jwt"), response, new MockFilterChain());

        assertEquals(200, response.getStatus());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    private JwtAuthenticationFilter filter() {
        return new JwtAuthenticationFilter(jwtService, userDetailsService, tokenRevocationService);
    }

    private MockHttpServletRequest request(String token) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        return request;
    }

    private AppUser user() {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setFullName("Ada Lovelace");
        user.setEmail("ada@example.com");
        user.setRole(Role.USER);
        return user;
    }
}

package cl.snapgasto.backend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

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

import cl.snapgasto.backend.service.TokenRevocationService;
import io.jsonwebtoken.ExpiredJwtException;
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private TokenRevocationService tokenRevocationService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void treatsADeletedTokenSubjectAsUnauthenticated() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token-with-deleted-user");
        when(jwtService.extractSubject("valid-token-with-deleted-user")).thenReturn("deleted@example.com");
        when(userDetailsService.loadUserByUsername("deleted@example.com"))
                .thenThrow(new UsernameNotFoundException("Usuario no encontrado."));

        new JwtAuthenticationFilter(jwtService, userDetailsService, tokenRevocationService)
                .doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void returns419WhenTheBearerTokenIsExpired() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer expired-token");
        when(jwtService.extractSubject("expired-token"))
                .thenThrow(new ExpiredJwtException(null, null, "El token expiró."));
        MockHttpServletResponse response = new MockHttpServletResponse();

        new JwtAuthenticationFilter(jwtService, userDetailsService, tokenRevocationService)
                .doFilter(request, response, new MockFilterChain());

        assertEquals(419, response.getStatus());
        assertTrue(response.getContentType().startsWith("application/json"));
        assertEquals("{\"code\":\"TOKEN_EXPIRED\",\"message\":\"El token expiró. Inicia sesión nuevamente.\"}",
                response.getContentAsString());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}

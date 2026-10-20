package cl.snapgasto.backend.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.service.TokenRevocationService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Inserta en el contexto de seguridad al usuario identificado por un bearer
 * token válido, no revocado y cuya versión de sesión sigue vigente.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final TokenRevocationService tokenRevocationService;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            CustomUserDetailsService userDetailsService,
            TokenRevocationService tokenRevocationService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.tokenRevocationService = tokenRevocationService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String token = BearerTokens.extract(request.getHeader("Authorization"));
        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        final Claims claims;
        try {
            claims = jwtService.parseClaims(token);
        } catch (ExpiredJwtException expired) {
            // 401 estándar con código explícito para que el cliente distinga
            // "token vencido" de "token inválido".
            AuthErrorResponses.tokenExpired(response);
            return;
        } catch (JwtException | IllegalArgumentException invalid) {
            // Token inválido: se continúa sin autenticar y SecurityConfig responde 401.
            filterChain.doFilter(request, response);
            return;
        }

        if (!tokenRevocationService.isRevoked(token)) {
            authenticate(request, claims);
        }
        filterChain.doFilter(request, response);
    }

    private void authenticate(HttpServletRequest request, Claims claims) {
        String email = claims.getSubject();
        if (email == null || SecurityContextHolder.getContext().getAuthentication() != null) {
            return;
        }
        try {
            UserDetails user = userDetailsService.loadUserByUsername(email);
            if (user instanceof AppUser appUser
                    && jwtService.sessionVersion(claims) != appUser.getSessionVersion()) {
                // Las sesiones de esta cuenta fueron invalidadas (logout-all,
                // cambio de contraseña o de rol): el token ya no sirve.
                return;
            }
            var authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (AuthenticationException userNoLongerExists) {
            // Usuario eliminado: la solicitud sigue como no autenticada.
        }
    }
}

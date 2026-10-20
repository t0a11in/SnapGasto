package cl.snapgasto.backend.security;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Limita por IP las solicitudes POST a los endpoints públicos de autenticación
 * (ventana fija de un minuto). Responde 429 con {@code Retry-After}.
 *
 * <p>Usa {@code request.getRemoteAddr()}: si la API queda detrás de un proxy
 * inverso, configura {@code server.forward-headers-strategy} para obtener la IP
 * real del cliente. El estado vive en memoria (una sola instancia).
 */
public class AuthRateLimitFilter extends OncePerRequestFilter {

    static final Set<String> LIMITED_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/v1/login",
            "/api/auth/register",
            "/api/auth/google");

    private static final long WINDOW_MILLIS = Duration.ofMinutes(1).toMillis();

    private final int maxRequestsPerWindow;
    private final Clock clock;
    private final Map<String, Window> windowsByIp = new ConcurrentHashMap<>();

    public AuthRateLimitFilter(int maxRequestsPerMinute) {
        this(maxRequestsPerMinute, Clock.systemUTC());
    }

    AuthRateLimitFilter(int maxRequestsPerMinute, Clock clock) {
        this.maxRequestsPerWindow = Math.max(1, maxRequestsPerMinute);
        this.clock = clock;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equalsIgnoreCase(request.getMethod())
                || !LIMITED_PATHS.contains(request.getRequestURI().substring(request.getContextPath().length()));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        long now = clock.millis();
        Window window = windowsByIp.compute(request.getRemoteAddr(), (ip, current) ->
                current == null || now - current.startedAt >= WINDOW_MILLIS ? new Window(now) : current);

        int count;
        synchronized (window) {
            count = ++window.requests;
        }
        if (count > maxRequestsPerWindow) {
            long retryAfterSeconds = (window.startedAt + WINDOW_MILLIS - now + 999) / 1000;
            AuthErrorResponses.tooManyRequests(response, retryAfterSeconds);
            return;
        }
        if (windowsByIp.size() > 10_000) {
            windowsByIp.entrySet().removeIf(entry -> now - entry.getValue().startedAt >= WINDOW_MILLIS);
        }
        filterChain.doFilter(request, response);
    }

    private static final class Window {
        private final long startedAt;
        private int requests;

        private Window(long startedAt) {
            this.startedAt = startedAt;
        }
    }
}

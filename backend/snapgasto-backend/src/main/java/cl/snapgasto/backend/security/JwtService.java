package cl.snapgasto.backend.security;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import cl.snapgasto.backend.entity.AppUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Genera y verifica los tokens JWT de acceso emitidos por la API.
 *
 * <p>Claims propios:
 * <ul>
 *   <li>{@code sv}: versión de sesión del usuario; si no coincide con la de la
 *   base de datos el token deja de ser válido.</li>
 *   <li>{@code auth_time}: instante (epoch en segundos) del inicio de sesión
 *   original. Se conserva al renovar para imponer una duración máxima.</li>
 * </ul>
 */
@Service
public class JwtService {

    static final String SESSION_VERSION_CLAIM = "sv";
    static final String AUTH_TIME_CLAIM = "auth_time";
    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey signingKey;
    private final Duration expiration;
    private final Duration maxSession;
    private final Clock clock;

    @Autowired
    public JwtService(
            @Value("${app.security.jwt.secret}") String secret,
            @Value("${app.security.jwt.expiration-minutes}") long expirationMinutes,
            @Value("${app.security.jwt.max-session-hours:168}") long maxSessionHours) {
        this(secret, expirationMinutes, maxSessionHours, Clock.systemUTC());
    }

    JwtService(String secret, long expirationMinutes, long maxSessionHours, Clock clock) {
        if (secret == null || secret.isBlank()
                || secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalArgumentException("JWT_SECRET debe tener al menos 32 bytes.");
        }
        if (expirationMinutes <= 0 || maxSessionHours <= 0) {
            throw new IllegalArgumentException("La expiración y la duración máxima de sesión deben ser positivas.");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = Duration.ofMinutes(expirationMinutes);
        this.maxSession = Duration.ofHours(maxSessionHours);
        this.clock = clock;
    }

    /** Emite un token para un inicio de sesión nuevo. */
    public String generateToken(AppUser user) {
        return generateToken(user, clock.instant());
    }

    /** Emite un token conservando el instante del inicio de sesión original. */
    public String generateToken(AppUser user, Instant authTime) {
        Instant now = clock.instant();
        return Jwts.builder()
                // jti único: dos tokens emitidos en el mismo segundo nunca son
                // idénticos, así revocar uno no afecta al otro.
                .id(UUID.randomUUID().toString())
                .subject(user.getUsername())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expiration)))
                .claim(SESSION_VERSION_CLAIM, user.getSessionVersion())
                .claim(AUTH_TIME_CLAIM, authTime.getEpochSecond())
                .signWith(signingKey)
                .compact();
    }

    /**
     * Verifica firma y expiración.
     *
     * @throws io.jsonwebtoken.ExpiredJwtException si el token expiró
     * @throws io.jsonwebtoken.JwtException si el token no es válido
     */
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .clock(() -> Date.from(clock.instant()))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractSubject(String token) {
        return parseClaims(token).getSubject();
    }

    public Date extractExpiration(String token) {
        return parseClaims(token).getExpiration();
    }

    /** Versión de sesión del token; los tokens anteriores a este claim valen 0. */
    public int sessionVersion(Claims claims) {
        Object value = claims.get(SESSION_VERSION_CLAIM);
        return value instanceof Number number ? number.intValue() : 0;
    }

    /** Inicio de sesión original; si el token no lo trae se usa su fecha de emisión. */
    public Instant authTime(Claims claims) {
        Object value = claims.get(AUTH_TIME_CLAIM);
        if (value instanceof Number number) {
            return Instant.ofEpochSecond(number.longValue());
        }
        Date issuedAt = claims.getIssuedAt();
        return issuedAt == null ? Instant.EPOCH : issuedAt.toInstant();
    }

    /** Indica si la sesión superó su duración máxima absoluta. */
    public boolean exceedsMaxSession(Claims claims) {
        return clock.instant().isAfter(authTime(claims).plus(maxSession));
    }
}

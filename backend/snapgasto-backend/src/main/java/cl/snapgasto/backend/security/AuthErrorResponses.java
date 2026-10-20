package cl.snapgasto.backend.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import jakarta.servlet.http.HttpServletResponse;

/**
 * Respuestas JSON de autenticación escritas fuera de Spring MVC (filtros y
 * entry point). Mantienen la forma {@code {"code": "...", "message": "..."}}
 * y el header {@code WWW-Authenticate} de RFC 6750.
 */
public final class AuthErrorResponses {

    public static final String TOKEN_EXPIRED = "TOKEN_EXPIRED";
    public static final String UNAUTHORIZED = "UNAUTHORIZED";
    public static final String TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS";

    private AuthErrorResponses() {
    }

    /** 401 para un token vencido: el cliente debe volver a autenticarse. */
    public static void tokenExpired(HttpServletResponse response) throws IOException {
        response.setHeader("WWW-Authenticate",
                "Bearer error=\"invalid_token\", error_description=\"The access token expired\"");
        write(response, HttpServletResponse.SC_UNAUTHORIZED, TOKEN_EXPIRED,
                "El token expiró. Inicia sesión nuevamente.");
    }

    /** 401 genérico: falta el token, es inválido, fue revocado o el usuario ya no existe. */
    public static void unauthorized(HttpServletResponse response) throws IOException {
        response.setHeader("WWW-Authenticate", "Bearer");
        write(response, HttpServletResponse.SC_UNAUTHORIZED, UNAUTHORIZED, "No autorizado.");
    }

    /** 429 con {@code Retry-After} en segundos. */
    public static void tooManyRequests(HttpServletResponse response, long retryAfterSeconds) throws IOException {
        response.setHeader("Retry-After", Long.toString(Math.max(1, retryAfterSeconds)));
        write(response, 429, TOO_MANY_REQUESTS,
                "Demasiados intentos. Espera un momento antes de volver a intentarlo.");
    }

    private static void write(HttpServletResponse response, int status, String code, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"code\":\"" + code + "\",\"message\":\"" + message + "\"}");
    }
}

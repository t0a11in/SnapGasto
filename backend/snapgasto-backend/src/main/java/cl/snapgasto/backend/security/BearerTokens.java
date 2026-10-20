package cl.snapgasto.backend.security;

/** Extrae el token de un header {@code Authorization: Bearer <token>}. */
public final class BearerTokens {

    private static final String PREFIX = "Bearer ";

    private BearerTokens() {
    }

    /** Devuelve el token o {@code null} si el header falta o no es Bearer. */
    public static String extract(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(PREFIX)) {
            return null;
        }
        String token = authorizationHeader.substring(PREFIX.length()).trim();
        return token.isEmpty() ? null : token;
    }
}

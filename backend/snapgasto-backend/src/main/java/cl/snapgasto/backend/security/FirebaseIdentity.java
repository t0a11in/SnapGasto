package cl.snapgasto.backend.security;

/** Datos mínimos de una identidad Google validada criptográficamente. */
public record FirebaseIdentity(String uid, String email, String displayName) {
}

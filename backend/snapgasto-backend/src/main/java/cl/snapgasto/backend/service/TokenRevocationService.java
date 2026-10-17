package cl.snapgasto.backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import cl.snapgasto.backend.entity.RevokedToken;
import cl.snapgasto.backend.repository.RevokedTokenRepository;
import cl.snapgasto.backend.security.JwtService;

/** Revoca un JWT concreto sin almacenar su contenido sensible en la base de datos. */
@Service
public class TokenRevocationService {

    private final RevokedTokenRepository revokedTokenRepository;
    private final JwtService jwtService;

    public TokenRevocationService(RevokedTokenRepository revokedTokenRepository, JwtService jwtService) {
        this.revokedTokenRepository = revokedTokenRepository;
        this.jwtService = jwtService;
    }

    @Transactional
    public void revoke(String token) {
        String tokenHash = tokenHash(token);
        if (revokedTokenRepository.existsById(tokenHash)) {
            return;
        }

        LocalDateTime expiresAt = LocalDateTime.ofInstant(
                jwtService.extractExpiration(token).toInstant(),
                ZoneOffset.UTC);
        revokedTokenRepository.save(new RevokedToken(tokenHash, expiresAt));
    }

    @Transactional(readOnly = true)
    public boolean isRevoked(String token) {
        return revokedTokenRepository.existsById(tokenHash(token));
    }

    private String tokenHash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 no está disponible en la JVM.", exception);
        }
    }
}

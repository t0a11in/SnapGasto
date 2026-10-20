package cl.snapgasto.backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.RevokedToken;
import cl.snapgasto.backend.repository.RevokedTokenRepository;
import cl.snapgasto.backend.repository.UserRepository;
import cl.snapgasto.backend.security.JwtService;

/** Revoca JWT sin almacenar su contenido sensible en la base de datos. */
@Service
public class TokenRevocationService {

    private static final Logger log = LoggerFactory.getLogger(TokenRevocationService.class);

    private final RevokedTokenRepository revokedTokenRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public TokenRevocationService(
            RevokedTokenRepository revokedTokenRepository,
            UserRepository userRepository,
            JwtService jwtService) {
        this.revokedTokenRepository = revokedTokenRepository;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    /** Revoca un token concreto hasta su expiración natural. */
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

    /** Invalida todos los tokens emitidos para el usuario, en cualquier dispositivo. */
    @Transactional
    public void revokeAllSessions(AppUser user) {
        userRepository.findById(user.getId()).ifPresent(AppUser::invalidateSessions);
    }

    @Transactional(readOnly = true)
    public boolean isRevoked(String token) {
        return revokedTokenRepository.existsById(tokenHash(token));
    }

    /**
     * Un token revocado que ya expiró no puede volver a usarse, así que su
     * registro sobra. Se eliminan a diario para que la tabla no crezca.
     */
    @Scheduled(cron = "${app.security.revoked-token-cleanup-cron:0 15 3 * * *}")
    @Transactional
    public void deleteExpiredRevocations() {
        int deleted = revokedTokenRepository.deleteExpiredBefore(LocalDateTime.now(ZoneOffset.UTC));
        if (deleted > 0) {
            log.info("Se eliminaron {} tokens revocados ya expirados.", deleted);
        }
    }

    private String tokenHash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 no está disponible en la JVM.", exception);
        }
    }
}

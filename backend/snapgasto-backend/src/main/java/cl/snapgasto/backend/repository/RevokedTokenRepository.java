package cl.snapgasto.backend.repository;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import cl.snapgasto.backend.entity.RevokedToken;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, String> {

    /** Borra en bloque las revocaciones cuyo token ya expiró. */
    @Modifying
    @Query("delete from RevokedToken t where t.expiresAt < :now")
    int deleteExpiredBefore(@Param("now") LocalDateTime now);
}

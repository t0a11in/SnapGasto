package cl.snapgasto.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import cl.snapgasto.backend.entity.RevokedToken;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, String> {
}

package cl.snapgasto.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Income;

/** Consultas de ingresos limitadas por el propietario y por rango mensual. */
public interface IncomeRepository extends JpaRepository<Income, UUID> {
    List<Income> findAllByUserAndDateBetweenOrderByDateDescCreatedAtDesc(AppUser user, LocalDate start, LocalDate end);

    Optional<Income> findByIdAndUser(UUID id, AppUser user);
}

package cl.snapgasto.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Expense;

/** Ofrece consultas JPA de gastos limitadas por su propietario. */
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    List<Expense> findAllByUserOrderByDateDescCreatedAtDesc(AppUser user);

    List<Expense> findAllByOrderByDateDescCreatedAtDesc();

    Optional<Expense> findByIdAndUser(UUID id, AppUser user);

    void deleteAllByUser(AppUser user);
}

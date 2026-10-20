package cl.snapgasto.backend.repository;

import java.util.List;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Expense;
import cl.snapgasto.backend.entity.ExpenseGroup;

/** Ofrece consultas JPA de gastos limitadas por su propietario. */
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    List<Expense> findAllByUserOrderByDateDescCreatedAtDesc(AppUser user);

    List<Expense> findAllByUserAndDateBetweenOrderByDateDescCreatedAtDesc(AppUser user, LocalDate from, LocalDate to);

    List<Expense> findAllByExpenseGroupAndDateBetweenOrderByDateDescCreatedAtDesc(
            ExpenseGroup expenseGroup,
            LocalDate from,
            LocalDate to);

    List<Expense> findAllByOrderByDateDescCreatedAtDesc();

    Optional<Expense> findByIdAndUser(UUID id, AppUser user);

    void deleteAllByUser(AppUser user);
}

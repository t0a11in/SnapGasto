package cl.snapgasto.backend.repository;

import java.util.List;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Expense;
import cl.snapgasto.backend.entity.ExpenseGroup;
import cl.snapgasto.backend.entity.Project;

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

    boolean existsByProjectAndDate(Project project, LocalDate date);

    List<Expense> findAllByProjectOrderByDateDescCreatedAtDesc(Project project);

    /** Deja sin proyecto los gastos de un proyecto que se elimina (los gastos se conservan). */
    @Modifying
    @Query("update Expense e set e.project = null where e.project = :project")
    int detachProject(@Param("project") Project project);
}

package cl.snapgasto.backend.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import cl.snapgasto.backend.entity.ExpenseGroup;

/** Acceso JPA a los grupos de gastos compartidos. */
public interface ExpenseGroupRepository extends JpaRepository<ExpenseGroup, UUID> {
}

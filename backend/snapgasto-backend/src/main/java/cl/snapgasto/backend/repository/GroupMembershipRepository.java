package cl.snapgasto.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.ExpenseGroup;
import cl.snapgasto.backend.entity.GroupMembership;

/** Consultas de membresías de grupos compartidos. */
public interface GroupMembershipRepository extends JpaRepository<GroupMembership, java.util.UUID> {
    List<GroupMembership> findAllByUserOrderByExpenseGroupNameAsc(AppUser user);

    List<GroupMembership> findAllByExpenseGroupOrderByJoinedAtAsc(ExpenseGroup expenseGroup);

    Optional<GroupMembership> findByExpenseGroupAndUser(ExpenseGroup expenseGroup, AppUser user);
}

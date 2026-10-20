package cl.snapgasto.backend.service;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.ExpenseGroup;
import cl.snapgasto.backend.entity.GroupMemberRole;
import cl.snapgasto.backend.entity.GroupMembership;
import cl.snapgasto.backend.repository.ExpenseGroupRepository;
import cl.snapgasto.backend.repository.GroupMembershipRepository;

/** Centraliza la comprobación de membresía y propiedad de un grupo. */
@Service
public class GroupAccessService {

    private final ExpenseGroupRepository expenseGroupRepository;
    private final GroupMembershipRepository groupMembershipRepository;

    public GroupAccessService(
            ExpenseGroupRepository expenseGroupRepository,
            GroupMembershipRepository groupMembershipRepository) {
        this.expenseGroupRepository = expenseGroupRepository;
        this.groupMembershipRepository = groupMembershipRepository;
    }

    @Transactional(readOnly = true)
    public ExpenseGroup requireMember(UUID groupId, AppUser user) {
        ExpenseGroup group = expenseGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Grupo no encontrado."));
        groupMembershipRepository.findByExpenseGroupAndUser(group, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No perteneces a este grupo."));
        return group;
    }

    @Transactional(readOnly = true)
    public ExpenseGroup requireOwner(UUID groupId, AppUser user) {
        ExpenseGroup group = requireMember(groupId, user);
        GroupMembership membership = groupMembershipRepository.findByExpenseGroupAndUser(group, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No perteneces a este grupo."));
        if (membership.getRole() != GroupMemberRole.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el propietario puede administrar integrantes.");
        }
        return group;
    }
}

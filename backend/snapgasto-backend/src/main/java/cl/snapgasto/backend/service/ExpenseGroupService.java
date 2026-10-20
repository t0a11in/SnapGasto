package cl.snapgasto.backend.service;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.ExpenseGroupCreateRequest;
import cl.snapgasto.backend.dto.ExpenseGroupMemberRequest;
import cl.snapgasto.backend.dto.ExpenseGroupMemberResponse;
import cl.snapgasto.backend.dto.ExpenseGroupMonthlySummaryResponse;
import cl.snapgasto.backend.dto.ExpenseGroupResponse;
import cl.snapgasto.backend.dto.GroupMemberExpenseTotalResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Expense;
import cl.snapgasto.backend.entity.ExpenseGroup;
import cl.snapgasto.backend.entity.GroupMemberRole;
import cl.snapgasto.backend.entity.GroupMembership;
import cl.snapgasto.backend.repository.ExpenseGroupRepository;
import cl.snapgasto.backend.repository.ExpenseRepository;
import cl.snapgasto.backend.repository.GroupMembershipRepository;
import cl.snapgasto.backend.repository.UserRepository;

/** Casos de uso de agrupación y control compartido de gastos. */
@Service
public class ExpenseGroupService {

    private final ExpenseGroupRepository expenseGroupRepository;
    private final GroupMembershipRepository groupMembershipRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final GroupAccessService groupAccessService;

    public ExpenseGroupService(
            ExpenseGroupRepository expenseGroupRepository,
            GroupMembershipRepository groupMembershipRepository,
            UserRepository userRepository,
            ExpenseRepository expenseRepository,
            GroupAccessService groupAccessService) {
        this.expenseGroupRepository = expenseGroupRepository;
        this.groupMembershipRepository = groupMembershipRepository;
        this.userRepository = userRepository;
        this.expenseRepository = expenseRepository;
        this.groupAccessService = groupAccessService;
    }

    @Transactional
    public ExpenseGroupResponse create(ExpenseGroupCreateRequest request, AppUser owner) {
        ExpenseGroup group = new ExpenseGroup();
        group.setName(request.name().trim());
        group.setCreatedBy(owner);
        group = expenseGroupRepository.save(group);
        groupMembershipRepository.save(new GroupMembership(group, owner, GroupMemberRole.OWNER));
        return toResponse(group);
    }

    @Transactional(readOnly = true)
    public List<ExpenseGroupResponse> listFor(AppUser user) {
        return groupMembershipRepository.findAllByUserOrderByExpenseGroupNameAsc(user).stream()
                .map(GroupMembership::getExpenseGroup)
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ExpenseGroupResponse addMember(UUID groupId, ExpenseGroupMemberRequest request, AppUser actor) {
        ExpenseGroup group = groupAccessService.requireOwner(groupId, actor);
        AppUser user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No existe una cuenta con ese correo."));
        if (groupMembershipRepository.findByExpenseGroupAndUser(group, user).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La persona ya pertenece al grupo.");
        }
        groupMembershipRepository.save(new GroupMembership(group, user, GroupMemberRole.MEMBER));
        return toResponse(group);
    }

    @Transactional
    public void removeMember(UUID groupId, UUID memberId, AppUser actor) {
        ExpenseGroup group = groupAccessService.requireOwner(groupId, actor);
        AppUser member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado."));
        GroupMembership membership = groupMembershipRepository.findByExpenseGroupAndUser(group, member)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La persona no pertenece al grupo."));
        if (membership.getRole() == GroupMemberRole.OWNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede eliminar al propietario del grupo.");
        }
        groupMembershipRepository.delete(membership);
    }

    @Transactional(readOnly = true)
    public ExpenseGroupMonthlySummaryResponse summarize(UUID groupId, String requestedMonth, AppUser user) {
        ExpenseGroup group = groupAccessService.requireMember(groupId, user);
        YearMonth month = resolveMonth(requestedMonth);
        List<GroupMembership> memberships = groupMembershipRepository.findAllByExpenseGroupOrderByJoinedAtAsc(group);
        Map<UUID, BigDecimal> totalsByUser = new HashMap<>();
        memberships.forEach(membership -> totalsByUser.put(membership.getUser().getId(), BigDecimal.ZERO));

        for (Expense expense : expenseRepository.findAllByExpenseGroupAndDateBetweenOrderByDateDescCreatedAtDesc(
                group, month.atDay(1), month.atEndOfMonth())) {
            totalsByUser.merge(expense.getUser().getId(), expense.getAmount(), BigDecimal::add);
        }

        List<GroupMemberExpenseTotalResponse> memberTotals = memberships.stream()
                .map(membership -> new GroupMemberExpenseTotalResponse(
                        membership.getUser().getId(),
                        membership.getUser().getFullName(),
                        membership.getUser().getEmail(),
                        totalsByUser.getOrDefault(membership.getUser().getId(), BigDecimal.ZERO)))
                .toList();
        BigDecimal total = memberTotals.stream()
                .map(GroupMemberExpenseTotalResponse::total)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ExpenseGroupMonthlySummaryResponse(group.getId(), group.getName(), month.toString(), total, memberTotals);
    }

    private ExpenseGroupResponse toResponse(ExpenseGroup group) {
        List<ExpenseGroupMemberResponse> members = groupMembershipRepository
                .findAllByExpenseGroupOrderByJoinedAtAsc(group).stream()
                .map(ExpenseGroupMemberResponse::from)
                .toList();
        return new ExpenseGroupResponse(
                group.getId(),
                group.getName(),
                group.getCreatedBy().getId(),
                group.getCreatedAt(),
                members);
    }

    private YearMonth resolveMonth(String requestedMonth) {
        if (requestedMonth == null || requestedMonth.isBlank()) {
            return YearMonth.now();
        }
        try {
            return YearMonth.parse(requestedMonth.trim());
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El mes debe usar el formato AAAA-MM.");
        }
    }
}

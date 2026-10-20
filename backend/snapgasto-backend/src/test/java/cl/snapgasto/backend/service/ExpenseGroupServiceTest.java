package cl.snapgasto.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import cl.snapgasto.backend.dto.ExpenseGroupCreateRequest;
import cl.snapgasto.backend.dto.ExpenseGroupMonthlySummaryResponse;
import cl.snapgasto.backend.dto.ExpenseGroupResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Expense;
import cl.snapgasto.backend.entity.ExpenseGroup;
import cl.snapgasto.backend.entity.GroupMemberRole;
import cl.snapgasto.backend.entity.GroupMembership;
import cl.snapgasto.backend.repository.ExpenseGroupRepository;
import cl.snapgasto.backend.repository.ExpenseRepository;
import cl.snapgasto.backend.repository.GroupMembershipRepository;
import cl.snapgasto.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class ExpenseGroupServiceTest {

    @Mock
    private ExpenseGroupRepository expenseGroupRepository;

    @Mock
    private GroupMembershipRepository groupMembershipRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private GroupAccessService groupAccessService;

    private ExpenseGroupService service;
    private AppUser owner;

    @BeforeEach
    void setUp() {
        service = new ExpenseGroupService(
                expenseGroupRepository,
                groupMembershipRepository,
                userRepository,
                expenseRepository,
                groupAccessService);
        owner = user("Ada Lovelace", "ada@example.com");
    }

    @Test
    void createsAGroupAndMakesItsCreatorTheOwner() {
        when(expenseGroupRepository.save(any(ExpenseGroup.class))).thenAnswer(invocation -> {
            ExpenseGroup group = invocation.getArgument(0);
            group.setId(UUID.randomUUID());
            return group;
        });
        when(groupMembershipRepository.findAllByExpenseGroupOrderByJoinedAtAsc(any(ExpenseGroup.class)))
                .thenReturn(List.of());

        ExpenseGroupResponse response = service.create(new ExpenseGroupCreateRequest("  Casa  "), owner);

        ArgumentCaptor<ExpenseGroup> groupCaptor = ArgumentCaptor.forClass(ExpenseGroup.class);
        verify(expenseGroupRepository).save(groupCaptor.capture());
        assertEquals("Casa", groupCaptor.getValue().getName());
        assertEquals(owner, groupCaptor.getValue().getCreatedBy());

        ArgumentCaptor<GroupMembership> membershipCaptor = ArgumentCaptor.forClass(GroupMembership.class);
        verify(groupMembershipRepository).save(membershipCaptor.capture());
        assertEquals(owner, membershipCaptor.getValue().getUser());
        assertEquals(GroupMemberRole.OWNER, membershipCaptor.getValue().getRole());
        assertEquals("Casa", response.name());
    }

    @Test
    void summarizesAllExpensesAssignedToTheGroupByMember() {
        ExpenseGroup group = new ExpenseGroup();
        group.setId(UUID.randomUUID());
        group.setName("Casa");
        group.setCreatedBy(owner);
        AppUser member = user("Grace Hopper", "grace@example.com");
        GroupMembership ownerMembership = new GroupMembership(group, owner, GroupMemberRole.OWNER);
        GroupMembership memberMembership = new GroupMembership(group, member, GroupMemberRole.MEMBER);
        Expense expense = expense(group, member, "4500.00");

        when(groupAccessService.requireMember(group.getId(), owner)).thenReturn(group);
        when(groupMembershipRepository.findAllByExpenseGroupOrderByJoinedAtAsc(group))
                .thenReturn(List.of(ownerMembership, memberMembership));
        when(expenseRepository.findAllByExpenseGroupAndDateBetweenOrderByDateDescCreatedAtDesc(
                group, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31)))
                .thenReturn(List.of(expense));

        ExpenseGroupMonthlySummaryResponse response = service.summarize(group.getId(), "2026-10", owner);

        assertEquals(new BigDecimal("4500.00"), response.total());
        assertEquals(new BigDecimal("0"), response.memberTotals().get(0).total());
        assertEquals(new BigDecimal("4500.00"), response.memberTotals().get(1).total());
    }

    private AppUser user(String name, String email) {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setFullName(name);
        user.setEmail(email);
        return user;
    }

    private Expense expense(ExpenseGroup group, AppUser user, String amount) {
        Expense expense = new Expense();
        expense.setExpenseGroup(group);
        expense.setUser(user);
        expense.setAmount(new BigDecimal(amount));
        return expense;
    }
}

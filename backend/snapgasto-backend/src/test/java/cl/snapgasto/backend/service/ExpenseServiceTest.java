package cl.snapgasto.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.ExpenseRequest;
import cl.snapgasto.backend.dto.ExpenseResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Expense;
import cl.snapgasto.backend.repository.ExpenseRepository;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    private ExpenseService expenseService;
    private AppUser user;

    @BeforeEach
    void setUp() {
        expenseService = new ExpenseService(expenseRepository);
        user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setEmail("person@example.com");
    }

    @Test
    void createsAnExpenseForTheAuthenticatedUserAndNormalizesOptionalText() {
        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("12490.50"),
                "  Alimentación  ",
                LocalDate.of(2026, 10, 8),
                "   ",
                "  Tarjeta  ");
        UUID id = UUID.randomUUID();
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> {
            Expense expense = invocation.getArgument(0);
            expense.setId(id);
            return expense;
        });

        ExpenseResponse response = expenseService.create(request, user);

        ArgumentCaptor<Expense> captor = ArgumentCaptor.forClass(Expense.class);
        verify(expenseRepository).save(captor.capture());
        Expense saved = captor.getValue();
        assertEquals(user, saved.getUser());
        assertEquals(new BigDecimal("12490.50"), saved.getAmount());
        assertEquals("Alimentación", saved.getCategory());
        assertEquals("Tarjeta", saved.getPaymentMethod());
        assertNull(saved.getDescription());
        assertEquals(id, response.id());
    }

    @Test
    void listsOnlyTheExpensesReturnedForTheAuthenticatedUser() {
        Expense first = expense("Supermercado", LocalDate.of(2026, 10, 8));
        Expense second = expense("Transporte", LocalDate.of(2026, 10, 7));
        when(expenseRepository.findAllByUserOrderByDateDescCreatedAtDesc(user))
                .thenReturn(List.of(first, second));

        List<ExpenseResponse> response = expenseService.listFor(user);

        assertEquals(List.of("Supermercado", "Transporte"),
                response.stream().map(ExpenseResponse::description).toList());
        verify(expenseRepository).findAllByUserOrderByDateDescCreatedAtDesc(user);
    }

    @Test
    void deletesOnlyAnExpenseBelongingToTheAuthenticatedUser() {
        UUID expenseId = UUID.randomUUID();
        Expense expense = expense("Café", LocalDate.now());
        when(expenseRepository.findByIdAndUser(expenseId, user)).thenReturn(Optional.of(expense));

        expenseService.delete(expenseId, user);

        verify(expenseRepository).delete(expense);
    }

    @Test
    void refusesToDeleteAnExpenseFromAnotherUserOrAnUnknownExpense() {
        UUID expenseId = UUID.randomUUID();
        when(expenseRepository.findByIdAndUser(expenseId, user)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> expenseService.delete(expenseId, user));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    private Expense expense(String description, LocalDate date) {
        Expense expense = new Expense();
        expense.setId(UUID.randomUUID());
        expense.setAmount(new BigDecimal("1000.00"));
        expense.setCategory("General");
        expense.setDate(date);
        expense.setDescription(description);
        expense.setPaymentMethod("Tarjeta");
        expense.setUser(user);
        return expense;
    }
}

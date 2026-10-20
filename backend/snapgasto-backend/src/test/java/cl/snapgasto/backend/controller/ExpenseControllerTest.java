package cl.snapgasto.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import cl.snapgasto.backend.dto.ExpenseRequest;
import cl.snapgasto.backend.dto.ExpenseResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.service.ExpenseService;

@ExtendWith(MockitoExtension.class)
class ExpenseControllerTest {

    @Mock
    private ExpenseService expenseService;

    private ExpenseController controller;
    private AppUser user;

    @BeforeEach
    void setUp() {
        controller = new ExpenseController(expenseService);
        user = new AppUser();
        user.setId(UUID.randomUUID());
    }

    @Test
    void delegatesTheAuthenticatedUserWhenListingExpenses() {
        List<ExpenseResponse> expected = List.of(response());
        when(expenseService.listFor(user)).thenReturn(expected);

        List<ExpenseResponse> result = controller.list(user);

        assertEquals(expected, result);
        verify(expenseService).listFor(user);
    }

    @Test
    void delegatesTheSelectedMonthForTheVersionedList() {
        List<ExpenseResponse> expected = List.of(response());
        when(expenseService.listFor(user, "2026-10")).thenReturn(expected);

        List<ExpenseResponse> result = controller.listV1("2026-10", user);

        assertEquals(expected, result);
        verify(expenseService).listFor(user, "2026-10");
    }

    @Test
    void delegatesAValidExpenseCreationRequest() {
        ExpenseRequest request = request();
        ExpenseResponse expected = response();
        when(expenseService.create(request, user)).thenReturn(expected);

        ExpenseResponse result = controller.create(request, user);

        assertEquals(expected, result);
        verify(expenseService).create(request, user);
    }

    @Test
    void delegatesDeletionUsingBothExpenseIdAndAuthenticatedUser() {
        UUID expenseId = UUID.randomUUID();

        controller.delete(expenseId, user);

        verify(expenseService).delete(expenseId, user);
    }

    @Test
    void delegatesVersionedExpenseUpdate() {
        UUID expenseId = UUID.randomUUID();
        ExpenseRequest request = request();
        ExpenseResponse expected = response();
        when(expenseService.update(expenseId, request, user)).thenReturn(expected);

        ExpenseResponse result = controller.update(expenseId, request, user);

        assertEquals(expected, result);
        verify(expenseService).update(expenseId, request, user);
    }

    private ExpenseRequest request() {
        return new ExpenseRequest(new BigDecimal("1000.00"), "General", LocalDate.now(), "Prueba", "Tarjeta");
    }

    private ExpenseResponse response() {
        return new ExpenseResponse(UUID.randomUUID(), new BigDecimal("1000.00"), "General", LocalDate.now(),
                "Prueba", "Tarjeta");
    }
}

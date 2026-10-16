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

import cl.snapgasto.backend.dto.IncomeMonthlySummaryResponse;
import cl.snapgasto.backend.dto.IncomeRequest;
import cl.snapgasto.backend.dto.IncomeResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.IncomeType;
import cl.snapgasto.backend.service.IncomeService;

@ExtendWith(MockitoExtension.class)
class IncomeControllerTest {

    @Mock
    private IncomeService incomeService;

    private IncomeController controller;
    private AppUser user;

    @BeforeEach
    void setUp() {
        controller = new IncomeController(incomeService);
        user = new AppUser();
        user.setId(UUID.randomUUID());
    }

    @Test
    void delegatesTheVersionedListingAndSummaryRequests() {
        List<IncomeResponse> expectedList = List.of(response());
        IncomeMonthlySummaryResponse expectedSummary = new IncomeMonthlySummaryResponse("2026-10",
                new BigDecimal("1000.00"), BigDecimal.ZERO, new BigDecimal("1000.00"));
        when(incomeService.listFor(user, "2026-10")).thenReturn(expectedList);
        when(incomeService.summarizeFor(user, "2026-10")).thenReturn(expectedSummary);

        assertEquals(expectedList, controller.list("2026-10", user));
        assertEquals(expectedSummary, controller.summary("2026-10", user));
        verify(incomeService).listFor(user, "2026-10");
        verify(incomeService).summarizeFor(user, "2026-10");
    }

    @Test
    void delegatesTheMaintainerCommandsWithTheAuthenticatedUser() {
        UUID incomeId = UUID.randomUUID();
        IncomeRequest request = new IncomeRequest(new BigDecimal("1000.00"), IncomeType.TARJETA,
                LocalDate.of(2026, 10, 1), "Prueba");
        IncomeResponse expected = response();
        when(incomeService.create(request, user)).thenReturn(expected);
        when(incomeService.update(incomeId, request, user)).thenReturn(expected);

        assertEquals(expected, controller.create(request, user));
        assertEquals(expected, controller.update(incomeId, request, user));
        controller.delete(incomeId, user);

        verify(incomeService).create(request, user);
        verify(incomeService).update(incomeId, request, user);
        verify(incomeService).delete(incomeId, user);
    }

    private IncomeResponse response() {
        return new IncomeResponse(UUID.randomUUID(), new BigDecimal("1000.00"), IncomeType.TARJETA,
                LocalDate.of(2026, 10, 1), "Prueba");
    }
}

package cl.snapgasto.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
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

import cl.snapgasto.backend.dto.IncomeMonthlySummaryResponse;
import cl.snapgasto.backend.dto.IncomeRequest;
import cl.snapgasto.backend.dto.IncomeResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Income;
import cl.snapgasto.backend.entity.IncomeType;
import cl.snapgasto.backend.repository.IncomeRepository;

@ExtendWith(MockitoExtension.class)
class IncomeServiceTest {

    @Mock
    private IncomeRepository incomeRepository;

    private IncomeService incomeService;
    private AppUser user;

    @BeforeEach
    void setUp() {
        incomeService = new IncomeService(incomeRepository);
        user = new AppUser();
        user.setId(UUID.randomUUID());
    }

    @Test
    void createsIncomeForTheAuthenticatedUserAndNormalizesDescription() {
        IncomeRequest request = new IncomeRequest(new BigDecimal("20000.00"), IncomeType.TARJETA,
                LocalDate.of(2026, 10, 10), "  sueldo parcial  ");
        UUID incomeId = UUID.randomUUID();
        when(incomeRepository.save(any(Income.class))).thenAnswer(invocation -> {
            Income saved = invocation.getArgument(0);
            saved.setId(incomeId);
            return saved;
        });

        IncomeResponse result = incomeService.create(request, user);

        ArgumentCaptor<Income> captor = ArgumentCaptor.forClass(Income.class);
        verify(incomeRepository).save(captor.capture());
        assertEquals(user, captor.getValue().getUser());
        assertEquals(IncomeType.TARJETA, captor.getValue().getType());
        assertEquals("sueldo parcial", captor.getValue().getDescription());
        assertEquals(incomeId, result.id());
    }

    @Test
    void returnsSeparateAndCombinedTotalsForTheRequestedMonth() {
        when(incomeRepository.findAllByUserAndDateBetweenOrderByDateDescCreatedAtDesc(
                user, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31)))
                .thenReturn(List.of(
                        income("12500.00", IncomeType.TARJETA, LocalDate.of(2026, 10, 11)),
                        income("8000.00", IncomeType.FISICO, LocalDate.of(2026, 10, 5)),
                        income("2500.00", IncomeType.TARJETA, LocalDate.of(2026, 10, 1))));

        IncomeMonthlySummaryResponse result = incomeService.summarizeFor(user, "2026-10");

        assertEquals("2026-10", result.month());
        assertEquals(new BigDecimal("15000.00"), result.totalTarjeta());
        assertEquals(new BigDecimal("8000.00"), result.totalFisico());
        assertEquals(new BigDecimal("23000.00"), result.total());
    }

    @Test
    void usesTheCurrentMonthWhenNoMonthIsProvided() {
        YearMonth currentMonth = YearMonth.now();
        when(incomeRepository.findAllByUserAndDateBetweenOrderByDateDescCreatedAtDesc(
                user, currentMonth.atDay(1), currentMonth.atEndOfMonth())).thenReturn(List.of());

        IncomeMonthlySummaryResponse result = incomeService.summarizeFor(user, null);

        assertEquals(currentMonth.toString(), result.month());
        assertEquals(BigDecimal.ZERO, result.totalTarjeta());
        assertEquals(BigDecimal.ZERO, result.totalFisico());
        assertEquals(BigDecimal.ZERO, result.total());
    }

    @Test
    void listsOnlyTheRequestedMonthForTheAuthenticatedUser() {
        Income income = income("15000.00", IncomeType.FISICO, LocalDate.of(2026, 9, 30));
        when(incomeRepository.findAllByUserAndDateBetweenOrderByDateDescCreatedAtDesc(
                user, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30))).thenReturn(List.of(income));

        List<IncomeResponse> result = incomeService.listFor(user, "2026-09");

        assertEquals(1, result.size());
        assertEquals(IncomeType.FISICO, result.get(0).type());
    }

    @Test
    void rejectsAnInvalidMonthBeforeQueryingTheRepository() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> incomeService.listFor(user, "10-2026"));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }

    @Test
    void updatesAndDeletesOnlyAnIncomeOwnedByTheAuthenticatedUser() {
        UUID incomeId = UUID.randomUUID();
        Income income = income("1000.00", IncomeType.FISICO, LocalDate.of(2026, 10, 1));
        when(incomeRepository.findByIdAndUser(incomeId, user)).thenReturn(Optional.of(income));
        when(incomeRepository.save(income)).thenReturn(income);

        IncomeResponse result = incomeService.update(incomeId,
                new IncomeRequest(new BigDecimal("3000.00"), IncomeType.TARJETA, LocalDate.of(2026, 10, 2), "   "), user);
        incomeService.delete(incomeId, user);

        assertEquals(new BigDecimal("3000.00"), result.amount());
        assertEquals(IncomeType.TARJETA, result.type());
        assertNull(result.description());
        verify(incomeRepository).delete(income);
    }

    @Test
    void refusesToChangeAnIncomeThatIsNotOwnedByTheAuthenticatedUser() {
        UUID incomeId = UUID.randomUUID();
        when(incomeRepository.findByIdAndUser(incomeId, user)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> incomeService.delete(incomeId, user));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    private Income income(String amount, IncomeType type, LocalDate date) {
        Income income = new Income();
        income.setId(UUID.randomUUID());
        income.setAmount(new BigDecimal(amount));
        income.setType(type);
        income.setDate(date);
        income.setUser(user);
        return income;
    }
}

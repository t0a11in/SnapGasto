package cl.snapgasto.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;

import cl.snapgasto.backend.entity.Project;
import cl.snapgasto.backend.entity.ProjectType;
import cl.snapgasto.backend.entity.RecurrenceFrequency;

class ProjectCalculatorTest {

    private Project recurring(RecurrenceFrequency frequency, int day, LocalDate start, LocalDate end) {
        Project p = new Project();
        p.setType(ProjectType.RECURRENTE);
        p.setFrequency(frequency);
        p.setDayOfMonth(day);
        p.setStartDate(start);
        p.setEndDate(end);
        p.setRecurringAmount(new BigDecimal("450000"));
        return p;
    }

    @Test
    void monthlyOccurrenceRespectsStartAndEndDates() {
        Project p = recurring(RecurrenceFrequency.MENSUAL, 5, LocalDate.of(2026, 10, 10), LocalDate.of(2027, 1, 31));

        assertTrue(ProjectCalculator.occurrenceIn(p, YearMonth.of(2026, 10)).isEmpty(), "el 05-10 es antes del inicio");
        assertEquals(Optional.of(LocalDate.of(2026, 11, 5)), ProjectCalculator.occurrenceIn(p, YearMonth.of(2026, 11)));
        assertEquals(Optional.of(LocalDate.of(2027, 1, 5)), ProjectCalculator.occurrenceIn(p, YearMonth.of(2027, 1)));
        assertTrue(ProjectCalculator.occurrenceIn(p, YearMonth.of(2027, 2)).isEmpty(), "después del término");
    }

    @Test
    void yearlyOccurrenceOnlyInTheStartMonth() {
        Project p = recurring(RecurrenceFrequency.ANUAL, 15, LocalDate.of(2026, 3, 1), null);

        assertTrue(ProjectCalculator.occurrenceIn(p, YearMonth.of(2026, 10)).isEmpty());
        assertEquals(Optional.of(LocalDate.of(2027, 3, 15)), ProjectCalculator.occurrenceIn(p, YearMonth.of(2027, 3)));
        assertEquals(new BigDecimal("37500"), ProjectCalculator.monthlyEquivalent(p));
    }

    @Test
    void nextOccurrenceSkipsOmittedMonths() {
        Project p = recurring(RecurrenceFrequency.MENSUAL, 5, LocalDate.of(2026, 1, 1), null);

        assertEquals(Optional.of(LocalDate.of(2026, 11, 5)),
                ProjectCalculator.nextOccurrence(p, LocalDate.of(2026, 10, 20), Set.of()));
        assertEquals(Optional.of(LocalDate.of(2026, 12, 5)),
                ProjectCalculator.nextOccurrence(p, LocalDate.of(2026, 10, 20), Set.of("2026-11")));
        assertEquals(Optional.of(LocalDate.of(2026, 10, 5)),
                ProjectCalculator.nextOccurrence(p, LocalDate.of(2026, 10, 5), Set.of()), "el mismo día cuenta");
    }

    @Test
    void monthsLeftCountsTheCurrentMonth() {
        YearMonth october = YearMonth.of(2026, 10);
        assertEquals(3, ProjectCalculator.monthsLeft(LocalDate.of(2026, 12, 20), october));
        assertEquals(1, ProjectCalculator.monthsLeft(LocalDate.of(2026, 10, 31), october));
        assertEquals(0, ProjectCalculator.monthsLeft(LocalDate.of(2026, 8, 1), october));
        assertNull(ProjectCalculator.monthsLeft(null, october));
    }

    @Test
    void monthlySuggestionRoundsUpToWholePesos() {
        assertEquals(new BigDecimal("333334"), ProjectCalculator.monthlySuggested(new BigDecimal("1000000"), 3));
        assertEquals(new BigDecimal("1000000"), ProjectCalculator.monthlySuggested(new BigDecimal("1000000"), 0));
        assertEquals(BigDecimal.ZERO, ProjectCalculator.monthlySuggested(BigDecimal.ZERO, 5));
        assertNull(ProjectCalculator.monthlySuggested(new BigDecimal("1000"), null));
    }

    @Test
    void remainingIsNeverNegative() {
        assertEquals(BigDecimal.ZERO, ProjectCalculator.remaining(new BigDecimal("100"), new BigDecimal("150")));
        assertEquals(new BigDecimal("40"), ProjectCalculator.remaining(new BigDecimal("100"), new BigDecimal("60")));
    }

    @Test
    void formatsChileanPesos() {
        assertEquals("$450.000", Money.format(new BigDecimal("450000")));
        assertEquals("$1.234.568", Money.format(new BigDecimal("1234567.6")));
        assertEquals("$0", Money.format(null));
    }
}

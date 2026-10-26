package cl.snapgasto.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.Set;

import cl.snapgasto.backend.entity.Project;
import cl.snapgasto.backend.entity.ProjectType;
import cl.snapgasto.backend.entity.RecurrenceFrequency;

/**
 * Cálculos puros de proyectos (sin base de datos ni reloj), compartidos por el
 * servicio, la tarea diaria y las pruebas. Los montos sugeridos se redondean
 * hacia arriba a pesos enteros.
 */
public final class ProjectCalculator {

    /** Horizonte máximo para buscar la próxima ocurrencia de un recurrente. */
    static final int MAX_LOOKAHEAD_MONTHS = 24;

    private ProjectCalculator() {
    }

    /**
     * Fecha en que un recurrente ocurre dentro del mes, respetando inicio y término.
     * No considera estado ni meses omitidos.
     */
    public static Optional<LocalDate> occurrenceIn(Project project, YearMonth month) {
        if (project.getType() != ProjectType.RECURRENTE || project.getDayOfMonth() == null
                || project.getFrequency() == null || project.getStartDate() == null) {
            return Optional.empty();
        }
        if (project.getFrequency() == RecurrenceFrequency.ANUAL
                && month.getMonth() != project.getStartDate().getMonth()) {
            return Optional.empty();
        }
        LocalDate date = month.atDay(Math.min(project.getDayOfMonth(), month.lengthOfMonth()));
        if (date.isBefore(project.getStartDate())) {
            return Optional.empty();
        }
        if (project.getEndDate() != null && date.isAfter(project.getEndDate())) {
            return Optional.empty();
        }
        return Optional.of(date);
    }

    /** Próxima ocurrencia en o después de {@code from} que no esté omitida. */
    public static Optional<LocalDate> nextOccurrence(Project project, LocalDate from, Set<String> skippedMonths) {
        YearMonth start = YearMonth.from(from);
        for (int i = 0; i <= MAX_LOOKAHEAD_MONTHS; i++) {
            YearMonth month = start.plusMonths(i);
            if (skippedMonths.contains(month.toString())) {
                continue;
            }
            Optional<LocalDate> occurrence = occurrenceIn(project, month);
            if (occurrence.isPresent() && !occurrence.get().isBefore(from)) {
                return occurrence;
            }
        }
        return Optional.empty();
    }

    /** Costo mensual equivalente de un recurrente: los anuales se reparten en 12. */
    public static BigDecimal monthlyEquivalent(Project project) {
        if (project.getType() != ProjectType.RECURRENTE || project.getRecurringAmount() == null) {
            return null;
        }
        return project.getFrequency() == RecurrenceFrequency.ANUAL
                ? project.getRecurringAmount().divide(BigDecimal.valueOf(12), 0, RoundingMode.HALF_UP)
                : project.getRecurringAmount();
    }

    /**
     * Meses disponibles hasta la fecha objetivo contando el mes actual
     * (objetivo este mes = 1). Si la fecha ya pasó, 0. Sin fecha, {@code null}.
     */
    public static Integer monthsLeft(LocalDate targetDate, YearMonth currentMonth) {
        if (targetDate == null) {
            return null;
        }
        long diff = ChronoUnit.MONTHS.between(currentMonth, YearMonth.from(targetDate));
        return (int) Math.max(0, diff + 1);
    }

    /** Lo que falta para el objetivo; nunca negativo. */
    public static BigDecimal remaining(BigDecimal target, BigDecimal covered) {
        if (target == null) {
            return null;
        }
        BigDecimal value = target.subtract(covered == null ? BigDecimal.ZERO : covered);
        return value.signum() < 0 ? BigDecimal.ZERO : value;
    }

    /**
     * Aporte mensual sugerido: lo que falta repartido en los meses restantes.
     * Vencida la fecha (0 meses) se sugiere todo lo que falta. Sin fecha, {@code null}.
     */
    public static BigDecimal monthlySuggested(BigDecimal remaining, Integer monthsLeft) {
        if (remaining == null || monthsLeft == null) {
            return null;
        }
        if (remaining.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        if (monthsLeft <= 1) {
            return remaining.setScale(0, RoundingMode.CEILING);
        }
        return remaining.divide(BigDecimal.valueOf(monthsLeft), 0, RoundingMode.CEILING);
    }

    /** Proporción alcanzada (0..1 o más), con 4 decimales. */
    public static BigDecimal ratio(BigDecimal value, BigDecimal target) {
        if (value == null || target == null || target.signum() <= 0) {
            return null;
        }
        return value.divide(target, 4, RoundingMode.HALF_UP);
    }
}

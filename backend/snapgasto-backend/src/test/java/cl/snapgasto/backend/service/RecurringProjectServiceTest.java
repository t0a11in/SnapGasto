package cl.snapgasto.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionOperations;

import cl.snapgasto.backend.entity.AppNotification;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Expense;
import cl.snapgasto.backend.entity.Project;
import cl.snapgasto.backend.entity.ProjectSkippedMonth;
import cl.snapgasto.backend.entity.ProjectStatus;
import cl.snapgasto.backend.entity.ProjectType;
import cl.snapgasto.backend.entity.RecurrenceFrequency;
import cl.snapgasto.backend.repository.ExpenseRepository;
import cl.snapgasto.backend.repository.NotificationRepository;
import cl.snapgasto.backend.repository.ProjectRepository;
import cl.snapgasto.backend.repository.ProjectSkippedMonthRepository;

@ExtendWith(MockitoExtension.class)
class RecurringProjectServiceTest {

    @Mock private ProjectRepository projectRepository;
    @Mock private ProjectSkippedMonthRepository skippedMonthRepository;
    @Mock private ExpenseRepository expenseRepository;
    @Mock private NotificationRepository notificationRepository;

    private RecurringProjectService service;
    private AppUser user;

    @BeforeEach
    void setUp() {
        service = new RecurringProjectService(projectRepository, skippedMonthRepository, expenseRepository,
                notificationRepository, TransactionOperations.withoutTransaction(),
                Clock.system(ZoneId.of("America/Santiago")));
        user = new AppUser();
        user.setId(UUID.randomUUID());
        lenient().when(skippedMonthRepository.findAllByProject(any())).thenReturn(List.of());
    }

    private Project rent(LocalDate start, LocalDateTime createdAt) {
        Project p = new Project();
        p.setId(UUID.randomUUID());
        p.setUser(user);
        p.setType(ProjectType.RECURRENTE);
        p.setStatus(ProjectStatus.EN_CURSO);
        p.setName("Arriendo");
        p.setCategory("Vivienda");
        p.setRecurringAmount(new BigDecimal("450000"));
        p.setFrequency(RecurrenceFrequency.MENSUAL);
        p.setDayOfMonth(5);
        p.setStartDate(start);
        p.setPaymentMethod("TRANSFERENCIA");
        p.setNotifyDaysBefore(3);
        p.setCreatedAt(createdAt);
        return p;
    }

    private Project longRunningRent() {
        return rent(LocalDate.of(2026, 1, 1), LocalDateTime.of(2026, 1, 1, 9, 0));
    }

    @Test
    void registersTheExpenseOnItsDayMarkedAsGenerated() {
        Project p = longRunningRent();
        p.setLastGeneratedOn(LocalDate.of(2026, 9, 5));

        int generated = service.process(p, LocalDate.of(2026, 10, 5));

        assertEquals(1, generated);
        ArgumentCaptor<Expense> captor = ArgumentCaptor.forClass(Expense.class);
        verify(expenseRepository).save(captor.capture());
        Expense e = captor.getValue();
        assertEquals(LocalDate.of(2026, 10, 5), e.getDate());
        assertEquals(new BigDecimal("450000"), e.getAmount());
        assertEquals("Vivienda", e.getCategory());
        assertEquals("Arriendo", e.getDescription());
        assertEquals("TRANSFERENCIA", e.getPaymentMethod());
        assertEquals(user, e.getUser());
        assertEquals(p, e.getProject());
        assertTrue(e.isGenerated());
        assertEquals(LocalDate.of(2026, 10, 5), p.getLastGeneratedOn());
    }

    @Test
    void runningTwiceTheSameDayDoesNotDuplicate() {
        Project p = longRunningRent();
        p.setLastGeneratedOn(LocalDate.of(2026, 9, 5));

        service.process(p, LocalDate.of(2026, 10, 5));
        int second = service.process(p, LocalDate.of(2026, 10, 5));

        assertEquals(0, second);
        verify(expenseRepository, times(1)).save(any());
    }

    @Test
    void doesNotBackfillBeforeTheProjectWasCreated() {
        // Arriendo "desde enero" creado el 20-10: no se registran enero a octubre.
        Project p = rent(LocalDate.of(2026, 1, 1), LocalDateTime.of(2026, 10, 20, 10, 0));

        int generated = service.process(p, LocalDate.of(2026, 10, 20));

        assertEquals(0, generated);
        verify(expenseRepository, never()).save(any());
    }

    @Test
    void catchesUpOccurrencesMissedWhileTheApiWasDown() {
        Project p = longRunningRent();
        p.setLastGeneratedOn(LocalDate.of(2026, 8, 5));

        int generated = service.process(p, LocalDate.of(2026, 10, 7));

        assertEquals(2, generated); // 05-09 y 05-10
        assertEquals(LocalDate.of(2026, 10, 5), p.getLastGeneratedOn());
    }

    @Test
    void respectsSkippedMonthsAndExistingExpenses() {
        Project p = longRunningRent();
        p.setLastGeneratedOn(LocalDate.of(2026, 8, 5));
        ProjectSkippedMonth skip = new ProjectSkippedMonth();
        skip.setMonth("2026-09");
        when(skippedMonthRepository.findAllByProject(p)).thenReturn(List.of(skip));
        when(expenseRepository.existsByProjectAndDate(p, LocalDate.of(2026, 10, 5))).thenReturn(true);

        int generated = service.process(p, LocalDate.of(2026, 10, 5));

        assertEquals(0, generated);
        verify(expenseRepository, never()).save(any());
        assertEquals(LocalDate.of(2026, 10, 5), p.getLastGeneratedOn());
    }

    @Test
    void notifiesOnceBeforeTheNextOccurrence() {
        Project p = longRunningRent();
        p.setLastGeneratedOn(LocalDate.of(2026, 10, 5));

        service.process(p, LocalDate.of(2026, 11, 1)); // faltan 4 días: aún no
        verify(notificationRepository, never()).save(any());

        service.process(p, LocalDate.of(2026, 11, 2)); // faltan 3 días: avisa
        service.process(p, LocalDate.of(2026, 11, 3)); // no repite

        ArgumentCaptor<AppNotification> captor = ArgumentCaptor.forClass(AppNotification.class);
        verify(notificationRepository, times(1)).save(captor.capture());
        AppNotification n = captor.getValue();
        assertEquals(user, n.getUser());
        assertTrue(n.getBody().contains("$450.000"));
        assertTrue(n.getBody().contains("05-11-2026"));
        assertEquals(LocalDate.of(2026, 11, 5), p.getLastNotifiedOn());
    }

    @Test
    void pausedProjectsAreIgnored() {
        Project p = longRunningRent();
        p.setStatus(ProjectStatus.PAUSADO);

        assertEquals(0, service.process(p, LocalDate.of(2026, 10, 5)));
        verify(expenseRepository, never()).save(any());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void remindsAPlannedPurchaseOnceNearItsTargetDate() {
        Project bed = new Project();
        bed.setId(UUID.randomUUID());
        bed.setUser(user);
        bed.setType(ProjectType.COMPRA);
        bed.setStatus(ProjectStatus.PLANIFICADO);
        bed.setName("Cama");
        bed.setTargetDate(LocalDate.of(2026, 10, 30));
        bed.setNotifyDaysBefore(3);

        service.process(bed, LocalDate.of(2026, 10, 26));
        verify(notificationRepository, never()).save(any());

        service.process(bed, LocalDate.of(2026, 10, 27));
        service.process(bed, LocalDate.of(2026, 10, 28));
        verify(notificationRepository, times(1)).save(any());
        assertEquals(LocalDate.of(2026, 10, 30), bed.getLastNotifiedOn());
    }

    @Test
    void oneFailingProjectDoesNotStopTheOthers() {
        Project broken = longRunningRent();
        Project ok = longRunningRent();
        ok.setLastGeneratedOn(LocalDate.of(2026, 9, 5));
        when(projectRepository.findAllByTypeInAndStatusIn(any(), any())).thenReturn(List.of(broken, ok));
        when(projectRepository.findById(broken.getId())).thenThrow(new IllegalStateException("boom"));
        when(projectRepository.findById(ok.getId())).thenReturn(Optional.of(ok));

        int generated = service.processAll(LocalDate.of(2026, 10, 5));

        assertEquals(1, generated);
        verify(expenseRepository).save(any());
        verify(expenseRepository, never()).existsByProjectAndDate(eq(broken), any());
    }
}

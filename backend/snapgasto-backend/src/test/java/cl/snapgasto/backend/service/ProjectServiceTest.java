package cl.snapgasto.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
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

import cl.snapgasto.backend.dto.CommitmentState;
import cl.snapgasto.backend.dto.ExpenseResponse;
import cl.snapgasto.backend.dto.ProjectCommitmentItem;
import cl.snapgasto.backend.dto.ProjectCommitmentsResponse;
import cl.snapgasto.backend.dto.ProjectCompleteRequest;
import cl.snapgasto.backend.dto.ProjectMovementRequest;
import cl.snapgasto.backend.dto.ProjectProjectionMonth;
import cl.snapgasto.backend.dto.ProjectRequest;
import cl.snapgasto.backend.dto.ProjectResponse;
import cl.snapgasto.backend.dto.SavingsSummaryResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Expense;
import cl.snapgasto.backend.entity.Project;
import cl.snapgasto.backend.entity.ProjectMovement;
import cl.snapgasto.backend.entity.ProjectMovementKind;
import cl.snapgasto.backend.entity.ProjectPriority;
import cl.snapgasto.backend.entity.ProjectSkippedMonth;
import cl.snapgasto.backend.entity.ProjectStatus;
import cl.snapgasto.backend.entity.ProjectType;
import cl.snapgasto.backend.entity.RecurrenceFrequency;
import cl.snapgasto.backend.repository.ExpenseRepository;
import cl.snapgasto.backend.repository.ProjectMovementRepository;
import cl.snapgasto.backend.repository.ProjectRepository;
import cl.snapgasto.backend.repository.ProjectSkippedMonthRepository;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    private static final ZoneId SANTIAGO = ZoneId.of("America/Santiago");
    /** "Hoy" en las pruebas: 20-10-2026. */
    private static final Clock CLOCK = Clock.fixed(
            ZonedDateTime.of(2026, 10, 20, 12, 0, 0, 0, SANTIAGO).toInstant(), SANTIAGO);

    @Mock private ProjectRepository projectRepository;
    @Mock private ProjectMovementRepository movementRepository;
    @Mock private ProjectSkippedMonthRepository skippedMonthRepository;
    @Mock private ExpenseRepository expenseRepository;

    private ProjectService service;
    private AppUser user;

    @BeforeEach
    void setUp() {
        service = new ProjectService(projectRepository, movementRepository, skippedMonthRepository, expenseRepository, CLOCK);
        user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setEmail("ana@example.com");
        lenient().when(projectRepository.save(any(Project.class))).thenAnswer(inv -> {
            Project p = inv.getArgument(0);
            if (p.getId() == null) {
                p.setId(UUID.randomUUID());
            }
            return p;
        });
    }

    // ------------------------------------------------------------ helpers

    private ProjectRequest request(ProjectType type, BigDecimal target, LocalDate targetDate,
            BigDecimal recurringAmount, Integer day, LocalDate start) {
        return new ProjectRequest("  Cama nueva  ", type, " Hogar ", null, null, "  ", target, targetDate,
                null, null, null, recurringAmount, null, day, start, null, null, null);
    }

    private Project project(ProjectType type) {
        Project p = new Project();
        p.setId(UUID.randomUUID());
        p.setUser(user);
        p.setType(type);
        p.setName(type.name().toLowerCase());
        p.setCategory("Hogar");
        p.setPriority(ProjectPriority.MEDIA);
        p.setStatus(ProjectStatus.PLANIFICADO);
        p.setCreatedAt(LocalDateTime.of(2026, 1, 1, 10, 0));
        return p;
    }

    private Project arriendo() {
        Project p = project(ProjectType.RECURRENTE);
        p.setName("Arriendo");
        p.setRecurringAmount(new BigDecimal("450000"));
        p.setFrequency(RecurrenceFrequency.MENSUAL);
        p.setDayOfMonth(5);
        p.setStartDate(LocalDate.of(2026, 1, 1));
        return p;
    }

    private ProjectMovement movement(Project p, ProjectMovementKind kind, String amount, LocalDate date) {
        ProjectMovement m = new ProjectMovement();
        m.setId(UUID.randomUUID());
        m.setProject(p);
        m.setKind(kind);
        m.setAmount(new BigDecimal(amount));
        m.setDate(date);
        return m;
    }

    private void owned(Project p) {
        when(projectRepository.findByIdAndUser(p.getId(), user)).thenReturn(Optional.of(p));
    }

    private void context(List<Project> projects, List<ProjectMovement> movements, List<ProjectSkippedMonth> skipped) {
        when(projectRepository.findAllByUserOrderByCreatedAtDesc(user)).thenReturn(projects);
        when(movementRepository.findAllByOwner(user)).thenReturn(movements);
        when(skippedMonthRepository.findAllByOwner(user)).thenReturn(skipped);
    }

    // ------------------------------------------------------------ CRUD

    @Test
    void createsAPurchaseNormalizingTextAndDefaults() {
        ProjectResponse response = service.create(
                request(ProjectType.COMPRA, new BigDecimal("399990"), LocalDate.of(2026, 12, 15), null, null, null), user);

        assertEquals("Cama nueva", response.name());
        assertEquals("Hogar", response.category());
        assertEquals(ProjectPriority.MEDIA, response.priority());
        assertEquals(ProjectStatus.PLANIFICADO, response.status());
        assertNull(response.notes());
        assertEquals(new BigDecimal("399990"), response.remaining());
        assertEquals(3, response.monthsLeft());
    }

    @Test
    void rejectsAPurchaseWithoutAmount() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.create(request(ProjectType.COMPRA, null, null, null, null, null), user));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verify(projectRepository, never()).save(any());
    }

    @Test
    void recurringDefaultsToMonthlyFromTodayAndComputesNextOccurrence() {
        ProjectResponse response = service.create(
                request(ProjectType.RECURRENTE, null, null, new BigDecimal("9990"), 25, null), user);

        assertEquals(RecurrenceFrequency.MENSUAL, response.frequency());
        assertEquals(LocalDate.of(2026, 10, 20), response.startDate());
        assertEquals("OTRO", response.paymentMethod());
        assertEquals(LocalDate.of(2026, 10, 25), response.nextOccurrence());
        assertEquals(new BigDecimal("9990"), response.monthlyEquivalent());
    }

    @Test
    void recurringRequiresDayOfMonth() {
        assertThrows(ResponseStatusException.class,
                () -> service.create(request(ProjectType.RECURRENTE, null, null, new BigDecimal("9990"), null, null), user));
    }

    @Test
    void doesNotAllowChangingTheProjectType() {
        Project p = project(ProjectType.COMPRA);
        owned(p);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.update(p.getId(),
                request(ProjectType.AHORRO, new BigDecimal("1000"), null, null, null, null), user));
        assertTrue(ex.getReason().contains("tipo"));
    }

    @Test
    void deletingDetachesExpensesAndRemovesChildren() {
        Project p = arriendo();
        owned(p);

        service.delete(p.getId(), user);

        verify(expenseRepository).detachProject(p);
        verify(movementRepository).deleteAllByProject(p);
        verify(skippedMonthRepository).deleteAllByProject(p);
        verify(projectRepository).delete(p);
    }

    @Test
    void anotherUsersProjectIsNotFound() {
        UUID id = UUID.randomUUID();
        when(projectRepository.findByIdAndUser(id, user)).thenReturn(Optional.empty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.get(id, user));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    // ------------------------------------------------------------ Ahorro

    @Test
    void contributionMovesAPlannedGoalToInProgress() {
        Project goal = project(ProjectType.AHORRO);
        goal.setTargetAmount(new BigDecimal("5000000"));
        owned(goal);
        when(movementRepository.findAllByProjectOrderByDateDescCreatedAtDesc(goal)).thenReturn(List.of());
        when(movementRepository.save(any(ProjectMovement.class))).thenAnswer(inv -> inv.getArgument(0));

        service.addMovement(goal.getId(), new ProjectMovementRequest(ProjectMovementKind.APORTE,
                new BigDecimal("200000"), LocalDate.of(2026, 10, 20), " sueldo "), user);

        assertEquals(ProjectStatus.EN_CURSO, goal.getStatus());
        ArgumentCaptor<ProjectMovement> captor = ArgumentCaptor.forClass(ProjectMovement.class);
        verify(movementRepository).save(captor.capture());
        assertEquals("sueldo", captor.getValue().getNote());
    }

    @Test
    void cannotWithdrawMoreThanSaved() {
        Project goal = project(ProjectType.AHORRO);
        goal.setTargetAmount(new BigDecimal("5000000"));
        owned(goal);
        when(movementRepository.findAllByProjectOrderByDateDescCreatedAtDesc(goal)).thenReturn(List.of(
                movement(goal, ProjectMovementKind.APORTE, "300000", LocalDate.of(2026, 9, 1)),
                movement(goal, ProjectMovementKind.RETIRO, "100000", LocalDate.of(2026, 9, 15))));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.addMovement(goal.getId(),
                new ProjectMovementRequest(ProjectMovementKind.RETIRO, new BigDecimal("200001"), LocalDate.of(2026, 10, 1), null),
                user));
        assertTrue(ex.getReason().contains("$200.000"));
    }

    @Test
    void movementsAreOnlyForSavingsGoals() {
        Project purchase = project(ProjectType.COMPRA);
        owned(purchase);
        assertThrows(ResponseStatusException.class, () -> service.addMovement(purchase.getId(),
                new ProjectMovementRequest(ProjectMovementKind.APORTE, BigDecimal.TEN, LocalDate.of(2026, 10, 1), null), user));
    }

    @Test
    void cannotDeleteAContributionThatLeavesSavingsNegative() {
        Project goal = project(ProjectType.AHORRO);
        owned(goal);
        ProjectMovement aporte = movement(goal, ProjectMovementKind.APORTE, "100000", LocalDate.of(2026, 9, 1));
        ProjectMovement retiro = movement(goal, ProjectMovementKind.RETIRO, "80000", LocalDate.of(2026, 9, 2));
        when(movementRepository.findAllByProjectOrderByDateDescCreatedAtDesc(goal)).thenReturn(List.of(retiro, aporte));

        assertThrows(ResponseStatusException.class, () -> service.deleteMovement(goal.getId(), aporte.getId(), user));
        verify(movementRepository, never()).delete(any());
    }

    @Test
    void savingsGoalReportsProgressAndMonthlySuggestion() {
        Project goal = project(ProjectType.AHORRO);
        goal.setTargetAmount(new BigDecimal("1200000"));
        goal.setTargetDate(LocalDate.of(2027, 3, 31)); // oct..mar = 6 meses
        goal.setStatus(ProjectStatus.EN_CURSO);
        context(List.of(goal), List.of(
                movement(goal, ProjectMovementKind.APORTE, "300000", LocalDate.of(2026, 9, 10)),
                movement(goal, ProjectMovementKind.APORTE, "100000", LocalDate.of(2026, 10, 2))), List.of());

        ProjectResponse response = service.listFor(user, null, null).get(0);

        assertEquals(new BigDecimal("400000"), response.savedAmount());
        assertEquals(new BigDecimal("800000"), response.remaining());
        assertEquals(new BigDecimal("0.3333"), response.progressRatio());
        assertEquals(6, response.monthsLeft());
        // Faltaban 900.000 al inicio de octubre / 6 meses: el aporte del mes no cambia la meta mensual.
        assertEquals(new BigDecimal("150000"), response.monthlySuggested());
    }

    // ------------------------------------------------------------ Compra

    @Test
    void completingAPurchaseRegistersTheRealExpense() {
        Project cama = project(ProjectType.COMPRA);
        cama.setName("Cama");
        cama.setTargetAmount(new BigDecimal("399990"));
        owned(cama);
        UUID expenseId = UUID.randomUUID();
        when(expenseRepository.save(any(Expense.class))).thenAnswer(inv -> {
            Expense e = inv.getArgument(0);
            e.setId(expenseId);
            return e;
        });

        ExpenseResponse response = service.complete(cama.getId(),
                new ProjectCompleteRequest(new BigDecimal("379990"), LocalDate.of(2026, 10, 19), "TARJETA", null, " "), user);

        assertEquals(new BigDecimal("379990"), response.amount());
        assertEquals("Hogar", response.category());
        assertEquals("Cama", response.description());
        assertEquals(cama.getId(), response.projectId());
        assertEquals(ProjectStatus.COMPLETADO, cama.getStatus());
        assertEquals(expenseId, cama.getExpenseId());
    }

    @Test
    void aClosedPurchaseCannotBeCompletedTwice() {
        Project cama = project(ProjectType.COMPRA);
        cama.setStatus(ProjectStatus.COMPLETADO);
        owned(cama);
        assertThrows(ResponseStatusException.class, () -> service.complete(cama.getId(),
                new ProjectCompleteRequest(BigDecimal.TEN, LocalDate.of(2026, 10, 1), "OTRO", null, null), user));
    }

    // ------------------------------------------------------------ Omitir mes

    @Test
    void skippingAMonthIsIdempotent() {
        Project p = arriendo();
        owned(p);
        when(skippedMonthRepository.findByProjectAndMonth(p, "2026-11")).thenReturn(Optional.of(new ProjectSkippedMonth()));

        service.skipMonth(p.getId(), "2026-11", user);

        verify(skippedMonthRepository, never()).save(any());
    }

    @Test
    void skippingValidatesTheMonthFormat() {
        Project p = arriendo();
        owned(p);
        assertThrows(ResponseStatusException.class, () -> service.skipMonth(p.getId(), "11-2026", user));
    }

    // ------------------------------------------------------------ Compromisos

    @Test
    void commitmentsOfTheMonthSeparatePendingFromRegistered() {
        Project rent = arriendo();                                 // día 5: ya registrado
        Project netflix = arriendo();
        netflix.setName("Netflix");
        netflix.setRecurringAmount(new BigDecimal("9990"));
        netflix.setDayOfMonth(25);                                 // día 25: pendiente
        Project gym = arriendo();
        gym.setName("Gimnasio");
        gym.setRecurringAmount(new BigDecimal("30000"));           // omitido este mes
        Project bed = project(ProjectType.COMPRA);
        bed.setName("Colchón");
        bed.setTargetAmount(new BigDecimal("250000"));
        bed.setTargetDate(LocalDate.of(2026, 9, 30));              // atrasada: cuenta en el mes actual
        Project car = project(ProjectType.AHORRO);
        car.setName("Auto");
        car.setTargetAmount(new BigDecimal("600000"));
        car.setTargetDate(LocalDate.of(2026, 12, 31));             // 3 meses: 200.000 por mes
        Project paused = arriendo();
        paused.setStatus(ProjectStatus.PAUSADO);

        ProjectSkippedMonth skip = new ProjectSkippedMonth();
        skip.setProject(gym);
        skip.setMonth("2026-10");
        context(List.of(rent, netflix, gym, bed, car, paused),
                List.of(movement(car, ProjectMovementKind.APORTE, "50000", LocalDate.of(2026, 10, 3))),
                List.of(skip));
        when(expenseRepository.existsByProjectAndDate(rent, LocalDate.of(2026, 10, 5))).thenReturn(true);
        when(expenseRepository.existsByProjectAndDate(netflix, LocalDate.of(2026, 10, 25))).thenReturn(false);

        ProjectCommitmentsResponse result = service.commitments(user, "2026-10");

        assertEquals(new BigDecimal("459990"), result.recurring());
        assertEquals(new BigDecimal("250000"), result.purchases());
        assertEquals(new BigDecimal("200000"), result.savingsSuggested());
        assertEquals(new BigDecimal("909990"), result.total());
        // Pendiente: Netflix 9.990 + colchón 250.000 + (200.000 − 50.000 ya aportados)
        assertEquals(new BigDecimal("409990"), result.pending());

        assertEquals(CommitmentState.REGISTRADO, state(result, "Arriendo"));
        assertEquals(CommitmentState.PENDIENTE, state(result, "Netflix"));
        assertEquals(CommitmentState.OMITIDO, state(result, "Gimnasio"));
        assertEquals(CommitmentState.PENDIENTE, state(result, "Auto"));
        assertEquals(5, result.items().size(), "los pausados no cuentan");
        assertEquals("Colchón", result.items().get(0).name(), "ordenados por fecha");
        assertEquals("Auto", result.items().get(4).name(), "los ahorros (sin fecha) al final");
    }

    private CommitmentState state(ProjectCommitmentsResponse result, String name) {
        return result.items().stream().filter(i -> i.name().equals(name)).map(ProjectCommitmentItem::state)
                .findFirst().orElseThrow();
    }

    @Test
    void projectionSpreadsRecurringPurchasesAndSavings() {
        Project rent = arriendo();
        Project bed = project(ProjectType.COMPRA);
        bed.setTargetAmount(new BigDecimal("250000"));
        bed.setTargetDate(LocalDate.of(2026, 12, 1));
        Project car = project(ProjectType.AHORRO);
        car.setTargetAmount(new BigDecimal("300000"));
        car.setTargetDate(LocalDate.of(2026, 11, 30));            // oct + nov = 150.000 por mes
        context(List.of(rent, bed, car), List.of(), List.of());

        List<ProjectProjectionMonth> months = service.projection(user, "2026-10", 3);

        assertEquals(List.of("2026-10", "2026-11", "2026-12"), months.stream().map(ProjectProjectionMonth::month).toList());
        assertEquals(new BigDecimal("600000"), months.get(0).total());       // 450.000 + 150.000
        assertEquals(new BigDecimal("600000"), months.get(1).total());
        assertEquals(new BigDecimal("700000"), months.get(2).total());       // 450.000 + 250.000
        assertEquals(BigDecimal.ZERO, months.get(2).savingsSuggested());
    }

    @Test
    void projectionValidatesTheRange() {
        assertThrows(ResponseStatusException.class, () -> service.projection(user, null, 0));
        assertThrows(ResponseStatusException.class, () -> service.projection(user, null, 25));
    }

    @Test
    void savingsSummaryAddsAllGoalsAndTheMonthNet() {
        Project car = project(ProjectType.AHORRO);
        car.setTargetAmount(new BigDecimal("5000000"));
        Project house = project(ProjectType.AHORRO);
        house.setTargetAmount(new BigDecimal("20000000"));
        context(List.of(car, house), List.of(
                movement(car, ProjectMovementKind.APORTE, "100000", LocalDate.of(2026, 9, 1)),
                movement(car, ProjectMovementKind.APORTE, "50000", LocalDate.of(2026, 10, 1)),
                movement(house, ProjectMovementKind.APORTE, "200000", LocalDate.of(2026, 10, 2)),
                movement(house, ProjectMovementKind.RETIRO, "30000", LocalDate.of(2026, 10, 10))), List.of());

        SavingsSummaryResponse summary = service.savingsSummary(user, "2026-10");

        assertEquals(new BigDecimal("320000"), summary.totalSaved());
        assertEquals(new BigDecimal("250000"), summary.monthContributions());
        assertEquals(new BigDecimal("30000"), summary.monthWithdrawals());
        assertEquals(new BigDecimal("220000"), summary.monthNet());
        assertEquals(2, summary.goals().size());
    }
}

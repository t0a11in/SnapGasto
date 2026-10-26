package cl.snapgasto.backend.service;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.CommitmentState;
import cl.snapgasto.backend.dto.ExpenseResponse;
import cl.snapgasto.backend.dto.ProjectCommitmentItem;
import cl.snapgasto.backend.dto.ProjectCommitmentsResponse;
import cl.snapgasto.backend.dto.ProjectCompleteRequest;
import cl.snapgasto.backend.dto.ProjectMovementRequest;
import cl.snapgasto.backend.dto.ProjectMovementResponse;
import cl.snapgasto.backend.dto.ProjectProjectionMonth;
import cl.snapgasto.backend.dto.ProjectRequest;
import cl.snapgasto.backend.dto.ProjectResponse;
import cl.snapgasto.backend.dto.SavingsGoalSummary;
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

/**
 * Casos de uso de proyectos (gastos futuros) del usuario autenticado:
 * CRUD, aportes/retiros de ahorro, concretar compras, omitir meses de un
 * recurrente, compromisos del mes, proyección y resumen de ahorro.
 */
@Service
public class ProjectService {

    static final int MAX_PROJECTION_MONTHS = 24;
    private static final String DEFAULT_PAYMENT_METHOD = "OTRO";
    private static final Comparator<ProjectCommitmentItem> BY_DATE_THEN_NAME = Comparator
            .comparing(ProjectCommitmentItem::date, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(ProjectCommitmentItem::name, String.CASE_INSENSITIVE_ORDER);

    private final ProjectRepository projectRepository;
    private final ProjectMovementRepository movementRepository;
    private final ProjectSkippedMonthRepository skippedMonthRepository;
    private final ExpenseRepository expenseRepository;
    private final Clock clock;

    public ProjectService(
            ProjectRepository projectRepository,
            ProjectMovementRepository movementRepository,
            ProjectSkippedMonthRepository skippedMonthRepository,
            ExpenseRepository expenseRepository,
            Clock clock) {
        this.projectRepository = projectRepository;
        this.movementRepository = movementRepository;
        this.skippedMonthRepository = skippedMonthRepository;
        this.expenseRepository = expenseRepository;
        this.clock = clock;
    }

    // ------------------------------------------------------------------ CRUD

    @Transactional(readOnly = true)
    public List<ProjectResponse> listFor(AppUser user, ProjectType type, ProjectStatus status) {
        Context ctx = contextFor(user);
        return ctx.projects.stream()
                .filter(p -> type == null || p.getType() == type)
                .filter(p -> status == null || p.getStatus() == status)
                .map(p -> toResponse(p, ctx))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse get(UUID projectId, AppUser user) {
        return toResponse(requireOwned(projectId, user));
    }

    @Transactional
    public ProjectResponse create(ProjectRequest request, AppUser user) {
        Project project = new Project();
        project.setUser(user);
        project.setType(request.type());
        apply(request, project);
        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse update(UUID projectId, ProjectRequest request, AppUser user) {
        return toResponse(updateProject(requireOwned(projectId, user), request));
    }

    @Transactional
    public void delete(UUID projectId, AppUser user) {
        deleteProject(requireOwned(projectId, user));
    }

    /** Mantenedor administrativo: edita cualquier proyecto con las mismas reglas que el dueño. */
    public Project updateAsAdmin(Project project, ProjectRequest request) {
        return updateProject(project, request);
    }

    /** Mantenedor administrativo: elimina cualquier proyecto. */
    public void deleteAsAdmin(Project project) {
        deleteProject(project);
    }

    /** Respuesta con los valores calculados (también para el mantenedor administrativo). */
    public ProjectResponse describe(Project project) {
        return toResponse(project);
    }

    private Project updateProject(Project project, ProjectRequest request) {
        if (request.type() != project.getType()) {
            throw badRequest("No se puede cambiar el tipo de un proyecto. Crea uno nuevo.");
        }
        apply(request, project);
        return projectRepository.save(project);
    }

    /** Elimina el proyecto conservando los gastos ya registrados (quedan sin proyecto). */
    private void deleteProject(Project project) {
        expenseRepository.detachProject(project);
        movementRepository.deleteAllByProject(project);
        skippedMonthRepository.deleteAllByProject(project);
        projectRepository.delete(project);
    }

    // ---------------------------------------------------- Ahorro: movimientos

    @Transactional(readOnly = true)
    public List<ProjectMovementResponse> listMovements(UUID projectId, AppUser user) {
        Project project = requireOwned(projectId, user);
        return movementRepository.findAllByProjectOrderByDateDescCreatedAtDesc(project).stream()
                .map(ProjectMovementResponse::from)
                .toList();
    }

    @Transactional
    public ProjectMovementResponse addMovement(UUID projectId, ProjectMovementRequest request, AppUser user) {
        Project project = requireOwned(projectId, user);
        if (project.getType() != ProjectType.AHORRO) {
            throw badRequest("Solo las metas de ahorro admiten aportes y retiros.");
        }
        if (project.getStatus() == ProjectStatus.CANCELADO && request.kind() == ProjectMovementKind.APORTE) {
            throw badRequest("No puedes aportar a una meta cancelada.");
        }
        BigDecimal saved = savedAmount(movementRepository.findAllByProjectOrderByDateDescCreatedAtDesc(project));
        if (request.kind() == ProjectMovementKind.RETIRO && request.amount().compareTo(saved) > 0) {
            throw badRequest("No puedes retirar más de lo ahorrado (" + Money.format(saved) + ").");
        }

        ProjectMovement movement = new ProjectMovement();
        movement.setProject(project);
        movement.setKind(request.kind());
        movement.setAmount(request.amount());
        movement.setDate(request.date());
        movement.setNote(normalizeOptional(request.note()));
        ProjectMovement persisted = movementRepository.save(movement);

        if (project.getStatus() == ProjectStatus.PLANIFICADO && request.kind() == ProjectMovementKind.APORTE) {
            project.setStatus(ProjectStatus.EN_CURSO);
        }
        return ProjectMovementResponse.from(persisted);
    }

    @Transactional
    public void deleteMovement(UUID projectId, UUID movementId, AppUser user) {
        Project project = requireOwned(projectId, user);
        List<ProjectMovement> movements = movementRepository.findAllByProjectOrderByDateDescCreatedAtDesc(project);
        ProjectMovement movement = movements.stream()
                .filter(m -> m.getId().equals(movementId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movimiento no encontrado."));
        BigDecimal after = savedAmount(movements).subtract(movement.signedAmount());
        if (after.signum() < 0) {
            throw badRequest("No puedes eliminar este aporte: el ahorro quedaría negativo. Elimina antes los retiros.");
        }
        movementRepository.delete(movement);
    }

    // --------------------------------------------------- Compra: concretar

    /** "Lo compré": registra el gasto real y deja la compra como COMPLETADO. */
    @Transactional
    public ExpenseResponse complete(UUID projectId, ProjectCompleteRequest request, AppUser user) {
        Project project = requireOwned(projectId, user);
        if (project.getType() != ProjectType.COMPRA) {
            throw badRequest("Solo las compras planificadas se pueden concretar.");
        }
        if (project.getStatus() == ProjectStatus.COMPLETADO || project.getStatus() == ProjectStatus.CANCELADO) {
            throw badRequest("Esta compra ya está cerrada.");
        }
        Expense expense = new Expense();
        expense.setAmount(request.amount());
        expense.setCategory(Optional.ofNullable(normalizeOptional(request.category())).orElse(project.getCategory()));
        expense.setDate(request.date());
        expense.setDescription(Optional.ofNullable(normalizeOptional(request.description())).orElse(project.getName()));
        expense.setPaymentMethod(request.paymentMethod().trim());
        expense.setUser(user);
        expense.setProject(project);
        expense.setGenerated(false);
        Expense saved = expenseRepository.save(expense);

        project.setStatus(ProjectStatus.COMPLETADO);
        project.setExpenseId(saved.getId());
        return ExpenseResponse.from(saved);
    }

    // ------------------------------------------------ Recurrente: omitir mes

    @Transactional
    public void skipMonth(UUID projectId, String month, AppUser user) {
        Project project = requireRecurring(projectId, user);
        YearMonth ym = parseMonth(month);
        if (skippedMonthRepository.findByProjectAndMonth(project, ym.toString()).isEmpty()) {
            ProjectSkippedMonth skipped = new ProjectSkippedMonth();
            skipped.setProject(project);
            skipped.setMonth(ym.toString());
            skippedMonthRepository.save(skipped);
        }
    }

    @Transactional
    public void unskipMonth(UUID projectId, String month, AppUser user) {
        Project project = requireRecurring(projectId, user);
        skippedMonthRepository.findByProjectAndMonth(project, parseMonth(month).toString())
                .ifPresent(skippedMonthRepository::delete);
    }

    /** Gastos registrados a partir del proyecto (recurrentes generados o compra concretada). */
    @Transactional(readOnly = true)
    public List<ExpenseResponse> listExpenses(UUID projectId, AppUser user) {
        Project project = requireOwned(projectId, user);
        return expenseRepository.findAllByProjectOrderByDateDescCreatedAtDesc(project).stream()
                .map(ExpenseResponse::from)
                .toList();
    }

    // ------------------------------------------------ Compromisos del mes

    @Transactional(readOnly = true)
    public ProjectCommitmentsResponse commitments(AppUser user, String requestedMonth) {
        YearMonth current = YearMonth.now(clock);
        YearMonth month = requestedMonth == null || requestedMonth.isBlank() ? current : parseMonth(requestedMonth);
        Context ctx = contextFor(user);

        List<ProjectCommitmentItem> items = new ArrayList<>();
        BigDecimal recurring = BigDecimal.ZERO;
        BigDecimal purchases = BigDecimal.ZERO;
        BigDecimal savings = BigDecimal.ZERO;
        BigDecimal pending = BigDecimal.ZERO;

        for (Project p : ctx.projects) {
            if (!p.getStatus().isActive()) {
                continue;
            }
            if (p.getType() == ProjectType.RECURRENTE) {
                Optional<LocalDate> occurrence = ProjectCalculator.occurrenceIn(p, month);
                if (occurrence.isEmpty()) {
                    continue;
                }
                BigDecimal amount = p.getRecurringAmount();
                if (ctx.skipped(p).contains(month.toString())) {
                    items.add(item(p, occurrence.get(), amount, BigDecimal.ZERO, CommitmentState.OMITIDO));
                    continue;
                }
                recurring = recurring.add(amount);
                if (expenseRepository.existsByProjectAndDate(p, occurrence.get())) {
                    items.add(item(p, occurrence.get(), amount, amount, CommitmentState.REGISTRADO));
                } else {
                    pending = pending.add(amount);
                    items.add(item(p, occurrence.get(), amount, BigDecimal.ZERO, CommitmentState.PENDIENTE));
                }
            } else if (p.getType() == ProjectType.COMPRA) {
                if (!purchaseFallsIn(p, month, current)) {
                    continue;
                }
                BigDecimal amount = purchaseAmount(p);
                purchases = purchases.add(amount);
                pending = pending.add(amount);
                items.add(item(p, p.getTargetDate(), amount, BigDecimal.ZERO, CommitmentState.PENDIENTE));
            } else {
                BigDecimal suggested = suggestedSavingFor(p, month, current, ctx);
                if (suggested == null || suggested.signum() <= 0) {
                    continue;
                }
                BigDecimal done = ctx.netInMonth(p, month).max(BigDecimal.ZERO);
                BigDecimal missing = suggested.subtract(done).max(BigDecimal.ZERO);
                savings = savings.add(suggested);
                pending = pending.add(missing);
                items.add(item(p, null, suggested, done,
                        missing.signum() == 0 ? CommitmentState.REGISTRADO : CommitmentState.PENDIENTE));
            }
        }
        items.sort(BY_DATE_THEN_NAME);
        return new ProjectCommitmentsResponse(month.toString(), recurring, purchases, savings,
                recurring.add(purchases).add(savings), pending, items);
    }

    // ------------------------------------------------ Proyección

    @Transactional(readOnly = true)
    public List<ProjectProjectionMonth> projection(AppUser user, String from, Integer months) {
        int count = months == null ? 12 : months;
        if (count < 1 || count > MAX_PROJECTION_MONTHS) {
            throw badRequest("La proyección admite entre 1 y " + MAX_PROJECTION_MONTHS + " meses.");
        }
        YearMonth current = YearMonth.now(clock);
        YearMonth start = from == null || from.isBlank() ? current : parseMonth(from);
        Context ctx = contextFor(user);

        List<ProjectProjectionMonth> result = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            YearMonth month = start.plusMonths(i);
            BigDecimal recurring = BigDecimal.ZERO;
            BigDecimal purchases = BigDecimal.ZERO;
            BigDecimal savings = BigDecimal.ZERO;
            for (Project p : ctx.projects) {
                if (!p.getStatus().isActive()) {
                    continue;
                }
                if (p.getType() == ProjectType.RECURRENTE) {
                    if (!ctx.skipped(p).contains(month.toString())
                            && ProjectCalculator.occurrenceIn(p, month).isPresent()) {
                        recurring = recurring.add(p.getRecurringAmount());
                    }
                } else if (p.getType() == ProjectType.COMPRA) {
                    if (purchaseFallsIn(p, month, current)) {
                        purchases = purchases.add(purchaseAmount(p));
                    }
                } else {
                    BigDecimal suggested = suggestedSavingFor(p, month, current, ctx);
                    if (suggested != null) {
                        savings = savings.add(suggested);
                    }
                }
            }
            result.add(new ProjectProjectionMonth(month.toString(), recurring, purchases, savings,
                    recurring.add(purchases).add(savings)));
        }
        return result;
    }

    // ------------------------------------------------ Resumen de ahorro

    @Transactional(readOnly = true)
    public SavingsSummaryResponse savingsSummary(AppUser user, String requestedMonth) {
        YearMonth month = requestedMonth == null || requestedMonth.isBlank()
                ? YearMonth.now(clock)
                : parseMonth(requestedMonth);
        Context ctx = contextFor(user);
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal contributions = BigDecimal.ZERO;
        BigDecimal withdrawals = BigDecimal.ZERO;
        List<SavingsGoalSummary> goals = new ArrayList<>();

        for (Project p : ctx.projects) {
            if (p.getType() != ProjectType.AHORRO) {
                continue;
            }
            BigDecimal saved = ctx.saved(p);
            total = total.add(saved);
            for (ProjectMovement m : ctx.movements(p)) {
                if (YearMonth.from(m.getDate()).equals(month)) {
                    if (m.getKind() == ProjectMovementKind.APORTE) {
                        contributions = contributions.add(m.getAmount());
                    } else {
                        withdrawals = withdrawals.add(m.getAmount());
                    }
                }
            }
            ProjectResponse response = toResponse(p, ctx);
            goals.add(new SavingsGoalSummary(p.getId(), p.getName(), p.getStatus(), saved, p.getTargetAmount(),
                    response.progressRatio(), p.getTargetDate(), response.monthlySuggested()));
        }
        return new SavingsSummaryResponse(month.toString(), total, contributions, withdrawals,
                contributions.subtract(withdrawals), goals);
    }

    // ------------------------------------------------ Mapeo y reglas

    private ProjectResponse toResponse(Project project) {
        boolean persisted = project.getId() != null;
        Context ctx = new Context(
                List.of(project),
                persisted ? movementRepository.findAllByProjectOrderByDateDescCreatedAtDesc(project) : List.of(),
                persisted ? skippedMonthRepository.findAllByProject(project) : List.of());
        return toResponse(project, ctx);
    }

    private ProjectResponse toResponse(Project p, Context ctx) {
        YearMonth current = YearMonth.now(clock);
        LocalDate today = LocalDate.now(clock);
        BigDecimal saved = null;
        BigDecimal remaining = null;
        BigDecimal progress = null;
        Integer monthsLeft = null;
        BigDecimal suggested = null;
        LocalDate next = null;

        if (p.getType() == ProjectType.AHORRO) {
            saved = ctx.saved(p);
            remaining = ProjectCalculator.remaining(p.getTargetAmount(), saved);
            progress = ProjectCalculator.ratio(saved, p.getTargetAmount());
            monthsLeft = ProjectCalculator.monthsLeft(p.getTargetDate(), current);
            suggested = p.getStatus().isActive() ? suggestedSavingFor(p, current, current, ctx) : null;
        } else if (p.getType() == ProjectType.COMPRA) {
            boolean done = p.getStatus() == ProjectStatus.COMPLETADO;
            remaining = done ? BigDecimal.ZERO : purchaseAmount(p);
            progress = (done ? BigDecimal.ONE : BigDecimal.ZERO).setScale(4);
            monthsLeft = ProjectCalculator.monthsLeft(p.getTargetDate(), current);
        } else if (p.getStatus().isActive()) {
            next = ProjectCalculator.nextOccurrence(p, today, ctx.skipped(p)).orElse(null);
        }

        return new ProjectResponse(
                p.getId(), p.getName(), p.getType(), p.getCategory(), p.getPriority(), p.getStatus(), p.getNotes(),
                p.getTargetAmount(), p.getTargetDate(),
                p.getReferencePrice(), p.getReferenceSource(), p.getReferenceUrl(), p.getReferenceAt(),
                p.getRecurringAmount(), p.getFrequency(), p.getDayOfMonth(), p.getStartDate(), p.getEndDate(),
                p.getPaymentMethod(), p.getNotifyDaysBefore(), p.getExpenseId(), p.getCreatedAt(),
                saved, remaining, progress, monthsLeft, suggested, ProjectCalculator.monthlyEquivalent(p), next);
    }

    /**
     * Aporte sugerido para un mes. En el mes actual se calcula con lo que faltaba
     * al inicio del mes: los aportes del mes no reducen la meta mensual a mitad de camino.
     */
    private BigDecimal suggestedSavingFor(Project p, YearMonth month, YearMonth current, Context ctx) {
        if (p.getTargetAmount() == null || p.getTargetDate() == null || month.isBefore(current)) {
            return null;
        }
        if (month.isAfter(YearMonth.from(p.getTargetDate())) && !month.equals(current)) {
            return null;
        }
        BigDecimal savedAtMonthStart = ctx.saved(p).subtract(ctx.netInMonth(p, current));
        BigDecimal remaining = ProjectCalculator.remaining(p.getTargetAmount(), savedAtMonthStart);
        return ProjectCalculator.monthlySuggested(remaining, ProjectCalculator.monthsLeft(p.getTargetDate(), current));
    }

    /** Una compra cuenta en el mes de su fecha objetivo; si está atrasada, en el mes actual. */
    private static boolean purchaseFallsIn(Project p, YearMonth month, YearMonth current) {
        if (p.getTargetDate() == null) {
            return false;
        }
        YearMonth target = YearMonth.from(p.getTargetDate());
        return target.equals(month) || (month.equals(current) && target.isBefore(current));
    }

    private static BigDecimal purchaseAmount(Project p) {
        if (p.getTargetAmount() != null) {
            return p.getTargetAmount();
        }
        return p.getReferencePrice() == null ? BigDecimal.ZERO : p.getReferencePrice();
    }

    private static ProjectCommitmentItem item(Project p, LocalDate date, BigDecimal amount, BigDecimal done,
            CommitmentState state) {
        return new ProjectCommitmentItem(p.getId(), p.getName(), p.getType(), p.getCategory(), date, amount, done,
                state);
    }

    /** Aplica y normaliza los campos según el tipo; limpia los que no le corresponden. */
    private void apply(ProjectRequest request, Project project) {
        project.setName(request.name().trim());
        project.setCategory(request.category().trim());
        project.setPriority(request.priority() == null ? ProjectPriority.MEDIA : request.priority());
        if (request.status() != null) {
            project.setStatus(request.status());
        }
        project.setNotes(normalizeOptional(request.notes()));
        project.setNotifyDaysBefore(request.notifyDaysBefore() == null ? 3 : request.notifyDaysBefore());

        if (project.getType() == ProjectType.COMPRA) {
            if (request.targetAmount() == null && request.referencePrice() == null) {
                throw badRequest("Indica el monto estimado de la compra.");
            }
            if (!Objects.equals(project.getTargetDate(), request.targetDate())) {
                // Nueva fecha objetivo: el recordatorio vuelve a enviarse.
                project.setLastNotifiedOn(null);
            }
            project.setTargetAmount(request.targetAmount());
            project.setTargetDate(request.targetDate());
            applyReference(request, project);
            clearRecurring(project);
        } else if (project.getType() == ProjectType.AHORRO) {
            if (request.targetAmount() == null) {
                throw badRequest("Indica la meta de ahorro.");
            }
            project.setTargetAmount(request.targetAmount());
            project.setTargetDate(request.targetDate());
            clearReference(project);
            clearRecurring(project);
        } else {
            if (request.recurringAmount() == null) {
                throw badRequest("Indica el monto del gasto recurrente.");
            }
            if (request.dayOfMonth() == null) {
                throw badRequest("Indica el día del mes en que se registra el gasto.");
            }
            LocalDate start = request.startDate() == null ? LocalDate.now(clock) : request.startDate();
            if (request.endDate() != null && request.endDate().isBefore(start)) {
                throw badRequest("La fecha de término no puede ser anterior a la de inicio.");
            }
            RecurrenceFrequency frequency = request.frequency() == null ? RecurrenceFrequency.MENSUAL : request.frequency();
            boolean scheduleChanged = !Objects.equals(project.getDayOfMonth(), request.dayOfMonth())
                    || !Objects.equals(project.getStartDate(), start)
                    || project.getFrequency() != frequency;
            project.setRecurringAmount(request.recurringAmount());
            project.setFrequency(frequency);
            project.setDayOfMonth(request.dayOfMonth());
            project.setStartDate(start);
            project.setEndDate(request.endDate());
            project.setPaymentMethod(Optional.ofNullable(normalizeOptional(request.paymentMethod()))
                    .orElse(DEFAULT_PAYMENT_METHOD));
            if (scheduleChanged) {
                // Un cambio de calendario puede mover la próxima fecha: el aviso debe volver a enviarse.
                project.setLastNotifiedOn(null);
            }
            project.setTargetAmount(null);
            project.setTargetDate(null);
            clearReference(project);
        }
    }

    private void applyReference(ProjectRequest request, Project project) {
        boolean priceChanged = !sameAmount(project.getReferencePrice(), request.referencePrice());
        project.setReferencePrice(request.referencePrice());
        project.setReferenceSource(normalizeOptional(request.referenceSource()));
        project.setReferenceUrl(normalizeOptional(request.referenceUrl()));
        if (request.referencePrice() == null) {
            project.setReferenceAt(null);
        } else if (priceChanged || project.getReferenceAt() == null) {
            project.setReferenceAt(LocalDateTime.now(clock));
        }
    }

    private static boolean sameAmount(BigDecimal a, BigDecimal b) {
        return a == null ? b == null : b != null && a.compareTo(b) == 0;
    }

    private static void clearReference(Project p) {
        p.setReferencePrice(null);
        p.setReferenceSource(null);
        p.setReferenceUrl(null);
        p.setReferenceAt(null);
    }

    private static void clearRecurring(Project p) {
        p.setRecurringAmount(null);
        p.setFrequency(null);
        p.setDayOfMonth(null);
        p.setStartDate(null);
        p.setEndDate(null);
        p.setPaymentMethod(null);
        p.setLastGeneratedOn(null);
    }

    private Project requireOwned(UUID projectId, AppUser user) {
        return projectRepository.findByIdAndUser(projectId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado."));
    }

    private Project requireRecurring(UUID projectId, AppUser user) {
        Project project = requireOwned(projectId, user);
        if (project.getType() != ProjectType.RECURRENTE) {
            throw badRequest("Solo los gastos recurrentes se pueden omitir por mes.");
        }
        return project;
    }

    static YearMonth parseMonth(String month) {
        if (month == null) {
            throw badRequest("El mes debe tener formato AAAA-MM.");
        }
        try {
            return YearMonth.parse(month.trim());
        } catch (DateTimeParseException exception) {
            throw badRequest("El mes debe tener formato AAAA-MM.");
        }
    }

    static BigDecimal savedAmount(List<ProjectMovement> movements) {
        return movements.stream().map(ProjectMovement::signedAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private Context contextFor(AppUser user) {
        return new Context(
                projectRepository.findAllByUserOrderByCreatedAtDesc(user),
                movementRepository.findAllByOwner(user),
                skippedMonthRepository.findAllByOwner(user));
    }

    /** Datos de un usuario cargados una sola vez y agrupados por proyecto. */
    static final class Context {
        final List<Project> projects;
        private final Map<UUID, List<ProjectMovement>> movementsByProject = new HashMap<>();
        private final Map<UUID, Set<String>> skippedByProject = new HashMap<>();

        Context(List<Project> projects, List<ProjectMovement> movements, List<ProjectSkippedMonth> skipped) {
            this.projects = projects;
            for (ProjectMovement m : movements) {
                movementsByProject.computeIfAbsent(m.getProject().getId(), k -> new ArrayList<>()).add(m);
            }
            for (ProjectSkippedMonth s : skipped) {
                skippedByProject.computeIfAbsent(s.getProject().getId(), k -> new HashSet<>()).add(s.getMonth());
            }
        }

        List<ProjectMovement> movements(Project p) {
            return movementsByProject.getOrDefault(p.getId(), List.of());
        }

        Set<String> skipped(Project p) {
            return skippedByProject.getOrDefault(p.getId(), Collections.emptySet());
        }

        BigDecimal saved(Project p) {
            return savedAmount(movements(p));
        }

        BigDecimal netInMonth(Project p, YearMonth month) {
            return movements(p).stream()
                    .filter(m -> YearMonth.from(m.getDate()).equals(month))
                    .map(ProjectMovement::signedAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
    }
}

package cl.snapgasto.backend.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionOperations;
import org.springframework.transaction.support.TransactionTemplate;

import cl.snapgasto.backend.entity.AppNotification;
import cl.snapgasto.backend.entity.Expense;
import cl.snapgasto.backend.entity.Project;
import cl.snapgasto.backend.entity.ProjectSkippedMonth;
import cl.snapgasto.backend.entity.ProjectStatus;
import cl.snapgasto.backend.entity.ProjectType;
import cl.snapgasto.backend.repository.ExpenseRepository;
import cl.snapgasto.backend.repository.NotificationRepository;
import cl.snapgasto.backend.repository.ProjectRepository;
import cl.snapgasto.backend.repository.ProjectSkippedMonthRepository;

/**
 * Tarea diaria de proyectos:
 * <ul>
 * <li>RECURRENTE: registra el gasto en su fecha (también las ocurrencias atrasadas si
 * la API estuvo detenida) y avisa {@code notifyDaysBefore} días antes.</li>
 * <li>COMPRA: avisa cuando se acerca o llega la fecha objetivo.</li>
 * </ul>
 * Cada proyecto se procesa en su propia transacción: un error no detiene al resto.
 * Nunca se generan gastos anteriores a la creación del proyecto ni duplicados.
 */
@Service
public class RecurringProjectService {

    private static final Logger log = LoggerFactory.getLogger(RecurringProjectService.class);
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    private static final String DEFAULT_PAYMENT_METHOD = "OTRO";

    private final ProjectRepository projectRepository;
    private final ProjectSkippedMonthRepository skippedMonthRepository;
    private final ExpenseRepository expenseRepository;
    private final NotificationRepository notificationRepository;
    private final TransactionOperations transactions;
    private final Clock clock;

    @Autowired
    public RecurringProjectService(
            ProjectRepository projectRepository,
            ProjectSkippedMonthRepository skippedMonthRepository,
            ExpenseRepository expenseRepository,
            NotificationRepository notificationRepository,
            PlatformTransactionManager transactionManager,
            Clock clock) {
        this(projectRepository, skippedMonthRepository, expenseRepository, notificationRepository,
                new TransactionTemplate(transactionManager), clock);
    }

    RecurringProjectService(
            ProjectRepository projectRepository,
            ProjectSkippedMonthRepository skippedMonthRepository,
            ExpenseRepository expenseRepository,
            NotificationRepository notificationRepository,
            TransactionOperations transactions,
            Clock clock) {
        this.projectRepository = projectRepository;
        this.skippedMonthRepository = skippedMonthRepository;
        this.expenseRepository = expenseRepository;
        this.notificationRepository = notificationRepository;
        this.transactions = transactions;
        this.clock = clock;
    }

    @Scheduled(cron = "${app.projects.daily-cron:0 0 6 * * *}", zone = "${app.time-zone:America/Santiago}")
    public void runDaily() {
        processAll(LocalDate.now(clock));
    }

    /** Procesa todos los proyectos activos para el día indicado. Devuelve los gastos generados. */
    public int processAll(LocalDate today) {
        List<UUID> ids = projectRepository.findAllByTypeInAndStatusIn(
                EnumSet.of(ProjectType.RECURRENTE, ProjectType.COMPRA),
                EnumSet.of(ProjectStatus.PLANIFICADO, ProjectStatus.EN_CURSO)).stream()
                .map(Project::getId)
                .toList();
        int generated = 0;
        for (UUID id : ids) {
            try {
                Integer count = transactions.execute(status -> projectRepository.findById(id)
                        .map(project -> process(project, today))
                        .orElse(0));
                generated += count == null ? 0 : count;
            } catch (RuntimeException exception) {
                log.error("No se pudo procesar el proyecto {}", id, exception);
            }
        }
        if (generated > 0) {
            log.info("Se registraron {} gastos recurrentes.", generated);
        }
        return generated;
    }

    /** Procesa un proyecto ya cargado (dentro de una transacción). Devuelve los gastos generados. */
    int process(Project project, LocalDate today) {
        if (!project.getStatus().isActive()) {
            return 0;
        }
        if (project.getType() == ProjectType.RECURRENTE) {
            return processRecurring(project, today);
        }
        if (project.getType() == ProjectType.COMPRA) {
            notifyPurchase(project, today);
        }
        return 0;
    }

    private int processRecurring(Project project, LocalDate today) {
        Set<String> skipped = new HashSet<>();
        for (ProjectSkippedMonth s : skippedMonthRepository.findAllByProject(project)) {
            skipped.add(s.getMonth());
        }

        // Nunca antes de que el proyecto existiera: crear "arriendo desde 2020" no rellena años de gastos.
        LocalDate createdOn = project.getCreatedAt() == null ? today : project.getCreatedAt().toLocalDate();
        LocalDate lowerBound = later(project.getStartDate(), createdOn);
        LocalDate lastGenerated = project.getLastGeneratedOn();
        YearMonth month = YearMonth.from(lastGenerated != null ? lastGenerated : lowerBound);
        YearMonth until = YearMonth.from(today);

        int generated = 0;
        for (; !month.isAfter(until); month = month.plusMonths(1)) {
            Optional<LocalDate> occurrence = ProjectCalculator.occurrenceIn(project, month);
            if (occurrence.isEmpty()) {
                continue;
            }
            LocalDate date = occurrence.get();
            boolean due = !date.isAfter(today) && !date.isBefore(lowerBound)
                    && (lastGenerated == null || date.isAfter(lastGenerated));
            if (!due) {
                continue;
            }
            if (!skipped.contains(month.toString()) && !expenseRepository.existsByProjectAndDate(project, date)) {
                createExpense(project, date);
                notify(project, "Gasto registrado: " + project.getName(),
                        "Se registró automáticamente " + project.getName() + " por "
                                + Money.format(project.getRecurringAmount()) + " con fecha " + DAY.format(date) + ".");
                generated++;
            }
            project.setLastGeneratedOn(date);
            lastGenerated = date;
        }

        Optional<LocalDate> next = ProjectCalculator.nextOccurrence(project, today.plusDays(1), skipped);
        if (next.isPresent()
                && !next.get().isAfter(today.plusDays(project.getNotifyDaysBefore()))
                && !next.get().equals(project.getLastNotifiedOn())) {
            notify(project, "Próximo gasto: " + project.getName(),
                    project.getName() + " (" + Money.format(project.getRecurringAmount()) + ") se registrará el "
                            + DAY.format(next.get()) + ".");
            project.setLastNotifiedOn(next.get());
        }
        return generated;
    }

    private void notifyPurchase(Project project, LocalDate today) {
        LocalDate target = project.getTargetDate();
        if (target == null || target.equals(project.getLastNotifiedOn())) {
            return;
        }
        if (!today.isBefore(target.minusDays(project.getNotifyDaysBefore()))) {
            String when = target.isAfter(today) ? "es el " + DAY.format(target) : "era el " + DAY.format(target);
            notify(project, "Compra planificada: " + project.getName(),
                    "La fecha objetivo de " + project.getName() + " " + when
                            + ". Cuando la compres, márcala como comprada.");
            project.setLastNotifiedOn(target);
        }
    }

    private void createExpense(Project project, LocalDate date) {
        Expense expense = new Expense();
        expense.setAmount(project.getRecurringAmount());
        expense.setCategory(project.getCategory());
        expense.setDate(date);
        expense.setDescription(project.getName());
        expense.setPaymentMethod(project.getPaymentMethod() == null ? DEFAULT_PAYMENT_METHOD : project.getPaymentMethod());
        expense.setUser(project.getUser());
        expense.setProject(project);
        expense.setGenerated(true);
        expenseRepository.save(expense);
    }

    private void notify(Project project, String title, String body) {
        AppNotification notification = new AppNotification();
        notification.setUser(project.getUser());
        notification.setTitle(truncate(title, 140));
        notification.setBody(truncate(body, 1000));
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    private static LocalDate later(LocalDate a, LocalDate b) {
        if (a == null) {
            return b;
        }
        return a.isAfter(b) ? a : b;
    }

    private static String truncate(String value, int max) {
        return value.length() <= max ? value : value.substring(0, max - 1) + "…";
    }
}

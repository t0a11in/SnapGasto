package cl.snapgasto.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Gasto futuro planificado por un usuario: una compra puntual, un gasto
 * recurrente que se registra solo cada período o una meta de ahorro.
 */
@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private AppUser user;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "project_type", nullable = false, length = 20)
    private ProjectType type;

    @Column(nullable = false, length = 80)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ProjectPriority priority = ProjectPriority.MEDIA;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectStatus status = ProjectStatus.PLANIFICADO;

    @Column(length = 500)
    private String notes;

    /** COMPRA y AHORRO: monto objetivo. */
    @Column(name = "target_amount", precision = 14, scale = 2)
    private BigDecimal targetAmount;

    /** COMPRA y AHORRO: fecha en que se espera comprar o completar la meta. */
    @Column(name = "target_date")
    private LocalDate targetDate;

    /** COMPRA: precio de referencia. En v1 se ingresa a mano; en v2 lo completará el scraping. */
    @Column(name = "reference_price", precision = 14, scale = 2)
    private BigDecimal referencePrice;

    @Column(name = "reference_source", length = 120)
    private String referenceSource;

    @Column(name = "reference_url", length = 500)
    private String referenceUrl;

    @Column(name = "reference_at")
    private LocalDateTime referenceAt;

    /** RECURRENTE: monto que se registra en cada ocurrencia. */
    @Column(name = "recurring_amount", precision = 14, scale = 2)
    private BigDecimal recurringAmount;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private RecurrenceFrequency frequency;

    /** RECURRENTE: día del mes (1..28) en que se registra el gasto. */
    @Column(name = "day_of_month")
    private Integer dayOfMonth;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "payment_method", length = 60)
    private String paymentMethod;

    /** Días de anticipación del aviso previo (recurrentes y compras). */
    @Column(name = "notify_days_before", nullable = false)
    private int notifyDaysBefore = 3;

    /** Última ocurrencia para la que ya se generó el gasto (evita duplicados). */
    @Column(name = "last_generated_on")
    private LocalDate lastGeneratedOn;

    /** Última fecha para la que ya se envió el aviso previo. */
    @Column(name = "last_notified_on")
    private LocalDate lastNotifiedOn;

    /** COMPRA concretada: gasto real que cerró el proyecto. */
    @Column(name = "expense_id")
    private UUID expenseId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void assignCreatedAt() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void assignUpdatedAt() {
        updatedAt = LocalDateTime.now();
    }
}

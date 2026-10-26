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
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Aporte o retiro de una meta de ahorro. No es un gasto: no figura en el listado de gastos. */
@Entity
@Table(name = "project_movements")
@Getter
@Setter
@NoArgsConstructor
public class ProjectMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_kind", nullable = false, length = 10)
    private ProjectMovementKind kind;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "movement_date", nullable = false)
    private LocalDate date;

    @Column(length = 200)
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void assignCreatedAt() {
        createdAt = LocalDateTime.now();
    }

    /** Aporte suma, retiro resta. */
    public BigDecimal signedAmount() {
        return kind == ProjectMovementKind.RETIRO ? amount.negate() : amount;
    }
}

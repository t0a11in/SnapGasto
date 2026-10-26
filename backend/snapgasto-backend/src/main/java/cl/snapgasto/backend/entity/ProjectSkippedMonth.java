package cl.snapgasto.backend.entity;

import java.util.UUID;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Mes (AAAA-MM) en que un gasto recurrente no debe registrarse. */
@Entity
@Table(name = "project_skipped_months",
        uniqueConstraints = @UniqueConstraint(name = "uq_project_skipped_months", columnNames = { "project_id", "skipped_month" }))
@Getter
@Setter
@NoArgsConstructor
public class ProjectSkippedMonth {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Project project;

    @Column(name = "skipped_month", nullable = false, length = 7)
    private String month;
}

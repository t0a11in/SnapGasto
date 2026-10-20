package cl.snapgasto.backend.entity;

import java.time.LocalDateTime;
import java.util.UUID;

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
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Vincula una cuenta a un grupo y define sus permisos dentro de él. */
@Entity
@Table(
        name = "expense_group_members",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_expense_group_members_group_user",
                columnNames = { "group_id", "user_id" }))
@Getter
@Setter
@NoArgsConstructor
public class GroupMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private ExpenseGroup expenseGroup;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GroupMemberRole role;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    public GroupMembership(ExpenseGroup expenseGroup, AppUser user, GroupMemberRole role) {
        this.expenseGroup = expenseGroup;
        this.user = user;
        this.role = role;
    }

    @PrePersist
    void assignJoinedAt() {
        joinedAt = LocalDateTime.now();
    }
}

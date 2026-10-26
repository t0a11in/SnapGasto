package cl.snapgasto.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Project;
import cl.snapgasto.backend.entity.ProjectMovement;

/** Aportes y retiros de las metas de ahorro. */
public interface ProjectMovementRepository extends JpaRepository<ProjectMovement, UUID> {

    List<ProjectMovement> findAllByProjectOrderByDateDescCreatedAtDesc(Project project);

    @Query("select m from ProjectMovement m where m.project.user = :user")
    List<ProjectMovement> findAllByOwner(@Param("user") AppUser user);

    @Modifying
    @Query("delete from ProjectMovement m where m.project = :project")
    void deleteAllByProject(@Param("project") Project project);
}

package cl.snapgasto.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Project;
import cl.snapgasto.backend.entity.ProjectSkippedMonth;

/** Meses omitidos de los gastos recurrentes. */
public interface ProjectSkippedMonthRepository extends JpaRepository<ProjectSkippedMonth, UUID> {

    List<ProjectSkippedMonth> findAllByProject(Project project);

    Optional<ProjectSkippedMonth> findByProjectAndMonth(Project project, String month);

    @Query("select s from ProjectSkippedMonth s where s.project.user = :user")
    List<ProjectSkippedMonth> findAllByOwner(@Param("user") AppUser user);

    @Modifying
    @Query("delete from ProjectSkippedMonth s where s.project = :project")
    void deleteAllByProject(@Param("project") Project project);
}

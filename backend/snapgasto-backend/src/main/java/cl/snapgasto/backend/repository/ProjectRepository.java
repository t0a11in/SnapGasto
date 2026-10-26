package cl.snapgasto.backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Project;
import cl.snapgasto.backend.entity.ProjectStatus;
import cl.snapgasto.backend.entity.ProjectType;

/** Consultas de proyectos acotadas a su dueño, salvo las administrativas y las de la tarea diaria. */
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findAllByUserOrderByCreatedAtDesc(AppUser user);

    Optional<Project> findByIdAndUser(UUID id, AppUser user);

    /** Proyectos que procesa la tarea diaria. */
    @EntityGraph(attributePaths = "user")
    List<Project> findAllByTypeInAndStatusIn(Collection<ProjectType> types, Collection<ProjectStatus> statuses);

    @EntityGraph(attributePaths = "user")
    List<Project> findAllByOrderByCreatedAtDesc();
}

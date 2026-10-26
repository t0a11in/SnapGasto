package cl.snapgasto.backend.admin;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.AdminProjectResponse;
import cl.snapgasto.backend.dto.ProjectRequest;
import cl.snapgasto.backend.entity.Project;
import cl.snapgasto.backend.repository.ProjectRepository;
import cl.snapgasto.backend.service.ProjectService;

/** Mantenedor administrativo de proyectos de todos los usuarios (lectura, edición y baja). */
@Service
public class AdminProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectService projectService;

    public AdminProjectService(ProjectRepository projectRepository, ProjectService projectService) {
        this.projectRepository = projectRepository;
        this.projectService = projectService;
    }

    @Transactional(readOnly = true)
    public List<AdminProjectResponse> list() {
        return projectRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AdminProjectResponse get(UUID projectId) {
        return toResponse(getProject(projectId));
    }

    @Transactional
    public AdminProjectResponse update(UUID projectId, ProjectRequest request) {
        return toResponse(projectService.updateAsAdmin(getProject(projectId), request));
    }

    @Transactional
    public void delete(UUID projectId) {
        projectService.deleteAsAdmin(getProject(projectId));
    }

    private AdminProjectResponse toResponse(Project project) {
        return new AdminProjectResponse(
                project.getUser().getId(),
                project.getUser().getFullName(),
                project.getUser().getEmail(),
                projectService.describe(project));
    }

    private Project getProject(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado."));
    }
}

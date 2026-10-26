package cl.snapgasto.backend.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import cl.snapgasto.backend.dto.ExpenseResponse;
import cl.snapgasto.backend.dto.ProjectCommitmentsResponse;
import cl.snapgasto.backend.dto.ProjectCompleteRequest;
import cl.snapgasto.backend.dto.ProjectMovementRequest;
import cl.snapgasto.backend.dto.ProjectMovementResponse;
import cl.snapgasto.backend.dto.ProjectProjectionMonth;
import cl.snapgasto.backend.dto.ProjectRequest;
import cl.snapgasto.backend.dto.ProjectResponse;
import cl.snapgasto.backend.dto.SavingsSummaryResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.ProjectStatus;
import cl.snapgasto.backend.entity.ProjectType;
import cl.snapgasto.backend.service.ProjectService;
import jakarta.validation.Valid;

/** Proyectos (gastos futuros) del usuario autenticado: compras, recurrentes y ahorro. */
@RestController
@RequestMapping("/api/projects")
@Tag(name = "Proyectos", description = "Compras planificadas, gastos recurrentes y metas de ahorro.")
@SecurityRequirement(name = "bearerAuth")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping("/v1/listar")
    public List<ProjectResponse> list(
            @RequestParam(required = false) ProjectType type,
            @RequestParam(required = false) ProjectStatus status,
            @AuthenticationPrincipal AppUser user) {
        return projectService.listFor(user, type, status);
    }

    @GetMapping("/v1/compromisos")
    public ProjectCommitmentsResponse commitments(
            @RequestParam(required = false) String month,
            @AuthenticationPrincipal AppUser user) {
        return projectService.commitments(user, month);
    }

    @GetMapping("/v1/proyeccion")
    public List<ProjectProjectionMonth> projection(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) Integer months,
            @AuthenticationPrincipal AppUser user) {
        return projectService.projection(user, from, months);
    }

    @GetMapping("/v1/ahorro/resumen")
    public SavingsSummaryResponse savingsSummary(
            @RequestParam(required = false) String month,
            @AuthenticationPrincipal AppUser user) {
        return projectService.savingsSummary(user, month);
    }

    @GetMapping("/v1/{projectId}")
    public ProjectResponse get(@PathVariable UUID projectId, @AuthenticationPrincipal AppUser user) {
        return projectService.get(projectId, user);
    }

    @PostMapping("/v1/crear")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse create(@Valid @RequestBody ProjectRequest request, @AuthenticationPrincipal AppUser user) {
        return projectService.create(request, user);
    }

    @PutMapping("/v1/{projectId}/actualizar")
    public ProjectResponse update(
            @PathVariable UUID projectId,
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal AppUser user) {
        return projectService.update(projectId, request, user);
    }

    @DeleteMapping("/v1/{projectId}/eliminar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID projectId, @AuthenticationPrincipal AppUser user) {
        projectService.delete(projectId, user);
    }

    @GetMapping("/v1/{projectId}/movimientos")
    public List<ProjectMovementResponse> movements(@PathVariable UUID projectId, @AuthenticationPrincipal AppUser user) {
        return projectService.listMovements(projectId, user);
    }

    @PostMapping("/v1/{projectId}/movimientos")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectMovementResponse addMovement(
            @PathVariable UUID projectId,
            @Valid @RequestBody ProjectMovementRequest request,
            @AuthenticationPrincipal AppUser user) {
        return projectService.addMovement(projectId, request, user);
    }

    @DeleteMapping("/v1/{projectId}/movimientos/{movementId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMovement(
            @PathVariable UUID projectId,
            @PathVariable UUID movementId,
            @AuthenticationPrincipal AppUser user) {
        projectService.deleteMovement(projectId, movementId, user);
    }

    @PostMapping("/v1/{projectId}/concretar")
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseResponse complete(
            @PathVariable UUID projectId,
            @Valid @RequestBody ProjectCompleteRequest request,
            @AuthenticationPrincipal AppUser user) {
        return projectService.complete(projectId, request, user);
    }

    @PostMapping("/v1/{projectId}/omitir")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void skip(@PathVariable UUID projectId, @RequestParam String month, @AuthenticationPrincipal AppUser user) {
        projectService.skipMonth(projectId, month, user);
    }

    @DeleteMapping("/v1/{projectId}/omitir")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unskip(@PathVariable UUID projectId, @RequestParam String month, @AuthenticationPrincipal AppUser user) {
        projectService.unskipMonth(projectId, month, user);
    }

    @GetMapping("/v1/{projectId}/gastos")
    public List<ExpenseResponse> expenses(@PathVariable UUID projectId, @AuthenticationPrincipal AppUser user) {
        return projectService.listExpenses(projectId, user);
    }
}

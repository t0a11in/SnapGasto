package cl.snapgasto.backend.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import cl.snapgasto.backend.admin.AdminProjectService;
import cl.snapgasto.backend.dto.AdminProjectResponse;
import cl.snapgasto.backend.dto.ProjectRequest;
import jakarta.validation.Valid;

/** Mantenedor administrativo de proyectos. Acepta PUT y PATCH para actualizar (los clientes usan PATCH). */
@RestController
@RequestMapping("/api/admin/projects")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Administración: proyectos", description = "Proyectos de todos los usuarios. Requiere rol ADMIN.")
@SecurityRequirement(name = "bearerAuth")
public class AdminProjectController {

    private final AdminProjectService adminProjectService;

    public AdminProjectController(AdminProjectService adminProjectService) {
        this.adminProjectService = adminProjectService;
    }

    @GetMapping
    public List<AdminProjectResponse> list() {
        return adminProjectService.list();
    }

    @GetMapping("/{projectId}")
    public AdminProjectResponse get(@PathVariable UUID projectId) {
        return adminProjectService.get(projectId);
    }

    @RequestMapping(path = "/{projectId}", method = { RequestMethod.PUT, RequestMethod.PATCH })
    public AdminProjectResponse update(@PathVariable UUID projectId, @Valid @RequestBody ProjectRequest request) {
        return adminProjectService.update(projectId, request);
    }

    @DeleteMapping("/{projectId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID projectId) {
        adminProjectService.delete(projectId);
    }
}

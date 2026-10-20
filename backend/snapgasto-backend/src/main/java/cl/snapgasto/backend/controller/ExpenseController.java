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

import cl.snapgasto.backend.dto.ExpenseRequest;
import cl.snapgasto.backend.dto.ExpenseResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.service.ExpenseService;
import jakarta.validation.Valid;

/** Publica el CRUD mínimo de gastos autenticados. */
@RestController
@RequestMapping("/api/expenses")
@Tag(name = "Gastos", description = "Registro y consulta de gastos del usuario autenticado.")
@SecurityRequirement(name = "bearerAuth")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public List<ExpenseResponse> list(@AuthenticationPrincipal AppUser user) {
        return expenseService.listFor(user);
    }

    /** Endpoints versionados consumidos por las aplicaciones Angular y Flutter. */
    @GetMapping("/v1/listar")
    public List<ExpenseResponse> listV1(
            @RequestParam(required = false) String month,
            @AuthenticationPrincipal AppUser user) {
        return expenseService.listFor(user, month);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseResponse create(@Valid @RequestBody ExpenseRequest request, @AuthenticationPrincipal AppUser user) {
        return expenseService.create(request, user);
    }

    @PostMapping("/v1/crear")
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseResponse createV1(@Valid @RequestBody ExpenseRequest request, @AuthenticationPrincipal AppUser user) {
        return expenseService.create(request, user);
    }

    @PutMapping("/v1/{expenseId}/actualizar")
    public ExpenseResponse update(
            @PathVariable UUID expenseId,
            @Valid @RequestBody ExpenseRequest request,
            @AuthenticationPrincipal AppUser user) {
        return expenseService.update(expenseId, request, user);
    }

    @DeleteMapping("/{expenseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID expenseId, @AuthenticationPrincipal AppUser user) {
        expenseService.delete(expenseId, user);
    }

    @DeleteMapping("/v1/{expenseId}/eliminar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteV1(@PathVariable UUID expenseId, @AuthenticationPrincipal AppUser user) {
        expenseService.delete(expenseId, user);
    }
}

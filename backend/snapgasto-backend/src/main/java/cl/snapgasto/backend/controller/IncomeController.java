package cl.snapgasto.backend.controller;

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

import cl.snapgasto.backend.dto.IncomeMonthlySummaryResponse;
import cl.snapgasto.backend.dto.IncomeRequest;
import cl.snapgasto.backend.dto.IncomeResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.service.IncomeService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

/** API versionada del mantenedor de ingresos del usuario autenticado. */
@RestController
@RequestMapping("/api/incomes")
@Tag(name = "Ingresos", description = "Mantenedor y resumen mensual de ingresos propios.")
@SecurityRequirement(name = "bearerAuth")
public class IncomeController {

    private final IncomeService incomeService;

    public IncomeController(IncomeService incomeService) {
        this.incomeService = incomeService;
    }

    @GetMapping("/v1/listar")
    public List<IncomeResponse> list(
            @RequestParam(required = false) String month,
            @AuthenticationPrincipal AppUser user) {
        return incomeService.listFor(user, month);
    }

    @GetMapping("/v1/resumen")
    public IncomeMonthlySummaryResponse summary(
            @RequestParam(required = false) String month,
            @AuthenticationPrincipal AppUser user) {
        return incomeService.summarizeFor(user, month);
    }

    @PostMapping("/v1/crear")
    @ResponseStatus(HttpStatus.CREATED)
    public IncomeResponse create(@Valid @RequestBody IncomeRequest request, @AuthenticationPrincipal AppUser user) {
        return incomeService.create(request, user);
    }

    @PutMapping("/v1/{incomeId}/actualizar")
    public IncomeResponse update(
            @PathVariable UUID incomeId,
            @Valid @RequestBody IncomeRequest request,
            @AuthenticationPrincipal AppUser user) {
        return incomeService.update(incomeId, request, user);
    }

    @DeleteMapping("/v1/{incomeId}/eliminar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID incomeId, @AuthenticationPrincipal AppUser user) {
        incomeService.delete(incomeId, user);
    }
}

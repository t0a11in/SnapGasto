package cl.snapgasto.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import cl.snapgasto.backend.admin.AdminExpenseService;
import cl.snapgasto.backend.dto.AdminExpenseRequest;
import cl.snapgasto.backend.dto.AdminExpenseResponse;
import jakarta.validation.Valid;

/** Publica el mantenedor administrativo de gastos. */
@RestController
@RequestMapping("/api/admin/expenses")
@PreAuthorize("hasRole('ADMIN')")
public class AdminExpenseController {

    private final AdminExpenseService adminExpenseService;

    public AdminExpenseController(AdminExpenseService adminExpenseService) {
        this.adminExpenseService = adminExpenseService;
    }

    @GetMapping
    public List<AdminExpenseResponse> list() {
        return adminExpenseService.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminExpenseResponse create(@Valid @RequestBody AdminExpenseRequest request) {
        return adminExpenseService.create(request);
    }

    @PutMapping("/{expenseId}")
    public AdminExpenseResponse update(@PathVariable UUID expenseId, @Valid @RequestBody AdminExpenseRequest request) {
        return adminExpenseService.update(expenseId, request);
    }

    @DeleteMapping("/{expenseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID expenseId) {
        adminExpenseService.delete(expenseId);
    }
}

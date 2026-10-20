package cl.snapgasto.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import cl.snapgasto.backend.dto.ExpenseGroupCreateRequest;
import cl.snapgasto.backend.dto.ExpenseGroupMemberRequest;
import cl.snapgasto.backend.dto.ExpenseGroupMonthlySummaryResponse;
import cl.snapgasto.backend.dto.ExpenseGroupResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.service.ExpenseGroupService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

/** API para compartir gastos y consultarlos de manera agregada. */
@RestController
@RequestMapping("/api/groups")
@Tag(name = "Grupos de gastos", description = "Grupos privados para compartir y controlar gastos entre integrantes.")
@SecurityRequirement(name = "bearerAuth")
public class ExpenseGroupController {

    private final ExpenseGroupService expenseGroupService;

    public ExpenseGroupController(ExpenseGroupService expenseGroupService) {
        this.expenseGroupService = expenseGroupService;
    }

    @GetMapping
    public List<ExpenseGroupResponse> list(@AuthenticationPrincipal AppUser user) {
        return expenseGroupService.listFor(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseGroupResponse create(
            @Valid @RequestBody ExpenseGroupCreateRequest request,
            @AuthenticationPrincipal AppUser user) {
        return expenseGroupService.create(request, user);
    }

    @PostMapping("/{groupId}/members")
    public ExpenseGroupResponse addMember(
            @PathVariable UUID groupId,
            @Valid @RequestBody ExpenseGroupMemberRequest request,
            @AuthenticationPrincipal AppUser user) {
        return expenseGroupService.addMember(groupId, request, user);
    }

    @DeleteMapping("/{groupId}/members/{memberId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(
            @PathVariable UUID groupId,
            @PathVariable UUID memberId,
            @AuthenticationPrincipal AppUser user) {
        expenseGroupService.removeMember(groupId, memberId, user);
    }

    @GetMapping("/{groupId}/summary")
    public ExpenseGroupMonthlySummaryResponse summary(
            @PathVariable UUID groupId,
            @RequestParam(required = false) String month,
            @AuthenticationPrincipal AppUser user) {
        return expenseGroupService.summarize(groupId, month, user);
    }
}

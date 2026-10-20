package cl.snapgasto.backend.service;

import java.util.List;
import java.time.YearMonth;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.ExpenseRequest;
import cl.snapgasto.backend.dto.ExpenseResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Expense;
import cl.snapgasto.backend.entity.ExpenseGroup;
import cl.snapgasto.backend.repository.ExpenseRepository;

/** Gestiona gastos sin permitir el acceso a movimientos de otros usuarios. */
@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final GroupAccessService groupAccessService;

    public ExpenseService(ExpenseRepository expenseRepository, GroupAccessService groupAccessService) {
        this.expenseRepository = expenseRepository;
        this.groupAccessService = groupAccessService;
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> listFor(AppUser user) {
        return expenseRepository.findAllByUserOrderByDateDescCreatedAtDesc(user).stream()
                .map(ExpenseResponse::from)
                .toList();
    }

    /**
     * Consulta el mantenedor versionado. Si no se indica mes conserva la
     * semántica del listado histórico para clientes anteriores.
     */
    @Transactional(readOnly = true)
    public List<ExpenseResponse> listFor(AppUser user, String month) {
        if (month == null || month.isBlank()) {
            return listFor(user);
        }

        final YearMonth selectedMonth;
        try {
            selectedMonth = YearMonth.parse(month);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El mes debe tener formato AAAA-MM.");
        }

        return expenseRepository.findAllByUserAndDateBetweenOrderByDateDescCreatedAtDesc(
                user,
                selectedMonth.atDay(1),
                selectedMonth.atEndOfMonth()).stream()
                .map(ExpenseResponse::from)
                .toList();
    }

    @Transactional
    public ExpenseResponse create(ExpenseRequest request, AppUser user) {
        Expense expense = new Expense();
        expense.setAmount(request.amount());
        expense.setCategory(request.category().trim());
        expense.setDate(request.date());
        expense.setDescription(normalizeOptional(request.description()));
        expense.setPaymentMethod(request.paymentMethod().trim());
        expense.setUser(user);
        expense.setExpenseGroup(resolveExpenseGroup(request.groupId(), user));
        return ExpenseResponse.from(expenseRepository.save(expense));
    }

    @Transactional
    public void delete(UUID expenseId, AppUser user) {
        Expense expense = expenseRepository.findByIdAndUser(expenseId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gasto no encontrado."));
        expenseRepository.delete(expense);
    }

    @Transactional
    public ExpenseResponse update(UUID expenseId, ExpenseRequest request, AppUser user) {
        Expense expense = expenseRepository.findByIdAndUser(expenseId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gasto no encontrado."));
        expense.setAmount(request.amount());
        expense.setCategory(request.category().trim());
        expense.setDate(request.date());
        expense.setDescription(normalizeOptional(request.description()));
        expense.setPaymentMethod(request.paymentMethod().trim());
        expense.setExpenseGroup(resolveExpenseGroup(request.groupId(), user));
        return ExpenseResponse.from(expenseRepository.save(expense));
    }

    private ExpenseGroup resolveExpenseGroup(UUID groupId, AppUser user) {
        return groupId == null ? null : groupAccessService.requireMember(groupId, user);
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

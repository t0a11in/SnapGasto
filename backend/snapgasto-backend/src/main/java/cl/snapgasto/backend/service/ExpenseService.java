package cl.snapgasto.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.ExpenseRequest;
import cl.snapgasto.backend.dto.ExpenseResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Expense;
import cl.snapgasto.backend.repository.ExpenseRepository;

/** Gestiona gastos sin permitir el acceso a movimientos de otros usuarios. */
@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> listFor(AppUser user) {
        return expenseRepository.findAllByUserOrderByDateDescCreatedAtDesc(user).stream()
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
        return ExpenseResponse.from(expenseRepository.save(expense));
    }

    @Transactional
    public void delete(UUID expenseId, AppUser user) {
        Expense expense = expenseRepository.findByIdAndUser(expenseId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gasto no encontrado."));
        expenseRepository.delete(expense);
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

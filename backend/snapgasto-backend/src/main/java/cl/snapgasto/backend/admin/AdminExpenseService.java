package cl.snapgasto.backend.admin;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.AdminExpenseRequest;
import cl.snapgasto.backend.dto.AdminExpenseResponse;
import cl.snapgasto.backend.entity.Expense;
import cl.snapgasto.backend.repository.ExpenseRepository;
import cl.snapgasto.backend.repository.UserRepository;

/** Implementa el mantenedor administrativo de gastos de todos los usuarios. */
@Service
public class AdminExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public AdminExpenseService(ExpenseRepository expenseRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminExpenseResponse> list() {
        return expenseRepository.findAllByOrderByDateDescCreatedAtDesc().stream().map(AdminExpenseResponse::from).toList();
    }

    @Transactional
    public AdminExpenseResponse create(AdminExpenseRequest request) {
        Expense expense = new Expense();
        apply(request, expense);
        return AdminExpenseResponse.from(expenseRepository.save(expense));
    }

    @Transactional
    public AdminExpenseResponse update(UUID expenseId, AdminExpenseRequest request) {
        Expense expense = getExpense(expenseId);
        apply(request, expense);
        return AdminExpenseResponse.from(expense);
    }

    @Transactional
    public void delete(UUID expenseId) {
        expenseRepository.delete(getExpense(expenseId));
    }

    private void apply(AdminExpenseRequest request, Expense expense) {
        expense.setUser(userRepository.findById(request.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado.")));
        expense.setAmount(request.amount());
        expense.setCategory(request.category().trim());
        expense.setDate(request.date());
        expense.setDescription(request.description() == null || request.description().isBlank() ? null : request.description().trim());
        expense.setPaymentMethod(request.paymentMethod().trim());
    }

    private Expense getExpense(UUID expenseId) {
        return expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gasto no encontrado."));
    }
}

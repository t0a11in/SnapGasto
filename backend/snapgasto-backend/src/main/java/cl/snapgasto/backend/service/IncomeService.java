package cl.snapgasto.backend.service;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.IncomeMonthlySummaryResponse;
import cl.snapgasto.backend.dto.IncomeRequest;
import cl.snapgasto.backend.dto.IncomeResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Income;
import cl.snapgasto.backend.entity.IncomeType;
import cl.snapgasto.backend.repository.IncomeRepository;

/** Caso de uso de mantenedor y resumen mensual de ingresos del usuario autenticado. */
@Service
public class IncomeService {

    private final IncomeRepository incomeRepository;

    public IncomeService(IncomeRepository incomeRepository) {
        this.incomeRepository = incomeRepository;
    }

    @Transactional(readOnly = true)
    public List<IncomeResponse> listFor(AppUser user, String requestedMonth) {
        return findForMonth(user, resolveMonth(requestedMonth)).stream()
                .map(IncomeResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public IncomeMonthlySummaryResponse summarizeFor(AppUser user, String requestedMonth) {
        YearMonth month = resolveMonth(requestedMonth);
        BigDecimal totalTarjeta = BigDecimal.ZERO;
        BigDecimal totalFisico = BigDecimal.ZERO;

        for (Income income : findForMonth(user, month)) {
            if (income.getType() == IncomeType.TARJETA) {
                totalTarjeta = totalTarjeta.add(income.getAmount());
            } else if (income.getType() == IncomeType.FISICO) {
                totalFisico = totalFisico.add(income.getAmount());
            }
        }

        return new IncomeMonthlySummaryResponse(
                month.toString(),
                totalTarjeta,
                totalFisico,
                totalTarjeta.add(totalFisico));
    }

    @Transactional
    public IncomeResponse create(IncomeRequest request, AppUser user) {
        Income income = new Income();
        applyRequest(income, request);
        income.setUser(user);
        return IncomeResponse.from(incomeRepository.save(income));
    }

    @Transactional
    public IncomeResponse update(UUID incomeId, IncomeRequest request, AppUser user) {
        Income income = findOwnedIncome(incomeId, user);
        applyRequest(income, request);
        return IncomeResponse.from(incomeRepository.save(income));
    }

    @Transactional
    public void delete(UUID incomeId, AppUser user) {
        incomeRepository.delete(findOwnedIncome(incomeId, user));
    }

    private List<Income> findForMonth(AppUser user, YearMonth month) {
        return incomeRepository.findAllByUserAndDateBetweenOrderByDateDescCreatedAtDesc(
                user,
                month.atDay(1),
                month.atEndOfMonth());
    }

    private Income findOwnedIncome(UUID incomeId, AppUser user) {
        return incomeRepository.findByIdAndUser(incomeId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ingreso no encontrado."));
    }

    private YearMonth resolveMonth(String requestedMonth) {
        if (requestedMonth == null || requestedMonth.isBlank()) {
            return YearMonth.now();
        }
        try {
            return YearMonth.parse(requestedMonth.trim());
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El mes debe usar el formato AAAA-MM.");
        }
    }

    private void applyRequest(Income income, IncomeRequest request) {
        income.setAmount(request.amount());
        income.setType(request.type());
        income.setDate(request.date());
        income.setDescription(normalizeOptional(request.description()));
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

package cl.snapgasto.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Datos necesarios para abrir un grupo de gastos compartidos. */
public record ExpenseGroupCreateRequest(
        @NotBlank(message = "El nombre del grupo es obligatorio.")
        @Size(max = 100, message = "El nombre del grupo no puede superar 100 caracteres.")
        String name) {
}

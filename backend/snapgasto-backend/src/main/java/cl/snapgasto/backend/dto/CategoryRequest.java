package cl.snapgasto.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Define los datos editables desde el mantenedor de categorías. */
public record CategoryRequest(
        @NotBlank(message = "El nombre es obligatorio.") @Size(max = 80) String name,
        @Size(max = 80) String icon,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "El color debe usar formato hexadecimal #RRGGBB.") String colorHex) {
}

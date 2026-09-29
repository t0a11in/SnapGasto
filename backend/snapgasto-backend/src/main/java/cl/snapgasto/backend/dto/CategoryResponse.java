package cl.snapgasto.backend.dto;

import java.util.UUID;

import cl.snapgasto.backend.entity.Category;

/** Expone una categoría para el cliente administrativo. */
public record CategoryResponse(UUID id, String name, String icon, String colorHex) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getIcon(), category.getColorHex());
    }
}

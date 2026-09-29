package cl.snapgasto.backend.admin;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.CategoryRequest;
import cl.snapgasto.backend.dto.CategoryResponse;
import cl.snapgasto.backend.entity.Category;
import cl.snapgasto.backend.repository.CategoryRepository;

/** Implementa el mantenedor de categorías configurables. */
@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list() {
        return categoryRepository.findAllByOrderByNameAsc().stream().map(CategoryResponse::from).toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.name().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una categoría con ese nombre.");
        }
        Category category = new Category();
        apply(request, category);
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(UUID categoryId, CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(request.name().trim(), categoryId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una categoría con ese nombre.");
        }
        Category category = getCategory(categoryId);
        apply(request, category);
        return CategoryResponse.from(category);
    }

    @Transactional
    public void delete(UUID categoryId) {
        categoryRepository.delete(getCategory(categoryId));
    }

    private void apply(CategoryRequest request, Category category) {
        category.setName(request.name().trim());
        category.setIcon(normalizeOptional(request.icon()));
        category.setColorHex(normalizeOptional(request.colorHex()));
    }

    private Category getCategory(UUID categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoría no encontrada."));
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

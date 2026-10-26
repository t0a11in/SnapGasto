package cl.snapgasto.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import cl.snapgasto.backend.dto.ProjectMovementRequest;
import cl.snapgasto.backend.dto.ProjectResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.ProjectMovementKind;
import cl.snapgasto.backend.entity.ProjectType;
import cl.snapgasto.backend.service.ProjectService;

@ExtendWith(MockitoExtension.class)
class ProjectControllerTest {

    @Mock private ProjectService projectService;

    private ProjectController controller;
    private AppUser user;

    @BeforeEach
    void setUp() {
        controller = new ProjectController(projectService);
        user = new AppUser();
        user.setId(UUID.randomUUID());
    }

    @Test
    void delegatesFiltersAndTheAuthenticatedUserWhenListing() {
        List<ProjectResponse> expected = List.of();
        when(projectService.listFor(user, ProjectType.AHORRO, null)).thenReturn(expected);

        assertEquals(expected, controller.list(ProjectType.AHORRO, null, user));
    }

    @Test
    void delegatesMonthlyEndpoints() {
        controller.commitments("2026-10", user);
        controller.projection("2026-10", 12, user);
        controller.savingsSummary("2026-10", user);

        verify(projectService).commitments(user, "2026-10");
        verify(projectService).projection(user, "2026-10", 12);
        verify(projectService).savingsSummary(user, "2026-10");
    }

    @Test
    void delegatesMovementsSkipsAndDeletion() {
        UUID id = UUID.randomUUID();
        ProjectMovementRequest movement = new ProjectMovementRequest(ProjectMovementKind.APORTE, BigDecimal.TEN,
                LocalDate.now(), null);

        controller.addMovement(id, movement, user);
        controller.skip(id, "2026-11", user);
        controller.unskip(id, "2026-11", user);
        controller.delete(id, user);

        verify(projectService).addMovement(id, movement, user);
        verify(projectService).skipMonth(id, "2026-11", user);
        verify(projectService).unskipMonth(id, "2026-11", user);
        verify(projectService).delete(id, user);
    }
}

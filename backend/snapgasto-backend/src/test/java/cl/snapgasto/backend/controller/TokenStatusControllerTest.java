package cl.snapgasto.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import cl.snapgasto.backend.dto.TokenStatusResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.service.TokenStatusService;

@ExtendWith(MockitoExtension.class)
class TokenStatusControllerTest {

    @Mock
    private TokenStatusService tokenStatusService;

    @Test
    void delegatesTheAuthenticatedPrincipalToTheTokenStatusService() {
        AppUser user = new AppUser();
        TokenStatusResponse expected = new TokenStatusResponse(true);
        when(tokenStatusService.check(user)).thenReturn(expected);
        TokenStatusController controller = new TokenStatusController(tokenStatusService);

        assertEquals(expected, controller.tokenStatus(user));
        verify(tokenStatusService).check(user);
    }
}

package cl.snapgasto.backend.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.TokenStatusResponse;
import cl.snapgasto.backend.entity.AppUser;

class TokenStatusServiceTest {

    private final TokenStatusService service = new TokenStatusService();

    @Test
    void reportsTheTokenAliveForAnAuthenticatedPrincipal() {
        TokenStatusResponse response = service.check(new AppUser());

        assertTrue(response.tokenAlive());
    }

    @Test
    void rejectsARequestWithoutAnAuthenticatedPrincipal() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> service.check(null));

        assertFalse(exception.getStatusCode().is2xxSuccessful());
    }
}

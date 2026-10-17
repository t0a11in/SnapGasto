package cl.snapgasto.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import cl.snapgasto.backend.dto.AuthResponse;
import cl.snapgasto.backend.dto.UserResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Role;
import cl.snapgasto.backend.service.TokenRefreshService;

@ExtendWith(MockitoExtension.class)
class TokenRefreshControllerTest {

    @Mock
    private TokenRefreshService tokenRefreshService;

    private TokenRefreshController controller;
    private AppUser user;

    @BeforeEach
    void setUp() {
        controller = new TokenRefreshController(tokenRefreshService);
        user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setFullName("Ada Lovelace");
        user.setEmail("ada@example.com");
        user.setRole(Role.USER);
    }

    @Test
    void delegatesTokenRenewalToTheSessionService() {
        AuthResponse expected = new AuthResponse("renewed-access-token", UserResponse.from(user));
        when(tokenRefreshService.refresh(user)).thenReturn(expected);

        AuthResponse response = controller.refresh(user);

        assertEquals(expected, response);
        verify(tokenRefreshService).refresh(user);
    }
}

package cl.snapgasto.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Role;
import cl.snapgasto.backend.repository.RevokedTokenRepository;
import cl.snapgasto.backend.repository.UserRepository;
import cl.snapgasto.backend.security.JwtService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TokenExpirationEndpointIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RevokedTokenRepository revokedTokenRepository;

    @Autowired
    private JwtService jwtService;

    private AppUser user;
    private String token;

    @BeforeEach
    void setUp() {
        revokedTokenRepository.deleteAll();
        userRepository.deleteAll();
        user = new AppUser();
        user.setFullName("Expiration Test");
        user.setEmail("token-expiration@example.com");
        user.setPassword("not-used-by-jwt-expiration");
        user.setRole(Role.USER);
        user = userRepository.save(user);
        token = jwtService.generateToken(user);
    }

    @Test
    void logoutRevokesTheBearerTokenAndRejectsItAfterward() throws Exception {
        mockMvc.perform(post("/api/auth/v1/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/auth/v1/token-status").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", "Bearer"))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("No autorizado."));
    }

    @Test
    void logoutAllInvalidatesEveryTokenOfTheUser() throws Exception {
        String otherDeviceToken = jwtService.generateToken(user, java.time.Instant.now().minusSeconds(60));

        mockMvc.perform(post("/api/auth/v1/logout-all").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/auth/v1/token-status").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/v1/token-status").header("Authorization", "Bearer " + otherDeviceToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void keepsTheDeprecatedGetExpireTokenWorkingForOlderClients() throws Exception {
        mockMvc.perform(get("/api/auth/v1/expire-token").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/auth/v1/token-status").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requiresABearerTokenToLogOut() throws Exception {
        mockMvc.perform(post("/api/auth/v1/logout"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("No autorizado."));
    }
}

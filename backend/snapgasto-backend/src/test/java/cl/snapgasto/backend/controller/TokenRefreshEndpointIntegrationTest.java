package cl.snapgasto.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
class TokenRefreshEndpointIntegrationTest {

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
        user.setFullName("Refresh Test");
        user.setEmail("refresh@example.com");
        user.setPassword("not-used-by-jwt-refresh");
        user.setRole(Role.USER);
        user = userRepository.save(user);
        token = jwtService.generateToken(user);
    }

    @Test
    void rejectsTokenRenewalWithoutABearerToken() throws Exception {
        mockMvc.perform(post("/api/auth/v1/refresh"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("No autorizado."));
    }

    @Test
    void renewsTheTokenAndRevokesThePreviousOne() throws Exception {
        String body = mockMvc.perform(post("/api/auth/v1/refresh").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("refresh@example.com"))
                .andReturn().getResponse().getContentAsString();
        Matcher matcher = Pattern.compile("\"accessToken\"\\s*:\\s*\"([^\"]+)\"").matcher(body);
        org.junit.jupiter.api.Assertions.assertTrue(matcher.find());
        String renewed = matcher.group(1);

        mockMvc.perform(get("/api/auth/v1/token-status").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/v1/token-status").header("Authorization", "Bearer " + renewed))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenAlive").value(true));
    }

    @Test
    void refusesToExtendASessionBeyondItsMaximumDuration() throws Exception {
        // application-test.yaml fija max-session-hours en 168.
        String oldSession = jwtService.generateToken(user, Instant.now().minus(Duration.ofHours(169)));

        mockMvc.perform(post("/api/auth/v1/refresh").header("Authorization", "Bearer " + oldSession))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message")
                        .value("La sesión superó su duración máxima. Inicia sesión nuevamente."));
    }
}

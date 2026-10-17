package cl.snapgasto.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
    private JwtService jwtService;

    private String token;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        AppUser user = new AppUser();
        user.setFullName("Refresh Test");
        user.setEmail("refresh@example.com");
        user.setPassword("not-used-by-jwt-refresh");
        user.setRole(Role.USER);
        userRepository.save(user);
        token = jwtService.generateToken(user.getEmail());
    }

    @Test
    void rejectsTokenRenewalWithoutABearerToken() throws Exception {
        mockMvc.perform(post("/api/auth/v1/refresh"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("No autorizado."));
    }

    @Test
    void renewsTheTokenForAnAuthenticatedSession() throws Exception {
        mockMvc.perform(post("/api/auth/v1/refresh").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("refresh@example.com"));
    }
}

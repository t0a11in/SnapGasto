package cl.snapgasto.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "app.security.rate-limit.auth-requests-per-minute=3")
class AuthRateLimitIntegrationTest {

    private static final String BODY = "{\"email\":\"nobody@example.com\",\"password\":\"wrong-password\"}";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returns429WithRetryAfterWhenAnIpExceedsTheLoginRateLimit() throws Exception {
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(BODY))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.code").value("TOO_MANY_REQUESTS"));
    }
}
